import { createFileRoute, Link, Outlet, redirect } from '@tanstack/react-router'
import { getServerUser, isAdmin } from '@/lib/auth'

export const Route = createFileRoute('/admin')({
  beforeLoad: async () => {
    const user = await getServerUser()
    if (!user || !isAdmin(user)) throw redirect({ to: '/connexion' })
    return { user }
  },
  component: AdminLayout,
})

function AdminLayout() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-extrabold">Administration LGF's Mall</h1>
      <nav className="mt-4 flex flex-wrap gap-4 border-b border-neutral-200 text-sm font-medium text-neutral-600">
        {[
          { to: '/admin', label: 'Aperçu' },
          { to: '/admin/vendeurs', label: 'Vendeurs' },
          { to: '/admin/livreurs', label: 'Livreurs' },
          { to: '/admin/kyc', label: 'KYC' },
          { to: '/admin/commandes', label: 'Commandes' },
          { to: '/admin/coupons', label: 'Coupons' },
          { to: '/admin/investissements', label: 'Investissements' },
          { to: '/admin/tickets', label: 'Support' },
        ].map((tab) => (
          <Link
            key={tab.to}
            to={tab.to}
            activeOptions={{ exact: tab.to === '/admin' }}
            className="border-b-2 border-transparent pb-3 hover:text-emerald-700"
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
