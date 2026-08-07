import { createFileRoute } from '@tanstack/react-router'
import { getMyOrder } from '@/server/orders.functions'
import { formatMoney } from '@/lib/format'

export const Route = createFileRoute('/compte/commandes/$id')({
  loader: async ({ params }) => {
    const order = await getMyOrder({ data: { orderId: Number(params.id) } })
    if (!order) throw new Error('Commande introuvable')
    return order
  },
  component: OrderInvoicePage,
})

function OrderInvoicePage() {
  const order = Route.useLoaderData()

  return (
    <div className="rounded-2xl border border-neutral-200 p-8 print:border-none">
      <div className="flex items-start justify-between border-b border-neutral-200 pb-6">
        <div>
          <h2 className="text-xl font-extrabold">LGF's Mall — Facture</h2>
          <p className="text-sm text-neutral-500">Commande #{order.id}</p>
          <p className="text-sm text-neutral-500">
            {new Date(order.createdAt).toLocaleDateString('fr-FR')}
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="rounded-full border border-neutral-300 px-4 py-1.5 text-sm font-medium hover:bg-neutral-50 print:hidden"
        >
          Imprimer / PDF
        </button>
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold text-neutral-500">Livraison</h3>
          <p className="mt-1 text-sm">
            {order.shippingAddress.fullName}
            <br />
            {order.shippingAddress.addressLine}
            <br />
            {order.shippingAddress.city}, {order.shippingAddress.country}
            <br />
            {order.shippingAddress.phone}
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-neutral-500">Statut</h3>
          <p className="mt-1 text-sm capitalize">{order.status}</p>
          <p className="text-sm text-neutral-500">Paiement : {order.paymentStatus} ({order.paymentProvider || '—'})</p>
        </div>
      </div>

      <table className="mt-8 w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-200 text-left text-neutral-500">
            <th className="py-2">Produit</th>
            <th className="py-2 text-right">Prix unitaire</th>
            <th className="py-2 text-right">Qté</th>
            <th className="py-2 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item) => (
            <tr key={item.id} className="border-b border-neutral-100">
              <td className="py-2">{item.productName}</td>
              <td className="py-2 text-right">{formatMoney(item.unitPrice)}</td>
              <td className="py-2 text-right">{item.quantity}</td>
              <td className="py-2 text-right">{formatMoney(item.lineTotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 flex justify-end">
        <div className="w-64 space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Sous-total</span>
            <span>{formatMoney(order.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Livraison</span>
            <span>{formatMoney(order.deliveryFee)}</span>
          </div>
          <div className="flex justify-between border-t border-neutral-200 pt-2 text-base font-bold">
            <span>Total</span>
            <span>{formatMoney(order.total)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
