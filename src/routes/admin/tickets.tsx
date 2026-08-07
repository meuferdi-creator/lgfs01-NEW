import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useServerFn } from '@tanstack/react-start'
import { listAllTickets, updateTicketStatus } from '@/server/admin.functions'

export const Route = createFileRoute('/admin/tickets')({
  loader: async () => listAllTickets(),
  component: AdminTicketsPage,
})

const STATUSES = ['open', 'in_progress', 'resolved'] as const

function AdminTicketsPage() {
  const initial = Route.useLoaderData()
  const [tickets, setTickets] = useState(initial)
  const updateFn = useServerFn(updateTicketStatus)

  const handleStatus = async (id: number, status: string) => {
    const updated = await updateFn({ data: { id, status: status as (typeof STATUSES)[number] } })
    setTickets(tickets.map((t) => (t.id === updated.id ? updated : t)))
  }

  return (
    <div className="space-y-3">
      {tickets.map((t) => (
        <div key={t.id} className="rounded-xl border border-neutral-200 p-4">
          <div className="flex items-center justify-between">
            <p className="font-medium">{t.subject}</p>
            <select value={t.status} onChange={(e) => handleStatus(t.id, e.target.value)} className="rounded-lg border border-neutral-300 px-2 py-1 text-sm">
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <p className="mt-1 text-sm text-neutral-600">{t.message}</p>
        </div>
      ))}
      {tickets.length === 0 && <p className="text-sm text-neutral-500">Aucun ticket.</p>}
    </div>
  )
}
