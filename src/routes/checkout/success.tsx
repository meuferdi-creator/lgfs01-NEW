import { Link, createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { confirmStripeOrder } from '@/server/orders.functions'

export const Route = createFileRoute('/checkout/success')({
  validateSearch: (search: Record<string, unknown>) => ({
    session_id: (search.session_id as string) || undefined,
  }),
  component: CheckoutSuccess,
})

function CheckoutSuccess() {
  const { session_id } = Route.useSearch()
  const [status, setStatus] = useState<'idle' | 'confirming' | 'done' | 'error'>('idle')

  useEffect(() => {
    if (!session_id) {
      setStatus('done')
      return
    }
    setStatus('confirming')
    confirmStripeOrder({ data: { sessionId: session_id } })
      .then(() => setStatus('done'))
      .catch(() => setStatus('error'))
  }, [session_id])

  return (
    <div className="flex min-h-[70vh] items-center justify-center p-5">
      <div className="max-w-lg rounded-2xl border p-12 text-center">
        <div className="mb-6 text-6xl">
          {status === 'confirming' ? '⏳' : status === 'error' ? '⚠️' : '✓'}
        </div>
        <h1 className="mb-4 text-3xl font-bold">
          {status === 'confirming'
            ? 'Confirmation du paiement...'
            : status === 'error'
              ? 'Paiement en attente de vérification'
              : 'Paiement réussi !'}
        </h1>
        <p className="mb-8 text-neutral-600">
          {status === 'error'
            ? 'Nous vérifions votre paiement, consultez vos commandes dans quelques instants.'
            : 'Merci pour votre achat. Suivez votre commande dans votre espace client.'}
        </p>
        <Link to="/compte/commandes" className="inline-block rounded-full bg-emerald-600 px-6 py-3 font-semibold text-white">
          Voir mes commandes
        </Link>
      </div>
    </div>
  )
}
