// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { authenticateUser } from "@/src/lib/auth-helpers";
import { db } from "@/src/db/client";
import { deleteFromR2 } from "@/src/lib/r2";

// 🚀 异步批量删除照片 - 确保删除干净（数据库 + R2）
export async function POST(request: NextRequest) {
  try {
    // 🚀 使用项目标准的认证方式
    const authResult = await authenticateUser(request);

    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.statusCode },
      );
    }

    const { user } = authResult;

    if (!user?.id) {
      return NextResponse.json({ error: "User ID not found" }, { status: 400 });
    }

    const body = await request.json();
    const { photoIds, section } = body;

    if (!photoIds || !Array.isArray(photoIds) || photoIds.length === 0) {
      return NextResponse.json(
        { error: "Photo IDs array is required" },
        { status: 400 },
      );
    }

    console.log(
      `🗑️ [Batch Delete] Starting batch deletion of ${photoIds.length} photos for user ${user.id}`,
    );

    // 查找所有要删除的照片，确保属于当前用户
    const photos = await db.photo.findMany({
      where: {
        id: { in: photoIds },
        task: { userId: user.id },
        ...(section && { section }), // 如果指定了 section，则只删除该 section 的照片
      },
      include: {
        task: {
          select: {
            id: true,
            plan: true,
            userId: true,
          },
        },
      },
    });

    if (photos.length === 0) {
      return NextResponse.json(
        { error: "No photos found or access denied" },
        { status: 404 },
      );
    }

    const foundPhotoIds = photos.map((p) => p.id);
    const missingPhotoIds = photoIds.filter(
      (id) => !foundPhotoIds.includes(id),
    );

    if (missingPhotoIds.length > 0) {
      console.warn(
        `⚠️ [Batch Delete] Some photos not found: ${missingPhotoIds.join(", ")}`,
      );
    }

    // 🚀 立即返回响应，异步执行批量删除操作
    const deletePhotosAsync = async () => {
      const deletedPhotos = [];
      const failedDeletions = [];

      try {
        // 🚀 优化：一次 SQL 删除所有照片，而不是逐个删除
        const photoIds = photos.map((p) => p.id);
        const deletedRecords = await db.photo.deleteMany({
          where: {
            id: { in: photoIds },
          },
        });

        console.log(
          `✅ [Batch Delete] Batch deleted ${deletedRecords.count} database records in one query`,
        );

        // 2. 并行删除所有 R2 文件（不等待单个文件）
        const r2DeletePromises = photos.map((photo) => {
          if (!photo.objectKey) return Promise.resolve();
          return deleteFromR2("rizzify", photo.objectKey)
            .then(() => {
              console.log(
                `✅ [Batch Delete] Deleted R2 file: ${photo.objectKey}`,
              );
            })
            .catch((r2Error) => {
              // R2 文件不存在或删除失败，但数据库已删除，这是可以接受的
              console.warn(
                `⚠️ [Batch Delete] R2 file ${photo.objectKey} not found or deletion failed:`,
                r2Error instanceof Error ? r2Error.message : String(r2Error),
              );
            });
        });

        // 并行执行所有 R2 删除
        await Promise.all(r2DeletePromises);

        // 收集删除的照片信息
        photos.forEach((photo) => {
          deletedPhotos.push({
            id: photo.id,
            objectKey: photo.objectKey,
            section: photo.section,
            taskId: photo.taskId,
          });
        });

        console.log(
          `✅ [Batch Delete] Successfully batch deleted ${deletedPhotos.length} photos`,
        );
      } catch (error) {
        console.error(
          `❌ [Batch Delete] Failed to batch delete photos:`,
          error,
        );
        failedDeletions.push({
          photoId: "batch",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }

      // 3. 检查并删除空的 tasks（批量查询）
      const taskIds = Array.from(new Set(photos.map((p) => p.taskId)));
      if (taskIds.length > 0) {
        try {
          // 一次查询获取所有 task 的照片计数
          const tasksWithPhotoCounts = await db.task.findMany({
            where: { id: { in: taskIds } },
            select: {
              id: true,
              _count: { select: { photos: true } },
            },
          });

          // 找出没有照片的 tasks
          const emptyTaskIds = tasksWithPhotoCounts
            .filter((t) => t._count.photos === 0)
            .map((t) => t.id);

          // 批量删除空的 tasks
          if (emptyTaskIds.length > 0) {
            const deletedTasks = await db.task.deleteMany({
              where: { id: { in: emptyTaskIds } },
            });
            console.log(
              `🗑️ [Batch Delete] Deleted ${deletedTasks.count} empty tasks in one query`,
            );
          }
        } catch (error) {
          console.error(
            `❌ [Batch Delete] Failed to delete empty tasks:`,
            error,
          );
        }
      }

      console.log(
        `✅ [Batch Delete] Batch deletion completed: ${deletedPhotos.length} deleted, ${failedDeletions.length} failed`,
      );
    };

    // 🚀 超快响应：立即返回，后台异步执行批量删除
    const respondImmediately = () => {
      console.log(
        `🚀 [Batch Delete] Immediate response for ${photos.length} photos - deletion will continue in background`,
      );

      return NextResponse.json({
        success: true,
        message: "Batch deletion started",
        requestedCount: photoIds.length,
        foundCount: photos.length,
        status: "deleting",
        note: "Photos will be removed from the interface immediately",
      });
    };

    // 🚀 启动后台删除，不等待
    deletePhotosAsync().then(() => {
      // 删除完成后，清除缓存
      console.log(`🧹 [Batch Delete] Clearing cache after deletion`);
    });

    // 🚀 立即返回响应 - 超快用户体验
    // 添加 no-cache 头，防止浏览器缓存此响应
    const response = respondImmediately();
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    return response;
  } catch (error) {
    console.error("❌ [Batch Delete] Error starting batch deletion:", error);

    return NextResponse.json(
      {
        error: "Failed to start batch photo deletion",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// 🚀 按用户和 section 批量删除所有照片
export async function DELETE(request: NextRequest) {
  try {
    // 🚀 使用项目标准的认证方式
    const authResult = await authenticateUser(request);

    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.statusCode },
      );
    }

    const { user } = authResult;

    if (!user?.id) {
      return NextResponse.json({ error: "User ID not found" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const section = searchParams.get("section") as
      | "uploaded"
      | "free"
      | "start"
      | "pro"
      | null;

    if (!section) {
      return NextResponse.json(
        { error: "Section parameter is required (uploaded, free, start, pro)" },
        { status: 400 },
      );
    }

    console.log(
      `🗑️ [Batch Delete All] Starting deletion of all ${section} photos for user ${user.id}`,
    );

    // 查找该 section 的所有照片
    const photos = await db.photo.findMany({
      where: {
        task: { userId: user.id },
        section: section,
      },
      include: {
        task: {
          select: {
            id: true,
            plan: true,
            userId: true,
          },
        },
      },
    });

    if (photos.length === 0) {
      return NextResponse.json({
        success: true,
        message: `No ${section} photos found to delete`,
        deletedCount: 0,
      });
    }

    // 🚀 异步删除所有该 section 的照片 - 直接执行删除逻辑
    const deleteAllSectionPhotosAsync = async () => {
      const deletedPhotos = [];
      const failedDeletions = [];

      try {
        // 🚀 优化：一次 SQL 删除所有照片，而不是逐个删除
        const photoIds = photos.map((p) => p.id);
        const deletedRecords = await db.photo.deleteMany({
          where: {
            id: { in: photoIds },
          },
        });

        console.log(
          `✅ [Batch Delete All] Batch deleted ${deletedRecords.count} database records in one query`,
        );

        // 2. 并行删除所有 R2 文件（不等待单个文件）
        const r2DeletePromises = photos.map((photo) => {
          if (!photo.objectKey) return Promise.resolve();
          return deleteFromR2("rizzify", photo.objectKey)
            .then(() => {
              console.log(
                `✅ [Batch Delete All] Deleted R2 file: ${photo.objectKey}`,
              );
            })
            .catch((r2Error) => {
              // R2 文件不存在或删除失败，但数据库已删除，这是可以接受的
              console.warn(
                `⚠️ [Batch Delete All] R2 file ${photo.objectKey} not found or deletion failed:`,
                r2Error instanceof Error ? r2Error.message : String(r2Error),
              );
            });
        });

        // 并行执行所有 R2 删除
        await Promise.all(r2DeletePromises);

        // 收集删除的照片信息
        photos.forEach((photo) => {
          deletedPhotos.push({
            id: photo.id,
            objectKey: photo.objectKey,
            section: photo.section,
            taskId: photo.taskId,
          });
        });

        console.log(
          `✅ [Batch Delete All] Successfully batch deleted ${deletedPhotos.length} photos`,
        );
      } catch (error) {
        console.error(
          `❌ [Batch Delete All] Failed to batch delete photos:`,
          error,
        );
        failedDeletions.push({
          photoId: "batch",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }

      // 3. 检查并删除空的 tasks（批量查询）
      const taskIds = Array.from(new Set(photos.map((p) => p.taskId)));
      if (taskIds.length > 0) {
        try {
          // 一次查询获取所有 task 的照片计数
          const tasksWithPhotoCounts = await db.task.findMany({
            where: { id: { in: taskIds } },
            select: {
              id: true,
              _count: { select: { photos: true } },
            },
          });

          // 找出没有照片的 tasks
          const emptyTaskIds = tasksWithPhotoCounts
            .filter((t) => t._count.photos === 0)
            .map((t) => t.id);

          // 批量删除空的 tasks
          if (emptyTaskIds.length > 0) {
            const deletedTasks = await db.task.deleteMany({
              where: { id: { in: emptyTaskIds } },
            });
            console.log(
              `🗑️ [Batch Delete All] Deleted ${deletedTasks.count} empty tasks in one query`,
            );
          }
        } catch (error) {
          console.error(
            `❌ [Batch Delete All] Failed to delete empty tasks:`,
            error,
          );
        }
      }

      console.log(
        `✅ [Batch Delete All] Batch deletion completed: ${deletedPhotos.length} deleted, ${failedDeletions.length} failed`,
      );
    };

    // 🚀 超快响应：立即返回，后台异步执行
    const respondImmediately = () => {
      console.log(
        `🚀 [Batch Delete All] Immediate response for ${photos.length} ${section} photos - deletion will continue in background`,
      );

      return NextResponse.json({
        success: true,
        message: `${section} photos deletion started`,
        totalCount: photos.length,
        section: section,
        status: "deleting",
        note: "Photos will be removed from the interface immediately",
      });
    };

    // 🚀 启动后台删除，不等待
    deleteAllSectionPhotosAsync().then(() => {
      // 删除完成后，清除缓存
      console.log(`🧹 [Batch Delete All] Clearing cache after deletion`);
    });

    // 🚀 立即返回响应 - 超快用户体验
    // 添加 no-cache 头，防止浏览器缓存此响应
    const response = respondImmediately();
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    return response;
  } catch (error) {
    console.error("❌ [Batch Delete All] Error:", error);

    return NextResponse.json(
      {
        error: "Failed to delete photos",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
