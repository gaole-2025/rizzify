const LAST_TASK_STORAGE_KEY = "rizzify.stage2.lastTask"

export function writeLastTaskId(taskId: string) {
  if (!taskId) return
  if (typeof window === "undefined") return
  window.sessionStorage.setItem(LAST_TASK_STORAGE_KEY, taskId)
}

export function readLastTaskId(): string | null {
  if (typeof window === "undefined") return null
  return window.sessionStorage.getItem(LAST_TASK_STORAGE_KEY)
}

export function clearLastTaskId() {
  if (typeof window === "undefined") return
  window.sessionStorage.removeItem(LAST_TASK_STORAGE_KEY)
}

export { LAST_TASK_STORAGE_KEY }
