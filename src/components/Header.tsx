import { useEffect, useState } from 'react'
import { Link, useRouter } from '@tanstack/react-router'
import { useIdentity } from '@/lib/identity-context'
import { getCart } from '@/server/cart.functions'

const WHATSAPP_NUMBER = import.meta.env.VITE_SUPPORT_WHATSAPP || '22890000000'

export function Header() {
  const { user, ready, logout } = useIdentity()
  const router = useRouter()
  const [cartCount, setCartCount] = useState(0)
  const isAdmin = user?.roles?.includes('admin') || user?.roles?.includes('super_admin')

  useEffect(() => {
    if (!ready || !user) {
      setCartCount(0)
      return
    }
    getCart()
      .then((cart) => setCartCount(cart.items.reduce((n, i) => n + i.quantity, 0)))
      .catch(() => setCartCount(0))
  }, [ready, user])

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
            L
          </span>
          LGF's Mall
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-neutral-700 md:flex">
          <Link to="/" className="hover:text-emerald-700">
            Boutique
          </Link>
          <Link to="/investissements" className="hover:text-emerald-700">
            Investissements
          </Link>
          <Link to="/vendre" className="hover:text-emerald-700">
            Vendre sur LGF
          </Link>
          <Link to="/livrer" className="hover:text-emerald-700">
            Devenir livreur
          </Link>
          <Link to="/support" className="hover:text-emerald-700">
            Support
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noreferrer"
            className="hidden rounded-full bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700 hover:bg-green-100 sm:inline-block"
          >
            WhatsApp
          </a>

          <Link
            to="/panier"
            className="relative rounded-full p-2 text-neutral-700 hover:bg-neutral-100"
            aria-label="Panier"
          >
            🛒
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                {cartCount}
              </span>
            )}
          </Link>

          {!ready ? null : user ? (
            <div className="flex items-center gap-2">
              {isAdmin && (
                <Link
                  to="/admin"
                  className="rounded-full bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-700"
                >
                  Admin
                </Link>
              )}
              <Link
                to="/compte"
                className="rounded-full bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Mon compte
              </Link>
              <button
                onClick={async () => {
                  await logout()
                  router.navigate({ to: '/' })
                }}
                className="text-sm font-medium text-neutral-500 hover:text-neutral-800"
              >
                Déconnexion
              </button>
            </div>
          ) : (
            <Link
              to="/connexion"
              className="rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Se connecter
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
