// src/worker/pidfile.ts
import fs from 'fs'
const PID_PATH = '.rizzify-worker.pid'

export function tryCreatePidFile(): boolean {
  try {
    if (fs.existsSync(PID_PATH)) {
      const oldPid = Number(fs.readFileSync(PID_PATH, 'utf8'))
      try { process.kill(oldPid, 0); return false } catch { /* 不存在 */ }
    }
    fs.writeFileSync(PID_PATH, String(process.pid))
    process.on('exit', () => { try { fs.unlinkSync(PID_PATH) } catch {} })
    return true
  } catch { return false }
}