"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { StatusNote, ErrorBanner } from "@/components/stage1/common"
import { useDevAuth, useDevPageState } from "@/components/dev/DevToolbar"
import {
  getAdminKpi,
  getAdminUsers,
  getAdminTasks,
  getAdminPayments,
  getAdminTickets,
  updateTicketStatus,
  ApiError,
} from "@/lib/api/client"

type TabKey = "users" | "tasks" | "payments" | "tickets"

interface KpiData {
  usersTotal: number
  usersToday: number
  tasksActive: number
  failRatePct: number
  revenueUSD?: number
}

interface UserRow {
  id: string
  email: string
  plan: "free" | "start" | "pro" | null
  orders: number
  tasks: number
  failedTasks: number
  createdAt: string
}

interface TaskRow {
  id: string
  userEmail: string
  plan: "free" | "start" | "pro"
  status: "queued" | "running" | "done" | "error"
  createdAt: string
  completedAt?: string
  errorCode?: string
}

interface PaymentRow {
  id: string
  userEmail: string
  plan: "start" | "pro"
  amount: number
  currency: string
  provider: string
  status: "succeeded" | "failed" | "refunded"
  createdAt: string
}

interface TicketRow {
  id: string
  userEmail: string
  recentTaskId: string
  message: string
  screenshotUrls: string[]
  status: "new" | "in_progress" | "resolved" | "rejected"
  createdAt: string
}

