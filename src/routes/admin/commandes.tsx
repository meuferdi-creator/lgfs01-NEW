import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useServerFn } from '@tanstack/react-start'
import { listAllOrders, updateOrderStatus, assignDriverToOrder, listAllDrivers } from '@/server/admin.functions'
import { formatMoney } from '@/lib/format'

export const Route = createFileRoute('/admin/commandes')({
  loader: async () => {
    const [orders, drivers] = await Promise.all([listAllOrders(), listAllDrivers()])
    return { orders, drivers: drivers.filter((d) => d.status === 'approved') }
  },
  component: AdminOrdersPage,
})

const STATUSES = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'] as const

function AdminOrdersPage() {
  const { orders: initial, drivers } = Route.useLoaderData()
  const [orders, setOrders] = useState(initial)
  const updateStatusFn = useServerFn(updateOrderStatus)
  const assignFn = useServerFn(assignDriverToOrder)

  const handleStatus = async (orderId: number, status: string) => {
    const updated = await updateStatusFn({ data: { orderId, status: status as (typeof STATUSES)[number] } })
    setOrders(orders.map((o) => (o.id === updated.id ? updated : o)))
  }

  const handleAssign = async (orderId: number, driverId: number) => {
    const updated = await assignFn({ data: { orderId, driverId } })
    setOrders(orders.map((o) => (o.id === updated.id ? updated : o)))
  }

  return (
    <div className="space-y-3">
      {orders.map((o) => (
        <div key={o.id} className="rounded-xl border border-neutral-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Commande #{o.id}</p>
              <p className="text-sm text-neutral-500">
                {formatMoney(o.total)} · Paiement : {o.paymentStatus} · {o.shippingAddress.city}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select value={o.status} onChange={(e) => handleStatus(o.id, e.target.value)} className="rounded-lg border border-neutral-300 px-2 py-1 text-sm">
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <select
                value={o.assignedDriverId ?? ''}
                onChange={(e) => e.target.value && handleAssign(o.id, Number(e.target.value))}
                className="rounded-lg border border-neutral-300 px-2 py-1 text-sm"
              >
                <option value="">Assigner livreur...</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>{d.zone} ({d.vehicleType})</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      ))}
      {orders.length === 0 && <p className="text-sm text-neutral-500">Aucune commande.</p>}
    </div>
  )
}
