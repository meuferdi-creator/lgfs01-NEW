import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useServerFn } from '@tanstack/react-start'
import { getMyProfile, updateMyProfile } from '@/server/users.functions'
import { getMyVendor } from '@/server/vendors.functions'
import { getMyDriver } from '@/server/drivers.functions'
import { useIdentity } from '@/lib/identity-context'

export const Route = createFileRoute('/compte/')({
  loader: async () => {
    const [profile, vendor, driver] = await Promise.all([getMyProfile(), getMyVendor(), getMyDriver()])
    return { profile, vendor, driver }
  },
  component: ProfilePage,
})

function ProfilePage() {
  const { profile, vendor, driver } = Route.useLoaderData()
  const { user } = useIdentity()
  const updateFn = useServerFn(updateMyProfile)
  const [fullName, setFullName] = useState(profile.fullName)
  const [phone, setPhone] = useState(profile.phone)
  const [saved, setSaved] = useState(false)
  const isAdmin = user?.roles?.includes('admin') || user?.roles?.includes('super_admin')

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <form
        onSubmit={async (e) => {
          e.preventDefault()
          await updateFn({ data: { fullName, phone } })
          setSaved(true)
        }}
        className="space-y-3 rounded-2xl border border-neutral-200 p-6"
      >
        <h2 className="font-semibold">Informations personnelles</h2>
        <input value={profile.email} disabled className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-neutral-500" />
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Nom complet"
          className="w-full rounded-lg border border-neutral-300 px-3 py-2"
        />
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Téléphone"
          className="w-full rounded-lg border border-neutral-300 px-3 py-2"
        />
        <button className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
          Enregistrer
        </button>
        {saved && <p className="text-sm text-emerald-700">Profil mis à jour ✓</p>}
      </form>

      <div className="space-y-4">
        <div className="rounded-2xl border border-neutral-200 p-6">
          <h2 className="font-semibold">Espace vendeur</h2>
          {!vendor && (
            <>
              <p className="mt-1 text-sm text-neutral-500">Vous n'avez pas encore de boutique.</p>
              <Link to="/vendre" className="mt-2 inline-block text-sm font-medium text-emerald-700 underline">
                Devenir vendeur
              </Link>
            </>
          )}
          {vendor?.status === 'pending' && (
            <p className="mt-1 text-sm text-amber-600">Demande "{vendor.shopName}" en attente de validation admin.</p>
          )}
          {vendor?.status === 'rejected' && (
            <p className="mt-1 text-sm text-red-600">Demande rejetée : {vendor.rejectionReason}</p>
          )}
          {vendor?.status === 'approved' && (
            <Link to="/vendeur" className="mt-1 inline-block text-sm font-medium text-emerald-700 underline">
              Accéder au tableau de bord vendeur →
            </Link>
          )}
        </div>

        <div className="rounded-2xl border border-neutral-200 p-6">
          <h2 className="font-semibold">Espace livreur</h2>
          {!driver && (
            <>
              <p className="mt-1 text-sm text-neutral-500">Vous n'êtes pas encore livreur.</p>
              <Link to="/livrer" className="mt-2 inline-block text-sm font-medium text-emerald-700 underline">
                Devenir livreur
              </Link>
            </>
          )}
          {driver?.status === 'pending' && (
            <p className="mt-1 text-sm text-amber-600">Demande en attente de validation admin.</p>
          )}
          {driver?.status === 'approved' && (
            <Link to="/livreur" className="mt-1 inline-block text-sm font-medium text-emerald-700 underline">
              Accéder au tableau de bord livreur →
            </Link>
          )}
        </div>

        {isAdmin && (
          <div className="rounded-2xl border border-neutral-900 bg-neutral-900 p-6 text-white">
            <h2 className="font-semibold">Administration</h2>
            <Link to="/admin" className="mt-2 inline-block text-sm font-medium underline">
              Accéder au tableau de bord admin →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
