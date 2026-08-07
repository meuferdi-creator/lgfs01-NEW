import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useServerFn } from '@tanstack/react-start'
import { getMyWalletTransactions, topUpWalletWithStripe, confirmWalletTopup, getStripeEnabled } from '@/server/orders.functions'
import { getMyWallet } from '@/server/users.functions'
import { formatMoney } from '@/lib/format'

export const Route = createFileRoute('/compte/portefeuille')({
  validateSearch: (search: Record<string, unknown>) => ({
    session_id: (search.session_id as string) || undefined,
  }),
  loader: async () => {
    const [wallet, transactions, stripeEnabled] = await Promise.all([
      getMyWallet(),
      getMyWalletTransactions(),
      getStripeEnabled(),
    ])
    return { wallet, transactions, stripeEnabled }
  },
  component: WalletPage,
})

function WalletPage() {
  const { wallet, transactions, stripeEnabled } = Route.useLoaderData()
  const { session_id } = Route.useSearch()
  const topUpFn = useServerFn(topUpWalletWithStripe)
  const confirmFn = useServerFn(confirmWalletTopup)
  const [amount, setAmount] = useState(5000)
  const [balance, setBalance] = useState(Number(wallet.balance))
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (session_id) {
      confirmFn({ data: { sessionId: session_id } }).then((r) => setBalance(Number(r.balance)))
    }
  }, [session_id])

  const handleTopUp = async () => {
    setBusy(true)
    try {
      const url = await topUpFn({ data: { amount } })
      if (url) window.location.href = url
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
        <p className="text-sm text-emerald-700">Solde disponible</p>
        <p className="text-3xl font-extrabold text-emerald-800">{formatMoney(balance)}</p>

        <div className="mt-4 flex items-center gap-3">
          <input
            type="number"
            min={500}
            step={500}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-32 rounded-lg border border-emerald-300 px-3 py-2"
          />
          <button
            onClick={handleTopUp}
            disabled={busy || !stripeEnabled}
            className="rounded-full bg-emerald-600 px-5 py-2 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {stripeEnabled ? 'Recharger par carte' : 'Recharge indisponible (Stripe non configuré)'}
          </button>
        </div>
      </div>

      <div>
        <h2 className="font-semibold">Historique</h2>
        <div className="mt-3 space-y-2">
          {transactions.length === 0 && <p className="text-sm text-neutral-500">Aucune transaction.</p>}
          {transactions.map((tx) => (
            <div key={tx.id} className="flex justify-between rounded-lg border border-neutral-200 px-4 py-2 text-sm">
              <span>{tx.reason}</span>
              <span className={tx.type === 'credit' ? 'text-emerald-700' : 'text-red-600'}>
                {tx.type === 'credit' ? '+' : '-'}
                {formatMoney(tx.amount)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
