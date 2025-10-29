import { db } from "../client";
import { Plan, Gender, TaskStatus } from "@prisma/client";

export interface CreateTaskData {
  userId: string;
  uploadId: string;
  plan: Plan;
  gender: Gender;
  idempotencyKey: string;
}

export interface UpdateTaskStatusData {
  status: TaskStatus;
  progress?: number;
  etaSeconds?: number;
  errorCode?: string;
  errorMessage?: string;
  completedAt?: Date;
}

export const tasksRepo = {
  async create(data: CreateTaskData) {
    return await db.task.create({
      data: {
        ...data,
        status: TaskStatus.queued, // 默认状态为 queued
      },
    });
  },

  async getById(id: string) {
    return await db.task.findUnique({
      where: { id },
    });
  },

  async listByUser(userId: string, limit: number = 50) {
    return await db.task.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  },

  async updateStatus(id: string, data: UpdateTaskStatusData) {
    return await db.task.update({
      where: { id },
      data,
    });
  },

  async getActiveTasks(userId: string) {
    return await db.task.findMany({
      where: {
        userId,
        status: {
          in: [TaskStatus.queued, TaskStatus.running],
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 1,
      include: {
        upload: {
          select: {
            id: true,
            filename: true,
          },
        },
      },
    });
  },
};
