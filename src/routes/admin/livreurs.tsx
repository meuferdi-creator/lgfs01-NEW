import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useServerFn } from '@tanstack/react-start'
import { listAllDrivers, reviewDriver } from '@/server/admin.functions'

export const Route = createFileRoute('/admin/livreurs')({
  loader: async () => listAllDrivers(),
  component: AdminDriversPage,
})

function AdminDriversPage() {
  const initial = Route.useLoaderData()
  const reviewFn = useServerFn(reviewDriver)
  const [drivers, setDrivers] = useState(initial)

  const handleReview = async (driverId: number, approve: boolean) => {
    const updated = await reviewFn({ data: { driverId, approve } })
    setDrivers(drivers.map((d) => (d.id === updated.id ? updated : d)))
  }

  return (
    <div className="space-y-3">
      {drivers.map((d) => (
        <div key={d.id} className="flex items-center justify-between rounded-xl border border-neutral-200 p-4">
          <div>
            <p className="font-medium">{d.zone} — {d.vehicleType}</p>
            <p className="text-sm text-neutral-500">Statut : {d.status}</p>
          </div>
          {d.status === 'pending' && (
            <div className="flex gap-2">
              <button onClick={() => handleReview(d.id, true)} className="rounded-full bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700">
                Approuver
              </button>
              <button onClick={() => handleReview(d.id, false)} className="rounded-full bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700">
                Rejeter
              </button>
            </div>
          )}
        </div>
      ))}
      {drivers.length === 0 && <p className="text-sm text-neutral-500">Aucun livreur.</p>}
    </div>
  )
}
