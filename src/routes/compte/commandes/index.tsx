import { createFileRoute, Link } from '@tanstack/react-router'
import { getMyOrders } from '@/server/orders.functions'
import { formatMoney } from '@/lib/format'

export const Route = createFileRoute('/compte/commandes/')({
  loader: async () => getMyOrders(),
  component: OrdersPage,
})

const STATUS_LABEL: Record<string, string> = {
  pending: 'En attente de paiement',
  paid: 'Payée',
  processing: 'En préparation',
  shipped: 'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
  refunded: 'Remboursée',
}

function OrdersPage() {
  const orders = Route.useLoaderData()

  if (orders.length === 0) {
    return <p className="text-sm text-neutral-500">Aucune commande pour le moment.</p>
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <Link
          key={order.id}
          to="/compte/commandes/$id"
          params={{ id: String(order.id) }}
          className="flex items-center justify-between rounded-xl border border-neutral-200 p-4 hover:border-emerald-300"
        >
          <div>
            <p className="font-semibold">Commande #{order.id}</p>
            <p className="text-sm text-neutral-500">
              {order.items.length} article(s) · {new Date(order.createdAt).toLocaleDateString('fr-FR')}
            </p>
          </div>
          <div className="text-right">
            <p className="font-semibold">{formatMoney(order.total)}</p>
            <p className="text-sm text-neutral-500">{STATUS_LABEL[order.status] ?? order.status}</p>
          </div>
        </Link>
      ))}
    </div>
  )
}
