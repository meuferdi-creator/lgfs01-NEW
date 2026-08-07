import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useServerFn } from '@tanstack/react-start'
import { listAllVendors, reviewVendor } from '@/server/admin.functions'

export const Route = createFileRoute('/admin/vendeurs')({
  loader: async () => listAllVendors(),
  component: AdminVendorsPage,
})

function AdminVendorsPage() {
  const initial = Route.useLoaderData()
  const reviewFn = useServerFn(reviewVendor)
  const [vendors, setVendors] = useState(initial)
  const [reason, setReason] = useState<Record<number, string>>({})

  const handleReview = async (vendorId: number, approve: boolean) => {
    const updated = await reviewFn({ data: { vendorId, approve, reason: reason[vendorId] } })
    setVendors(vendors.map((v) => (v.id === updated.id ? updated : v)))
  }

  return (
    <div className="space-y-3">
      {vendors.map((v) => (
        <div key={v.id} className="rounded-xl border border-neutral-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{v.shopName}</p>
              <p className="text-sm text-neutral-500">{v.city} · Statut : {v.status}</p>
            </div>
            {v.status === 'pending' && (
              <div className="flex items-center gap-2">
                <input
                  placeholder="Motif de rejet (optionnel)"
                  value={reason[v.id] ?? ''}
                  onChange={(e) => setReason({ ...reason, [v.id]: e.target.value })}
                  className="rounded-lg border border-neutral-300 px-2 py-1 text-sm"
                />
                <button onClick={() => handleReview(v.id, true)} className="rounded-full bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700">
                  Approuver
                </button>
                <button onClick={() => handleReview(v.id, false)} className="rounded-full bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700">
                  Rejeter
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
      {vendors.length === 0 && <p className="text-sm text-neutral-500">Aucun vendeur.</p>}
    </div>
  )
}
