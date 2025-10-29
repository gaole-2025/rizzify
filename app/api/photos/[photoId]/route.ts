import { NextRequest, NextResponse } from "next/server";
import { authenticateUser } from "@/src/lib/auth-helpers";
import { db } from "@/src/db/client";
import { deleteFromR2 } from "@/src/lib/r2";

// 🚀 异步删除单个照片 - 确保删除干净（数据库 + R2）
export async function DELETE(
  request: NextRequest,
  { params }: { params: { photoId: string } },
) {
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
    const photoId = params.photoId;

    if (!photoId) {
      return NextResponse.json(
        { error: "Photo ID is required" },
        { status: 400 },
      );
    }

    if (!user?.id) {
      return NextResponse.json({ error: "User ID not found" }, { status: 400 });
    }

    return await deletePhotoLogic(photoId, user.id);
  } catch (error) {
    console.error("❌ [Delete Photo] Error:", error);

    return NextResponse.json(
      {
        error: "Failed to start photo deletion",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// 🚀 提取删除逻辑为独立函数
async function deletePhotoLogic(
  photoId: string,
  userId: string,
): Promise<NextResponse> {
  try {
    // 查找照片，确保属于当前用户
    console.log(
      `🔍 [Delete Photo] Looking for photo ${photoId} for user ${userId}`,
    );

    const photo = await db.photo.findFirst({
      where: {
        id: photoId,
        task: { userId },
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

    if (!photo) {
      console.warn(
        `⚠️ [Delete Photo] Photo ${photoId} not found for user ${userId}`,
      );

      // 检查照片是否存在但不属于当前用户
      const anyPhoto = await db.photo.findFirst({
        where: { id: photoId },
        include: {
          task: {
            select: {
              userId: true,
            },
          },
        },
      });

      if (anyPhoto) {
        console.warn(
          `⚠️ [Delete Photo] Photo ${photoId} exists but belongs to user ${anyPhoto.task.userId}, not ${userId}`,
        );
        return NextResponse.json(
          { error: "Access denied - photo belongs to another user" },
          { status: 403 },
        );
      } else {
        console.warn(
          `⚠️ [Delete Photo] Photo ${photoId} does not exist in database`,
        );
        return NextResponse.json({ error: "Photo not found" }, { status: 404 });
      }
    }

    console.log(
      `🗑️ [Delete Photo] Starting async deletion of photo ${photoId} for user ${userId}`,
    );

    // 🚀 超快响应：立即返回，后台异步执行删除
    // 优化：用户不需要等待任何数据库操作完成
    const respondImmediately = () => {
      console.log(
        `🚀 [Delete Photo] Immediate response for photo ${photoId} - deletion will continue in background`,
      );

      return NextResponse.json({
        success: true,
        message: "Photo deletion started",
        photoId: photoId,
        status: "deleting",
        note: "Photo will be removed from the interface immediately",
      });
    };

    // 🚀 异步删除操作 - 不阻塞响应
    const deletePhotoInBackground = async () => {
      try {
        console.log(
          `🔄 [Delete Photo] Background deletion started for photo ${photoId}`,
        );

        // 1. 先从数据库删除照片记录
        await db.photo.delete({
          where: { id: photoId },
        });

        console.log(
          `✅ [Delete Photo] Background: Deleted database record for photo ${photoId}`,
        );

        // 2. 尝试从 R2 存储删除文件（非阻塞）
        if (photo.objectKey) {
          // 不等待R2删除完成，使用Promise但不await
          deleteFromR2("rizzify", photo.objectKey)
            .then(() =>
              console.log(
                `✅ [Delete Photo] Background: Deleted R2 file: ${photo.objectKey}`,
              ),
            )
            .catch((r2Error) =>
              console.warn(
                `⚠️ [Delete Photo] Background: R2 file issue: ${r2Error.message}`,
              ),
            );
        }

        // 3. 检查是否需要删除整个 task（异步）
        const checkAndDeleteTask = async () => {
          try {
            const remainingPhotosCount = await db.photo.count({
              where: { taskId: photo.taskId },
            });

            if (remainingPhotosCount === 0) {
              await db.task.delete({
                where: { id: photo.taskId },
              });
              console.log(
                `🗑️ [Delete Photo] Background: Deleted empty task ${photo.taskId}`,
              );
            }
          } catch (taskError) {
            console.warn(
              `⚠️ [Delete Photo] Background: Task cleanup issue:`,
              taskError instanceof Error
                ? taskError.message
                : String(taskError),
            );
          }
        };

        // 不等待task删除完成
        checkAndDeleteTask();

        console.log(
          `✅ [Delete Photo] Background: Core deletion completed for photo ${photoId}`,
        );
      } catch (error) {
        console.error(
          `❌ [Delete Photo] Background deletion failed for photo ${photoId}:`,
          error,
        );
        // 即使失败也不影响用户体验，因为前端已经更新了
      }
    };

    // 🚀 启动后台删除，不等待
    deletePhotoInBackground();

    // 🚀 立即返回响应 - 超快用户体验
    return respondImmediately();
  } catch (error) {
    console.error("❌ [Delete Photo] Error in deletePhotoLogic:", error);

    return NextResponse.json(
      {
        error: "Failed to process photo deletion",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
