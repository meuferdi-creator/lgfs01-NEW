import { createFileRoute, redirect } from '@tanstack/react-router'
import { useState } from 'react'
import { useServerFn } from '@tanstack/react-start'
import { getServerUser } from '@/lib/auth'
import { getMyDriver, getMyDeliveries, setDriverAvailability, markDeliveryDone } from '@/server/drivers.functions'
import { formatMoney } from '@/lib/format'

export const Route = createFileRoute('/livreur')({
  beforeLoad: async () => {
    const user = await getServerUser()
    if (!user) throw redirect({ to: '/connexion' })
  },
  loader: async () => {
    const [driver, deliveries] = await Promise.all([getMyDriver(), getMyDeliveries()])
    return { driver, deliveries }
  },
  component: DriverDashboard,
})

const STATUS_LABEL: Record<string, string> = {
  paid: 'À préparer',
  processing: 'En préparation',
  shipped: 'En cours de livraison',
  delivered: 'Livrée',
}

function DriverDashboard() {
  const { driver, deliveries: initialDeliveries } = Route.useLoaderData()
  const availabilityFn = useServerFn(setDriverAvailability)
  const markDoneFn = useServerFn(markDeliveryDone)
  const [available, setAvailable] = useState(driver?.isAvailable ?? false)
  const [deliveries, setDeliveries] = useState(initialDeliveries)
  const [busyId, setBusyId] = useState<number | null>(null)

  if (!driver) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 text-sm text-neutral-600 sm:px-6">
        Vous n'avez pas encore de demande de livreur.{' '}
        <a href="/livrer" className="font-medium text-emerald-700 underline">Faire une demande</a>
      </div>
    )
  }

  if (driver.status !== 'approved') {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-700">
          {driver.status === 'pending'
            ? 'Votre demande de livreur est en attente de validation.'
            : 'Votre demande de livreur a été rejetée.'}
        </div>
      </div>
    )
  }

  const toggleAvailability = async () => {
    const updated = await availabilityFn({ data: { isAvailable: !available } })
    setAvailable(updated.isAvailable)
  }

  const handleMarkDone = async (orderId: number) => {
    setBusyId(orderId)
    try {
      await markDoneFn({ data: { orderId } })
      setDeliveries(deliveries.map((d) => (d.id === orderId ? { ...d, status: 'delivered' } : d)))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-extrabold">Tableau de bord livreur</h1>

      <div className="mt-4 flex items-center justify-between rounded-2xl border border-neutral-200 p-6">
        <div>
          <p className="font-semibold">Zone : {driver.zone}</p>
          <p className="text-sm text-neutral-500">Véhicule : {driver.vehicleType}</p>
        </div>
        <button
          onClick={toggleAvailability}
          className={`rounded-full px-5 py-2 text-sm font-semibold ${available ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'}`}
        >
          {available ? 'Disponible' : 'Indisponible'}
        </button>
      </div>

      <h2 className="mt-8 font-semibold">Mes livraisons</h2>
      <div className="mt-3 space-y-2">
        {deliveries.length === 0 && <p className="text-sm text-neutral-500">Aucune livraison assignée pour le moment.</p>}
        {deliveries.map((d) => (
          <div key={d.id} className="flex items-center justify-between rounded-xl border border-neutral-200 p-4">
            <div>
              <p className="font-medium">Commande #{d.id}</p>
              <p className="text-sm text-neutral-500">
                {d.shippingAddress.city} · {formatMoney(d.total)} · {STATUS_LABEL[d.status] ?? d.status}
              </p>
              <p className="text-sm text-neutral-500">Frais de livraison : {formatMoney(d.deliveryFee)}</p>
            </div>
            {d.status !== 'delivered' && (
              <button
                onClick={() => handleMarkDone(d.id)}
                disabled={busyId === d.id}
                className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {busyId === d.id ? '...' : 'Marquer livrée'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
