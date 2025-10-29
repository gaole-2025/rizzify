/**
 * 获取用户当前活跃任务 API端点
 * GET /api/user/active-task
 *
 * 返回用户当前正在进行的任务状态，用于页面刷新后恢复状态
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseBrowserClient } from "@/src/lib/supabaseClient";
import { tasksRepo } from "@/src/db/repo";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    // 验证用户身份
    const supabase = getSupabaseBrowserClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // 查询用户最近的活跃任务
    // 只查找状态为 queued 或 running 的任务
    const activeTasks = await tasksRepo.getActiveTasks(userId);

    // 如果没有活跃任务，返回空
    if (activeTasks.length === 0) {
      return NextResponse.json({
        hasActiveTask: false,
        task: null,
      });
    }

    const activeTask = activeTasks[0];

    // 返回任务详情
    return NextResponse.json({
      hasActiveTask: true,
      task: {
        id: activeTask.id,
        status: activeTask.status,
        plan: activeTask.plan,
        gender: activeTask.gender,
        progress: activeTask.progress,
        etaSeconds: activeTask.etaSeconds,
        errorMessage: activeTask.errorMessage,
        errorCode: activeTask.errorCode,
        createdAt: activeTask.createdAt,
        startedAt: activeTask.startedAt,
        upload: {
          id: activeTask.upload.id,
          filename: activeTask.upload.filename,
        },
      },
    });
  } catch (error) {
    console.error("Failed to get active task:", error);
    return NextResponse.json(
      { error: "Failed to get active task" },
      { status: 500 },
    );
  }
}
