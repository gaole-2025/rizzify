/**
 * 生成状态管理工具
 * 处理用户生成任务的状态持久化和恢复
 */

export interface GenerationState {
  taskId: string;
  status: "initializing" | "queued" | "running" | "done" | "error";
  plan: "free" | "start" | "pro";
  gender: "male" | "female";
  progress?: number | null;
  etaSeconds?: number | null;
  errorMessage?: string | null;
  errorCode?: string | null;
  createdAt: string;
  startedAt?: string | null;
  uploadId: string;
  uploadFilename: string;
}

const GENERATION_STATE_KEY = "rizzify.generation.state";
const STATE_EXPIRY_HOURS = 24; // 状态过期时间（小时）

/**
 * 保存生成状态到 sessionStorage
 */
export function saveGenerationState(state: GenerationState): void {
  if (typeof window === "undefined") return;

  const stateWithTimestamp = {
    ...state,
    savedAt: new Date().toISOString(),
  };

  try {
    window.sessionStorage.setItem(
      GENERATION_STATE_KEY,
      JSON.stringify(stateWithTimestamp),
    );
  } catch (error) {
    console.warn("Failed to save generation state:", error);
  }
}

/**
 * 从 sessionStorage 读取生成状态
 */
export function loadGenerationState(): GenerationState | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = window.sessionStorage.getItem(GENERATION_STATE_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored);
    const savedAt = new Date(parsed.savedAt);
    const now = new Date();
    const hoursDiff = (now.getTime() - savedAt.getTime()) / (1000 * 60 * 60);

    // 检查是否过期
    if (hoursDiff > STATE_EXPIRY_HOURS) {
      clearGenerationState();
      return null;
    }

    // 移除时间戳字段
    const { savedAt: _, ...state } = parsed;
    return state as GenerationState;
  } catch (error) {
    console.warn("Failed to load generation state:", error);
    clearGenerationState();
    return null;
  }
}

/**
 * 清除生成状态
 */
export function clearGenerationState(): void {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.removeItem(GENERATION_STATE_KEY);
  } catch (error) {
    console.warn("Failed to clear generation state:", error);
  }
}

/**
 * 更新生成状态
 */
export function updateGenerationState(updates: Partial<GenerationState>): void {
  const currentState = loadGenerationState();
  if (!currentState) return;

  const newState = { ...currentState, ...updates };
  saveGenerationState(newState);
}

/**
 * 检查是否有活跃的生成状态
 */
export function hasActiveGenerationState(): boolean {
  const state = loadGenerationState();
  return (
    state !== null &&
    ["initializing", "queued", "running"].includes(state.status)
  );
}

/**
 * 从API响应创建生成状态
 */
export function createGenerationStateFromAPI(apiResponse: {
  id: string;
  status: string;
  plan: string;
  gender: string;
  progress?: number | null;
  etaSeconds?: number | null;
  errorMessage?: string | null;
  errorCode?: string | null;
  createdAt: string;
  startedAt?: string | null;
  upload: {
    id: string;
    filename: string;
  };
}): GenerationState {
  return {
    taskId: apiResponse.id,
    status: mapApiStatusToState(apiResponse.status),
    plan: apiResponse.plan as "free" | "start" | "pro",
    gender: apiResponse.gender as "male" | "female",
    progress: apiResponse.progress,
    etaSeconds: apiResponse.etaSeconds,
    errorMessage: apiResponse.errorMessage,
    errorCode: apiResponse.errorCode,
    createdAt: apiResponse.createdAt,
    startedAt: apiResponse.startedAt,
    uploadId: apiResponse.upload.id,
    uploadFilename: apiResponse.upload.filename,
  };
}

/**
 * 映射API状态到内部状态
 */
function mapApiStatusToState(apiStatus: string): GenerationState["status"] {
  switch (apiStatus) {
    case "queued":
      return "queued";
    case "running":
      return "running";
    case "done":
      return "done";
    case "error":
      return "error";
    default:
      return "queued";
  }
}

/**
 * 创建初始化状态
 */
export function createInitializingState(
  plan: "free" | "start" | "pro",
  gender: "male" | "female",
  uploadId: string,
  uploadFilename: string,
): GenerationState {
  return {
    taskId: "",
    status: "initializing",
    plan,
    gender,
    progress: null,
    etaSeconds: null,
    errorMessage: null,
    errorCode: null,
    createdAt: new Date().toISOString(),
    startedAt: null,
    uploadId,
    uploadFilename,
  };
}

/**
 * 判断状态是否为终态
 */
export function isTerminalState(status: GenerationState["status"]): boolean {
  return status === "done" || status === "error";
}

/**
 * 判断状态是否为活跃状态
 */
export function isActiveState(status: GenerationState["status"]): boolean {
  return ["initializing", "queued", "running"].includes(status);
}
