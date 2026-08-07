import { createFileRoute } from '@tanstack/react-router'
import { getVendorDashboard } from '@/server/vendors.functions'
import { formatMoney } from '@/lib/format'

export const Route = createFileRoute('/vendeur/commandes')({
  loader: async () => getVendorDashboard(),
  component: VendorOrdersPage,
})

function VendorOrdersPage() {
  const { orders } = Route.useLoaderData()

  if (orders.length === 0) {
    return <p className="text-sm text-neutral-500">Aucune commande pour vos produits pour le moment.</p>
  }

  return (
    <div className="space-y-2">
      {orders.map((item) => (
        <div key={item.id} className="flex items-center justify-between rounded-xl border border-neutral-200 p-4">
          <div>
            <p className="font-medium">{item.productName}</p>
            <p className="text-sm text-neutral-500">
              Commande #{item.orderId} · Qté {item.quantity} · Statut : {item.order?.status ?? '—'}
            </p>
          </div>
          <p className="font-semibold">{formatMoney(item.lineTotal)}</p>
        </div>
      ))}
    </div>
  )
}
