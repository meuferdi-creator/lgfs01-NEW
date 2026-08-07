import { createFileRoute, Link } from '@tanstack/react-router'
import { getVendorDashboard } from '@/server/vendors.functions'
import { formatMoney } from '@/lib/format'

export const Route = createFileRoute('/vendeur/')({
  loader: async () => getVendorDashboard(),
  component: VendorOverview,
})

function VendorOverview() {
  const { vendor, stats } = Route.useLoaderData()

  if (!vendor) {
    return (
      <div className="rounded-2xl border border-neutral-200 p-6 text-sm text-neutral-600">
        Vous n'avez pas encore de demande de vendeur.{' '}
        <Link to="/vendre" className="font-medium text-emerald-700 underline">
          Faire une demande
        </Link>
      </div>
    )
  }

  if (vendor.status === 'pending') {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-700">
        Votre demande "{vendor.shopName}" est en attente de validation par un administrateur.
      </div>
    )
  }

  if (vendor.status === 'rejected') {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        Votre demande a été rejetée. Motif : {vendor.rejectionReason || 'non précisé'}
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="rounded-2xl border border-neutral-200 p-6">
        <p className="text-sm text-neutral-500">Boutique</p>
        <p className="text-lg font-bold">{vendor.shopName}</p>
        <p className="text-sm text-neutral-500">Commission : {vendor.commissionRate}%</p>
      </div>
      <div className="rounded-2xl border border-neutral-200 p-6">
        <p className="text-sm text-neutral-500">Produits</p>
        <p className="text-2xl font-extrabold">{stats?.productCount ?? 0}</p>
      </div>
      <div className="rounded-2xl border border-neutral-200 p-6">
        <p className="text-sm text-neutral-500">Chiffre d'affaires</p>
        <p className="text-2xl font-extrabold">{formatMoney(stats?.revenue ?? 0)}</p>
        <p className="text-sm text-neutral-500">{stats?.ordersCount ?? 0} commande(s) payée(s)</p>
      </div>
    </div>
  )
}
