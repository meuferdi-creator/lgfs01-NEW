import { createFileRoute, Link, Outlet, redirect } from '@tanstack/react-router'
import { getServerUser } from '@/lib/auth'

export const Route = createFileRoute('/compte')({
  beforeLoad: async () => {
    const user = await getServerUser()
    if (!user) throw redirect({ to: '/connexion' })
    return { user }
  },
  component: AccountLayout,
})

function AccountLayout() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-extrabold">Mon compte</h1>
      <nav className="mt-4 flex gap-4 border-b border-neutral-200 text-sm font-medium text-neutral-600">
        {[
          { to: '/compte', label: 'Profil' },
          { to: '/compte/commandes', label: 'Commandes' },
          { to: '/compte/portefeuille', label: 'Portefeuille' },
          { to: '/compte/investissements', label: 'Investissements' },
        ].map((tab) => (
          <Link
            key={tab.to}
            to={tab.to}
            activeOptions={{ exact: tab.to === '/compte' }}
            className="border-b-2 border-transparent pb-3 hover:text-emerald-700 [&.active]:border-emerald-600 [&.active]:text-emerald-700"
            activeProps={{ className: 'border-emerald-600 text-emerald-700' }}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
      <div className="mt-6">
        <Outlet />
      </div>
    </div>
  )
}
