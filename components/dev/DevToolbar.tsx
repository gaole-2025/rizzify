"use client"

import clsx from "clsx"
import { usePathname } from "next/navigation"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

type PageState = "default" | "loading" | "empty" | "error" | "disabled"
type AuthState = "guest" | "user"
type PaymentMock = "auto" | "sheet"
type QueueMock = "auto" | "processing" | "empty"

type PageRegistry = Record<string, { key: string; label: string; state: PageState }>

interface DevControlsValue {
  enabled: boolean
  visible: boolean
  setVisible: (value: boolean) => void
  persisted: boolean
  setPersisted: (value: boolean) => void
  registerPage: (key: string, label: string, initial: PageState) => void
  setPageState: (key: string, state: PageState) => void
  getPageState: (key: string, fallback?: PageState) => PageState
  pages: PageRegistry
  authState: AuthState
  setAuthState: (value: AuthState) => void
  guardBypass: boolean
  setGuardBypass: (value: boolean) => void
  paymentMock: PaymentMock
  setPaymentMock: (value: PaymentMock) => void
  queueMock: QueueMock
  setQueueMock: (value: QueueMock) => void
}

const DevControlsContext = createContext<DevControlsValue | null>(null)

export const DEV_PAGE_STATES: PageState[] = ["default", "loading", "empty", "error", "disabled"]

function evaluateEnableGuard(): boolean {
  if (process.env.NEXT_PUBLIC_ENABLE_DEVTOOLS !== "true") return false
  if (process.env.NODE_ENV === "production") return false
  if (typeof window === "undefined") return false
  const params = new URLSearchParams(window.location.search)
  const hasQuery = params.get("dev") === "1"
  const stored = window.localStorage.getItem("rizzifyDev") === "1"
  if (hasQuery && !stored) {
    window.localStorage.setItem("rizzifyDev", "1")
  }
  return hasQuery || stored
}

