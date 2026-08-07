import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useServerFn } from '@tanstack/react-start'
import {
  createOrder,
  payOrderWithStripe,
  payOrderWithWallet,
  getStripeEnabled,
} from '@/server/orders.functions'
import { getMyWallet } from '@/server/users.functions'
import { useIdentity } from '@/lib/identity-context'
import { formatMoney } from '@/lib/format'

export const Route = createFileRoute('/checkout')({
  component: CheckoutPage,
})

function CheckoutPage() {
  const { user, ready } = useIdentity()
  const router = useRouter()
  const createOrderFn = useServerFn(createOrder)
  const payStripeFn = useServerFn(payOrderWithStripe)
  const payWalletFn = useServerFn(payOrderWithWallet)

  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    city: '',
    country: 'Togo',
    addressLine: '',
  })
  const [order, setOrder] = useState<Awaited<ReturnType<typeof createOrder>> | null>(null)
  const [stripeEnabled, setStripeEnabled] = useState(false)
  const [walletBalance, setWalletBalance] = useState(0)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!ready) return
    if (!user) {
      router.navigate({ to: '/connexion' })
      return
    }
    getStripeEnabled().then(setStripeEnabled)
    getMyWallet().then((w) => setWalletBalance(Number(w.balance)))
  }, [ready, user])

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const created = await createOrderFn({ data: form })
      setOrder(created)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création de la commande')
    } finally {
      setBusy(false)
    }
  }

  const payWithStripe = async () => {
    if (!order) return
    setBusy(true)
    try {
      const url = await payStripeFn({ data: { orderId: order.id } })
      if (url) window.location.href = url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de paiement')
      setBusy(false)
    }
  }

  const payWithWallet = async () => {
    if (!order) return
    setBusy(true)
    setError('')
    try {
      await payWalletFn({ data: { orderId: order.id } })
      router.navigate({ to: '/checkout/success' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de paiement')
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-extrabold">Finaliser la commande</h1>

      {!order ? (
        <form onSubmit={handleCreateOrder} className="mt-6 space-y-4 rounded-2xl border border-neutral-200 p-6">
          <h2 className="font-semibold">Adresse de livraison</h2>
          <input
            required
            placeholder="Nom complet"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2"
          />
          <input
            required
            placeholder="Téléphone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              required
              placeholder="Ville"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="rounded-lg border border-neutral-300 px-3 py-2"
            />
            <input
              required
              placeholder="Pays"
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
              className="rounded-lg border border-neutral-300 px-3 py-2"
            />
          </div>
          <input
            required
            placeholder="Adresse (quartier, rue, indications)"
            value={form.addressLine}
            onChange={(e) => setForm({ ...form, addressLine: e.target.value })}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            disabled={busy}
            className="w-full rounded-full bg-emerald-600 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {busy ? 'Création...' : 'Continuer vers le paiement'}
          </button>
        </form>
      ) : (
        <div className="mt-6 space-y-4 rounded-2xl border border-neutral-200 p-6">
          <div className="flex justify-between text-lg font-bold">
            <span>Total à payer</span>
            <span>{formatMoney(order.total)}</span>
          </div>
          <p className="text-sm text-neutral-500">Commande #{order.id} créée. Choisissez un mode de paiement.</p>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="space-y-3">
            <button
              onClick={payWithWallet}
              disabled={busy || walletBalance < Number(order.total)}
              className="w-full rounded-full border border-emerald-600 py-3 font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-40"
            >
              Payer avec mon portefeuille ({formatMoney(walletBalance)} disponible)
            </button>
            <button
              onClick={payWithStripe}
              disabled={busy || !stripeEnabled}
              className="w-full rounded-full bg-neutral-900 py-3 font-semibold text-white hover:bg-neutral-700 disabled:opacity-40"
            >
              {stripeEnabled ? 'Payer par carte bancaire (Stripe)' : 'Carte bancaire — indisponible'}
            </button>
            <p className="text-xs text-neutral-400">
              Mobile Money (MTN, Moov, Flooz), Wave et autres moyens locaux seront activés dès la
              configuration des fournisseurs de paiement — architecture prête, voir la documentation.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