export default function AdminPage() {
  const router = useRouter()
  const { authState, guardBypass } = useDevAuth()
  const isAuthed = authState !== "guest"
  const { state: pageState, setState: setPageState } = useDevPageState("admin", "Admin", "default")
  
  const [activeTab, setActiveTab] = useState<TabKey>("users")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Data states
  const [kpi, setKpi] = useState<KpiData | null>(null)
  const [users, setUsers] = useState<UserRow[]>([])
  const [tasks, setTasks] = useState<TaskRow[]>([])
  const [payments, setPayments] = useState<PaymentRow[]>([])
  const [tickets, setTickets] = useState<TicketRow[]>([])

  // Drawer state for ticket details
  const [selectedTicket, setSelectedTicket] = useState<TicketRow | null>(null)
  const [ticketNote, setTicketNote] = useState("")
  const [updatingTicket, setUpdatingTicket] = useState(false)

  useEffect(() => {
    if (!isAuthed && !guardBypass) {
      router.replace("/login?redirect=/admin")
    }
  }, [isAuthed, guardBypass, router])

  const loadData = useCallback(async () => {
    if (!isAuthed && !guardBypass) return

    setLoading(true)
    setError(null)

    try {
      // DB 模式：从 API 获取真实数据
      const [kpiData, usersData, tasksData, paymentsData, ticketsData] = await Promise.all([
        fetch('/api/admin/kpi').then(r => r.json()),
        fetch('/api/admin/users').then(r => r.json()),
        fetch('/api/admin/tasks').then(r => r.json()),
        fetch('/api/admin/payments').then(r => r.json()),
        fetch('/api/admin/tickets').then(r => r.json()),
      ])

      setKpi(kpiData)
      setUsers(usersData)
      setTasks(tasksData)
      setPayments(paymentsData)
      setTickets(ticketsData)
    } catch (err) {
      console.error("Admin data loading error:", err)
      let message = "Failed to load admin data."

      if (err instanceof ApiError) {
        if (err.status === 403) {
          message = "Access denied. Admin privileges required."
        } else if (err.status === 429) {
          message = "Too many requests. Please try again later."
        } else if (err.status === 500) {
          message = "Server error. Please try again later."
        } else {
          message = err.message || "Failed to load admin data."
        }
      } else if (err instanceof Error) {
        message = err.message
      }

      setError(message)
    } finally {
      setLoading(false)
    }
  }, [isAuthed, guardBypass])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    if (pageState === "error") {
      setError("Demo: admin API unavailable.")
    } else if (pageState === "default") {
      setError(null)
    }
  }, [pageState])

  const handleTicketStatusChange = async (ticketId: string, status: "new" | "in_progress" | "resolved" | "rejected") => {
    if (updatingTicket) return

    setUpdatingTicket(true)
    try {
      // DB 模式：使用 API
      const response = await fetch(`/api/admin/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          note: ticketNote || undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update ticket status')
      }

      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status } : t))
      setTicketNote("")
      setSelectedTicket(null)
    } catch (err) {
      console.error("Ticket status update error:", err)
      let message = "Failed to update ticket status."

      if (err instanceof ApiError) {
        if (err.status === 403) {
          message = "Access denied. Admin privileges required."
        } else if (err.status === 404) {
          message = "Ticket not found."
        } else {
          message = err.message || "Failed to update ticket status."
        }
      } else if (err instanceof Error) {
        message = err.message
      }

      setError(message)
    } finally {
      setUpdatingTicket(false)
    }
  }

  const handleExportUsers = async () => {
    try {
      // DB 模式：从 API 导出
      const response = await fetch('/api/admin/users/export')
      if (!response.ok) throw new Error('Export failed')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'users.csv'
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error("Export error:", err)
      setError("Failed to export users data.")
    }
  }

  if (!isAuthed && !guardBypass) {
    return null
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  const formatCurrency = (amount: number, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency
    }).format(amount)
  }

  return (
    <div className="space-y-8">
      {/* Header & KPI */}
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
        <header className="mb-6 flex items-center justify-between text-white/80">
          <h1 className="text-2xl font-semibold text-white">Admin Overview</h1>
          <div className="flex items-center gap-2">
            <StatusNote text="Live data via APIs" />
          </div>
        </header>

        {error && <ErrorBanner message={error} onRetry={loadData} />}

        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white/50"></div>
          </div>
        )}

        {kpi && !loading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-white/70">
              <p className="text-xs uppercase tracking-wide text-white/40">Users Total</p>
              <p className="mt-2 text-2xl font-semibold text-white">{kpi.usersTotal.toLocaleString()}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-white/70">
              <p className="text-xs uppercase tracking-wide text-white/40">New Today</p>
              <p className="mt-2 text-2xl font-semibold text-white">{kpi.usersToday}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-white/70">
              <p className="text-xs uppercase tracking-wide text-white/40">Active Tasks</p>
              <p className="mt-2 text-2xl font-semibold text-white">{kpi.tasksActive}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-white/70">
              <p className="text-xs uppercase tracking-wide text-white/40">Fail Rate</p>
              <p className="mt-2 text-2xl font-semibold text-white">{kpi.failRatePct.toFixed(1)}%</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-white/70">
              <p className="text-xs uppercase tracking-wide text-white/40">Revenue</p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {kpi.revenueUSD ? formatCurrency(kpi.revenueUSD) : "N/A"}
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Tabs Navigation */}
      <div className="flex space-x-1 rounded-lg border border-white/10 bg-black/30 p-1">
        {[
          { key: "users", label: "Users", count: users.length },
          { key: "tasks", label: "Tasks", count: tasks.length },
          { key: "payments", label: "Payments", count: payments.length },
          { key: "tickets", label: "Tickets", count: tickets.length },
        ].map(({ key, label, count }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key as TabKey)}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
              activeTab === key
                ? "bg-white text-black"
                : "text-white/70 hover:text-white hover:bg-white/10"
            }`}
          >
            {label} ({count})
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <section className="rounded-3xl border border-white/10 bg-black/30 p-6 text-sm text-white/70">
        {activeTab === "users" && (
          <div>
            <header className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Users</h2>
              <button
                type="button"
                onClick={handleExportUsers}
                className="rounded-full border border-white/20 px-4 py-2 text-xs text-white hover:border-white/40 hover:bg-white/10 disabled:opacity-50"
                disabled={loading}
              >
                Export CSV
              </button>
            </header>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs">
                <thead className="text-white/50">
                  <tr>
                    <th className="px-4 py-2">Email</th>
                    <th className="px-4 py-2">Plan</th>
                    <th className="px-4 py-2">Orders</th>
                    <th className="px-4 py-2">Tasks</th>
                    <th className="px-4 py-2">Failed</th>
                    <th className="px-4 py-2">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-t border-white/5">
                      <td className="px-4 py-2 text-white/80">{user.email}</td>
                      <td className="px-4 py-2 capitalize">{user.plan || "free"}</td>
                      <td className="px-4 py-2">{user.orders}</td>
                      <td className="px-4 py-2">{user.tasks}</td>
                      <td className="px-4 py-2">{user.failedTasks}</td>
                      <td className="px-4 py-2">{formatDate(user.createdAt)}</td>
                    </tr>
                  ))}
                  {users.length === 0 && !loading && (
                    <tr>
                      <td className="px-4 py-6 text-center text-white/50" colSpan={6}>
                        No users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "tasks" && (
          <div>
            <header className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Tasks</h2>
            </header>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs">
                <thead className="text-white/50">
                  <tr>
                    <th className="px-4 py-2">Task ID</th>
                    <th className="px-4 py-2">User</th>
                    <th className="px-4 py-2">Plan</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">Created</th>
                    <th className="px-4 py-2">Completed</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => (
                    <tr key={task.id} className="border-t border-white/5">
                      <td className="px-4 py-2 font-mono text-white/80">{task.id}</td>
                      <td className="px-4 py-2">{task.userEmail}</td>
                      <td className="px-4 py-2 capitalize">{task.plan}</td>
                      <td className="px-4 py-2">
                        <span className={`rounded-full px-2 py-1 text-xs ${
                          task.status === "done" ? "bg-green-500/20 text-green-300" :
                          task.status === "error" ? "bg-red-500/20 text-red-300" :
                          task.status === "running" ? "bg-blue-500/20 text-blue-300" :
                          "bg-yellow-500/20 text-yellow-300"
                        }`}>
                          {task.status}
                        </span>
                      </td>
                      <td className="px-4 py-2">{formatDate(task.createdAt)}</td>
                      <td className="px-4 py-2">{task.completedAt ? formatDate(task.completedAt) : "-"}</td>
                    </tr>
                  ))}
                  {tasks.length === 0 && !loading && (
                    <tr>
                      <td className="px-4 py-6 text-center text-white/50" colSpan={6}>
                        No tasks found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "payments" && (
          <div>
            <header className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Payments</h2>
            </header>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs">
                <thead className="text-white/50">
                  <tr>
                    <th className="px-4 py-2">Payment ID</th>
                    <th className="px-4 py-2">User</th>
                    <th className="px-4 py-2">Plan</th>
                    <th className="px-4 py-2">Amount</th>
                    <th className="px-4 py-2">Provider</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id} className="border-t border-white/5">
                      <td className="px-4 py-2 font-mono text-white/80">{payment.id}</td>
                      <td className="px-4 py-2">{payment.userEmail}</td>
                      <td className="px-4 py-2 capitalize">{payment.plan}</td>
                      <td className="px-4 py-2">{formatCurrency(payment.amount, payment.currency)}</td>
                      <td className="px-4 py-2 capitalize">{payment.provider}</td>
                      <td className="px-4 py-2">
                        <span className={`rounded-full px-2 py-1 text-xs ${
                          payment.status === "succeeded" ? "bg-green-500/20 text-green-300" :
                          payment.status === "failed" ? "bg-red-500/20 text-red-300" :
                          "bg-yellow-500/20 text-yellow-300"
                        }`}>
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-4 py-2">{formatDate(payment.createdAt)}</td>
                    </tr>
                  ))}
                  {payments.length === 0 && !loading && (
                    <tr>
                      <td className="px-4 py-6 text-center text-white/50" colSpan={7}>
                        No payments found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "tickets" && (
          <div>
            <header className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Tickets</h2>
            </header>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs">
                <thead className="text-white/50">
                  <tr>
                    <th className="px-4 py-2">Ticket ID</th>
                    <th className="px-4 py-2">User</th>
                    <th className="px-4 py-2">Message</th>
                    <th className="px-4 py-2">Screenshots</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">Created</th>
                    <th className="px-4 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((ticket) => (
                    <tr key={ticket.id} className="border-t border-white/5">
                      <td className="px-4 py-2 font-mono text-white/80">{ticket.id}</td>
                      <td className="px-4 py-2">{ticket.userEmail}</td>
                      <td className="px-4 py-2 max-w-xs truncate">{ticket.message}</td>
                      <td className="px-4 py-2">{ticket.screenshotUrls.length}</td>
                      <td className="px-4 py-2">
                        <span className={`rounded-full px-2 py-1 text-xs ${
                          ticket.status === "resolved" ? "bg-green-500/20 text-green-300" :
                          ticket.status === "rejected" ? "bg-red-500/20 text-red-300" :
                          ticket.status === "in_progress" ? "bg-blue-500/20 text-blue-300" :
                          "bg-yellow-500/20 text-yellow-300"
                        }`}>
                          {ticket.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-2">{formatDate(ticket.createdAt)}</td>
                      <td className="px-4 py-2">
                        <button
                          type="button"
                          onClick={() => setSelectedTicket(ticket)}
                          className="text-blue-400 hover:text-blue-300 underline"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                  {tickets.length === 0 && !loading && (
                    <tr>
                      <td className="px-4 py-6 text-center text-white/50" colSpan={7}>
                        No tickets found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* Ticket Management Drawer */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="max-w-2xl w-full max-h-[80vh] overflow-y-auto rounded-3xl border border-white/10 bg-black/90 p-6 text-white">
            <header className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Ticket Details</h3>
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="text-white/60 hover:text-white"
              >
                ✕
              </button>
            </header>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-white/60">Ticket ID: {selectedTicket.id}</p>
                <p className="text-sm text-white/60">User: {selectedTicket.userEmail}</p>
                <p className="text-sm text-white/60">Task: {selectedTicket.recentTaskId}</p>
                <p className="text-sm text-white/60">Created: {formatDate(selectedTicket.createdAt)}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-white/80 mb-2">Message</h4>
                <p className="text-sm text-white/70 p-3 rounded-lg bg-white/5 border border-white/10">
                  {selectedTicket.message}
                </p>
              </div>

              {selectedTicket.screenshotUrls.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-white/80 mb-2">Screenshots ({selectedTicket.screenshotUrls.length})</h4>
                  <div className="flex gap-2">
                    {selectedTicket.screenshotUrls.map((url, idx) => (
                      <div key={idx} className="w-16 h-16 rounded bg-white/10 border border-white/20 flex items-center justify-center text-xs text-white/60">
                        IMG
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-sm font-medium text-white/80 mb-2">Internal Note</h4>
                <textarea
                  value={ticketNote}
                  onChange={(e) => setTicketNote(e.target.value)}
                  placeholder="Add internal note..."
                  className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/40 text-sm"
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                {selectedTicket.status === "new" && (
                  <button
                    type="button"
                    onClick={() => handleTicketStatusChange(selectedTicket.id, "in_progress")}
                    disabled={updatingTicket}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm disabled:opacity-50"
                  >
                    {updatingTicket ? "Updating..." : "Set In Progress"}
                  </button>
                )}
                {selectedTicket.status !== "resolved" && (
                  <button
                    type="button"
                    onClick={() => handleTicketStatusChange(selectedTicket.id, "resolved")}
                    disabled={updatingTicket}
                    className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm disabled:opacity-50"
                  >
                    {updatingTicket ? "Updating..." : "Resolve"}
                  </button>
                )}
                {selectedTicket.status !== "rejected" && (
                  <button
                    type="button"
                    onClick={() => handleTicketStatusChange(selectedTicket.id, "rejected")}
                    disabled={updatingTicket}
                    className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm disabled:opacity-50"
                  >
                    {updatingTicket ? "Updating..." : "Reject"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}