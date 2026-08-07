import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useServerFn } from '@tanstack/react-start'
import { listCoupons, createCoupon } from '@/server/admin.functions'
import { formatMoney } from '@/lib/format'

export const Route = createFileRoute('/admin/coupons')({
  loader: async () => listCoupons(),
  component: AdminCouponsPage,
})

function AdminCouponsPage() {
  const initial = Route.useLoaderData()
  const [coupons, setCoupons] = useState(initial)
  const createFn = useServerFn(createCoupon)
  const [form, setForm] = useState({ code: '', discountType: 'percent' as 'percent' | 'fixed', discountValue: '10', minOrderAmount: '0', usageLimit: '0' })
  const [error, setError] = useState('')

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const created = await createFn({
        data: {
          code: form.code,
          discountType: form.discountType,
          discountValue: Number(form.discountValue),
          minOrderAmount: Number(form.minOrderAmount),
          usageLimit: Number(form.usageLimit),
        },
      })
      setCoupons([created, ...coupons])
      setForm({ code: '', discountType: 'percent', discountValue: '10', minOrderAmount: '0', usageLimit: '0' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleCreate} className="grid gap-3 rounded-2xl border border-neutral-200 p-6 sm:grid-cols-2">
        <input required placeholder="Code (ex: PROMO10)" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="rounded-lg border border-neutral-300 px-3 py-2" />
        <select value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value as 'percent' | 'fixed' })} className="rounded-lg border border-neutral-300 px-3 py-2">
          <option value="percent">Pourcentage</option>
          <option value="fixed">Montant fixe</option>
        </select>
        <input type="number" required placeholder="Valeur de la réduction" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} className="rounded-lg border border-neutral-300 px-3 py-2" />
        <input type="number" placeholder="Montant minimum de commande" value={form.minOrderAmount} onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })} className="rounded-lg border border-neutral-300 px-3 py-2" />
        <input type="number" placeholder="Limite d'utilisation (0 = illimité)" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} className="rounded-lg border border-neutral-300 px-3 py-2" />
        {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
        <button className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 sm:col-span-2">
          Créer le coupon
        </button>
      </form>

      <div className="space-y-2">
        {coupons.map((c) => (
          <div key={c.id} className="flex items-center justify-between rounded-xl border border-neutral-200 p-4">
            <p className="font-mono font-medium">{c.code}</p>
            <p className="text-sm text-neutral-500">
              {c.discountType === 'percent' ? `${c.discountValue}%` : formatMoney(c.discountValue)} · min {formatMoney(c.minOrderAmount)} · utilisé {c.usedCount}/{c.usageLimit || '∞'}
            </p>
          </div>
        ))}
        {coupons.length === 0 && <p className="text-sm text-neutral-500">Aucun coupon.</p>}
      </div>
    </div>
  )
}
