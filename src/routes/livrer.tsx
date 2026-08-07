import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { useServerFn } from '@tanstack/react-start'
import { applyAsDriver } from '@/server/drivers.functions'
import { useIdentity } from '@/lib/identity-context'

export const Route = createFileRoute('/livrer')({
  component: DriverApplyPage,
})

function DriverApplyPage() {
  const { user, ready } = useIdentity()
  const router = useRouter()
  const applyFn = useServerFn(applyAsDriver)
  const [status, setStatus] = useState<'idle' | 'pending' | 'error'>('idle')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!ready || !user) {
      router.navigate({ to: '/connexion' })
      return
    }
    setStatus('pending')
    setError('')
    try {
      const formData = new FormData(e.currentTarget)
      await applyFn({ data: formData })
      router.navigate({ to: '/compte' })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'envoi")
      setStatus('error')
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-extrabold">Devenir livreur pour LGF's Mall</h1>
      <p className="mt-2 text-sm text-neutral-600">
        Une vérification KYC (pièce d'identité + selfie) et une validation par un administrateur
        sont requises avant de recevoir des missions de livraison.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-2xl border border-neutral-200 p-6">
        <div>
          <label className="text-sm font-medium">Type de véhicule</label>
          <select name="vehicleType" className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2">
            <option value="motorcycle">Moto</option>
            <option value="car">Voiture</option>
            <option value="bicycle">Vélo</option>
            <option value="van">Camionnette</option>
          </select>
        </div>
        <input name="zone" required placeholder="Zone de livraison (ex: Lomé Centre)" className="w-full rounded-lg border border-neutral-300 px-3 py-2" />

        <div>
          <label className="text-sm font-medium">Type de pièce d'identité</label>
          <select name="idType" className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2">
            <option value="driver_license">Permis de conduire</option>
            <option value="national_id">Carte nationale d'identité</option>
          </select>
        </div>
        <input name="idNumber" required placeholder="Numéro de la pièce" className="w-full rounded-lg border border-neutral-300 px-3 py-2" />

        <div>
          <label className="text-sm font-medium">Photo de la pièce d'identité</label>
          <input type="file" name="idDocument" accept="image/*,.pdf" required className="mt-1 w-full text-sm" />
        </div>
        <div>
          <label className="text-sm font-medium">Selfie de vérification</label>
          <input type="file" name="selfie" accept="image/*" className="mt-1 w-full text-sm" />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          disabled={status === 'pending'}
          className="w-full rounded-full bg-emerald-600 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {status === 'pending' ? 'Envoi...' : 'Soumettre ma demande'}
        </button>
      </form>
    </div>
  )
}
