import { Link, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/checkout/cancel')({
  component: CheckoutCancel,
})

function CheckoutCancel() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center p-5">
      <div className="max-w-lg rounded-2xl border p-12 text-center">
        <div className="mb-6 text-6xl">✕</div>
        <h1 className="mb-4 text-3xl font-bold">Paiement annulé</h1>
        <p className="mb-8 text-neutral-600">Aucun montant n'a été prélevé. Votre commande reste en attente de paiement.</p>
        <Link to="/checkout" className="inline-block rounded-full bg-emerald-600 px-6 py-3 font-semibold text-white">
          Réessayer le paiement
        </Link>
      </div>
    </div>
  )
}