export function DevControlsProvider({ children }: { children: ReactNode }) {
  const [runtimeAllowed, setRuntimeAllowed] = useState(false)
  const [visible, setVisible] = useState(false)
  const [persisted, setPersisted] = useState(false)
  const [pages, setPages] = useState<PageRegistry>({})
  const [authState, setAuthState] = useState<AuthState>("user")
  const [guardBypass, setGuardBypass] = useState(true)
  const [paymentMock, setPaymentMock] = useState<PaymentMock>("sheet")
  const [queueMock, setQueueMock] = useState<QueueMock>("auto")

  useEffect(() => {
    if (typeof window === "undefined") return
    const ok = evaluateEnableGuard()
    setRuntimeAllowed(ok)
    setVisible(ok)
    setPersisted(window.localStorage.getItem("rizzifyDev") === "1")
  }, [])

  const enabled = runtimeAllowed && process.env.NEXT_PUBLIC_ENABLE_DEVTOOLS === "true" && process.env.NODE_ENV !== "production"

  useEffect(() => {
    if (!enabled) return
    const handler = (event: KeyboardEvent) => {
      if (event.altKey && event.key.toLowerCase() === "d") {
        event.preventDefault()
        setVisible((prev) => !prev)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [enabled])

  const registerPage = useCallback(
    (key: string, label: string, initial: PageState) => {
      setPages((prev) => {
        if (prev[key]) return prev
        return { ...prev, [key]: { key, label, state: initial } }
      })
    },
    []
  )

  const setPageState = useCallback((key: string, state: PageState) => {
    setPages((prev) => {
      const entry = prev[key]
      if (!entry) {
        return { ...prev, [key]: { key, label: key, state } }
      }
      if (entry.state === state) return prev
      return { ...prev, [key]: { ...entry, state } }
    })
  }, [])

  const getPageState = useCallback(
    (key: string, fallback: PageState = "default") => {
      return pages[key]?.state ?? fallback
    },
    [pages]
  )

  const setPersistPreference = useCallback(
    (value: boolean) => {
      if (typeof window === "undefined") return
      setPersisted(value)
      if (value) {
        window.localStorage.setItem("rizzifyDev", "1")
      } else {
        window.localStorage.removeItem("rizzifyDev")
        setVisible(false)
      }
      setRuntimeAllowed(evaluateEnableGuard())
    },
    []
  )

  const value = useMemo<DevControlsValue>(
    () => ({
      enabled,
      visible,
      setVisible,
      persisted,
      setPersisted: setPersistPreference,
      registerPage,
      setPageState,
      getPageState,
      pages,
      authState,
      setAuthState,
      guardBypass,
      setGuardBypass,
      paymentMock,
      setPaymentMock,
      queueMock,
      setQueueMock,
    }),
    [enabled, visible, persisted, registerPage, setPageState, getPageState, pages, authState, guardBypass, paymentMock, queueMock, setPersistPreference]
  )

  return <DevControlsContext.Provider value={value}>{children}</DevControlsContext.Provider>
}

export function useDevControls() {
  const ctx = useContext(DevControlsContext)
  if (!ctx) {
    throw new Error("useDevControls must be used within DevControlsProvider")
  }
  return ctx
}

export function useDevPageState(key: string, label: string, initial: PageState = "default") {
  const ctx = useDevControls()
  useEffect(() => {
    ctx.registerPage(key, label, initial)
  }, [key, label, initial, ctx])

  const state = ctx.getPageState(key, initial)
  const setState = useCallback((next: PageState) => ctx.setPageState(key, next), [ctx, key])

  return { state, setState, enabled: ctx.enabled }
}

export function useDevAuth() {
  const ctx = useDevControls()
  return {
    enabled: ctx.enabled,
    authState: ctx.authState,
    setAuthState: ctx.setAuthState,
    guardBypass: ctx.guardBypass,
    setGuardBypass: ctx.setGuardBypass,
  }
}

export function useDevMocks() {
  const ctx = useDevControls()
  return {
    enabled: ctx.enabled,
    paymentMock: ctx.paymentMock,
    setPaymentMock: ctx.setPaymentMock,
    queueMock: ctx.queueMock,
    setQueueMock: ctx.setQueueMock,
  }
}


export function DevToolbar() {
  const ctx = useDevControls()
  const pathname = usePathname()

  if (!ctx.enabled) {
    return null
  }

  const pages = Object.values(ctx.pages)
  const isDevelopment = process.env.NODE_ENV === 'development'

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[2000] flex flex-col items-end gap-2 text-xs">
      <button
        type="button"
        className="pointer-events-auto rounded-full border border-white/30 bg-black/70 px-4 py-2 font-semibold text-white shadow-lg backdrop-blur"
        onClick={() => ctx.setVisible(!ctx.visible)}
      >
        {isDevelopment ? "🧪 " : ""}[DEV] {ctx.visible ? "Hide" : "Show"} (Alt+D)
      </button>
      {ctx.visible && (
        <div className="pointer-events-auto w-80 max-w-[90vw] rounded-2xl border border-white/20 bg-black/85 p-4 text-white shadow-xl backdrop-blur">
          <header className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold">
              {isDevelopment ? "🧪 " : ""}[DEV] Harness
              {!isDevelopment && <span className="ml-2 text-xs text-yellow-400">(Limited)</span>}
            </span>
            <label className="flex items-center gap-2 text-[11px] text-white/60">
              <input
                type="checkbox"
                checked={ctx.persisted}
                onChange={(event) => ctx.setPersisted(event.target.checked)}
              />
              Persist dev flag
            </label>
          </header>

          <section className="mb-4 space-y-1">
            <p className="text-[11px] uppercase tracking-wide text-white/50">routeHint</p>
            <p className="rounded-lg bg-white/10 px-2 py-1 font-mono text-xs">{pathname}</p>
          </section>

          {isDevelopment && (
            <section className="mb-4 space-y-2">
              <p className="text-[11px] uppercase tracking-wide text-white/50">
                stateTabs <span className="text-yellow-400">(Dev Only)</span>
              </p>
              {pages.length === 0 && (
                <p className="text-white/50">Pages will appear after they register.</p>
              )}
              {pages.map((page) => (
                <div key={page.key} className="rounded-lg border border-white/10 p-2">
                  <div className="mb-2 text-[11px] uppercase tracking-wide text-white/60">{page.label}</div>
                  <div className="flex flex-wrap gap-1">
                    {DEV_PAGE_STATES.map((state) => (
                      <button
                        key={state}
                        type="button"
                        className={clsx(
                          "rounded-full px-3 py-1",
                          page.state === state ? "bg-white text-black" : "bg-white/10 text-white/70 hover:bg-white/20"
                        )}
                        onClick={() => ctx.setPageState(page.key, state)}
                      >
                        {state}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </section>
          )}

          {isDevelopment && (
            <>
              <section className="mb-4 space-y-2">
                <p className="text-[11px] uppercase tracking-wide text-white/50">
                  authMock <span className="text-yellow-400">(Dev Only)</span>
                </p>
                <div className="flex gap-2">
                  {["guest", "user"].map((auth) => (
                    <button
                      key={auth}
                      type="button"
                      className={clsx(
                        "rounded-full px-3 py-1",
                        ctx.authState === auth ? "bg-white text-black" : "bg-white/10 text-white/70 hover:bg-white/20"
                      )}
                      onClick={() => ctx.setAuthState(auth as AuthState)}
                    >
                      {auth}
                    </button>
                  ))}
                </div>
              </section>

              <section className="mb-4 space-y-2">
                <p className="text-[11px] uppercase tracking-wide text-white/50">
                  guardBypass <span className="text-yellow-400">(Dev Only)</span>
                </p>
                <button
                  type="button"
                  className={clsx(
                    "rounded-full px-3 py-1",
                    ctx.guardBypass ? "bg-white text-black" : "bg-white/10 text-white/70 hover:bg-white/20"
                  )}
                  onClick={() => ctx.setGuardBypass(!ctx.guardBypass)}
                >
                  {ctx.guardBypass ? "Enabled" : "Disabled"}
                </button>
              </section>

              <section className="mb-4 space-y-2">
                <p className="text-[11px] uppercase tracking-wide text-white/50">
                  paymentMock <span className="text-yellow-400">(Dev Only)</span>
                </p>
                <div className="flex gap-2">
                  {["auto", "sheet"].map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      className={clsx(
                        "rounded-full px-3 py-1",
                        ctx.paymentMock === mode ? "bg-white text-black" : "bg-white/10 text-white/70 hover:bg-white/20"
                      )}
                      onClick={() => ctx.setPaymentMock(mode as PaymentMock)}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </section>

              <section className="space-y-2">
                <p className="text-[11px] uppercase tracking-wide text-white/50">
                  queueMock <span className="text-yellow-400">(Dev Only)</span>
                </p>
                <div className="flex gap-2">
                  {["auto", "processing", "empty"].map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      className={clsx(
                        "rounded-full px-3 py-1",
                        ctx.queueMock === mode ? "bg-white text-black" : "bg-white/10 text-white/70 hover:bg-white/20"
                      )}
                      onClick={() => ctx.setQueueMock(mode as QueueMock)}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </section>
            </>
          )}

          {!isDevelopment && (
            <div className="mb-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <p className="text-xs text-yellow-400">
                ⚠️ Advanced controls disabled in production.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export type { PageState, AuthState, PaymentMock, QueueMock }


