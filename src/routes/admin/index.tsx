import { createFileRoute } from '@tanstack/react-router'
import { getAdminOverview } from '@/server/admin.functions'
import { formatMoney } from '@/lib/format'

export const Route = createFileRoute('/admin/')({
  loader: async () => getAdminOverview(),
  component: AdminOverview,
})

function AdminOverview() {
  const stats = Route.useLoaderData()

  const cards = [
    { label: 'Utilisateurs', value: stats.userCount },
    { label: 'Vendeurs en attente', value: stats.vendorPending },
    { label: 'Livreurs en attente', value: stats.driverPending },
    { label: 'Commandes', value: stats.orderCount },
    { label: 'Chiffre d\'affaires (GMV)', value: formatMoney(stats.gmv) },
    { label: 'Tickets ouverts', value: stats.openTickets },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {cards.map((c) => (
        <div key={c.label} className="rounded-2xl border border-neutral-200 p-6">
          <p className="text-sm text-neutral-500">{c.label}</p>
          <p className="mt-1 text-2xl font-extrabold">{c.value}</p>
        </div>
      ))}
    </div>
  )
}
