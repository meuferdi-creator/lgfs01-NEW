import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { getCategories, getProducts } from '@/server/catalog.functions'
import { formatMoney } from '@/lib/format'

export const Route = createFileRoute('/')({
  validateSearch: (search: Record<string, unknown>) => ({
    q: (search.q as string) || undefined,
    category: (search.category as string) || undefined,
  }),
  loaderDeps: ({ search }) => ({ q: search.q, category: search.category }),
  loader: async ({ deps }) => {
    const [categories, products] = await Promise.all([
      getCategories(),
      getProducts({ data: { search: deps.q, categorySlug: deps.category } }),
    ])
    return { categories, products }
  },
  component: MarketplaceHome,
})

function MarketplaceHome() {
  const { categories, products } = Route.useLoaderData()
  const search = Route.useSearch()
  const navigate = useNavigate()
  const [q, setQ] = useState(search.q ?? '')

  return (
    <div>
      <section className="bg-gradient-to-br from-emerald-700 via-emerald-600 to-emerald-500 py-14 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-emerald-100">
            Fait au Togo 🇹🇬 — pour toute l'Afrique de l'Ouest
          </p>
          <h1 className="max-w-2xl text-4xl font-extrabold leading-tight sm:text-5xl">
            La marketplace qui connecte vendeurs, clients et livreurs
          </h1>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              navigate({ to: '/', search: { q: q || undefined, category: search.category } })
            }}
            className="mt-8 flex max-w-xl overflow-hidden rounded-full bg-white shadow-lg"
          >
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher un produit, une marque..."
              className="flex-1 px-5 py-3 text-neutral-900 outline-none"
            />
            <button type="submit" className="bg-neutral-900 px-6 font-semibold text-white hover:bg-neutral-700">
              Rechercher
            </button>
          </form>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-8 flex flex-wrap gap-2">
          <Link
            to="/"
            search={{ q: search.q, category: undefined }}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              !search.category ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            Tout
          </Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              to="/"
              search={{ q: search.q, category: c.slug }}
              className={`rounded-full px-4 py-1.5 text-sm font-medium ${
                search.category === c.slug
                  ? 'bg-neutral-900 text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              {c.name}
            </Link>
          ))}
        </div>

        {products.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-300 p-16 text-center text-neutral-500">
            <p className="text-lg font-medium">Aucun produit ne correspond à cette recherche.</p>
            <p className="mt-1 text-sm">
              Les vendeurs approuvés publient leurs produits — revenez bientôt ou{' '}
              <Link to="/vendre" className="text-emerald-700 underline">
                devenez vendeur
              </Link>
              .
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <Link
                key={product.id}
                to="/produits/$slug"
                params={{ slug: product.slug }}
                className="group overflow-hidden rounded-2xl border border-neutral-200 bg-white transition hover:shadow-lg"
              >
                <div className="aspect-square overflow-hidden bg-neutral-100">
                  {product.images[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="h-full w-full object-cover transition group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-neutral-400">
                      Pas d'image
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="line-clamp-2 text-sm font-semibold text-neutral-900">
                    {product.name}
                  </h3>
                  <p className="mt-1 text-xs text-neutral-500">
                    {product.vendorName || "Vendu par LGF's Mall"}
                  </p>
                  <p className="mt-2 text-base font-bold text-emerald-700">
                    {formatMoney(product.retailPrice)}
                  </p>
                  {product.wholesalePrice && (
                    <p className="text-xs text-neutral-500">
                      Gros dès {product.minWholesaleQty} unités : {formatMoney(product.wholesalePrice)}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
