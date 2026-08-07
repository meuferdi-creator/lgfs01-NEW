import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { getProduct } from '@/server/catalog.functions'
import { addToCart } from '@/server/cart.functions'
import { addReview } from '@/server/reviews.functions'
import { useServerFn } from '@tanstack/react-start'
import { formatMoney } from '@/lib/format'
import { useIdentity } from '@/lib/identity-context'
import { useRouter } from '@tanstack/react-router'

export const Route = createFileRoute('/produits/$slug')({
  loader: async ({ params }) => {
    const product = await getProduct({ data: params.slug })
    if (!product) throw new Error('Produit introuvable')
    return product
  },
  component: ProductPage,
})

function ProductPage() {
  const product = Route.useLoaderData()
  const { user } = useIdentity()
  const router = useRouter()
  const addToCartFn = useServerFn(addToCart)
  const addReviewFn = useServerFn(addReview)
  const [qty, setQty] = useState(product.minWholesaleQty || 1)
  const [status, setStatus] = useState<'idle' | 'pending' | 'done' | 'error'>('idle')
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [reviewStatus, setReviewStatus] = useState<'idle' | 'pending' | 'done'>('idle')

  const unitPrice =
    product.wholesalePrice && product.minWholesaleQty > 0 && qty >= product.minWholesaleQty
      ? Number(product.wholesalePrice)
      : Number(product.retailPrice)

  const handleAddToCart = async () => {
    if (!user) {
      router.navigate({ to: '/connexion' })
      return
    }
    setStatus('pending')
    try {
      await addToCartFn({ data: { productId: product.id, quantity: qty } })
      setStatus('done')
    } catch {
      setStatus('error')
    }
  }

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      router.navigate({ to: '/connexion' })
      return
    }
    setReviewStatus('pending')
    await addReviewFn({ data: { productId: product.id, rating, comment } })
    setReviewStatus('done')
    router.invalidate()
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Link to="/" className="text-sm text-neutral-500 hover:text-emerald-700">
        &larr; Retour à la boutique
      </Link>

      <div className="mt-4 grid gap-10 md:grid-cols-2">
        <div className="aspect-square overflow-hidden rounded-2xl bg-neutral-100">
          {product.images[0] ? (
            <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-neutral-400">Pas d'image</div>
          )}
        </div>

        <div>
          <p className="text-sm text-neutral-500">{product.vendorName || "Vendu par LGF's Mall"}</p>
          <h1 className="mt-1 text-3xl font-extrabold">{product.name}</h1>
          {product.avgRating != null && (
            <p className="mt-1 text-sm text-amber-600">
              ★ {product.avgRating.toFixed(1)} ({product.reviews.length} avis)
            </p>
          )}
          <p className="mt-4 whitespace-pre-line text-neutral-700">{product.description}</p>

          <div className="mt-6 rounded-2xl border border-neutral-200 p-5">
            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-extrabold text-emerald-700">{formatMoney(unitPrice)}</span>
              {unitPrice !== Number(product.retailPrice) && (
                <span className="text-sm text-neutral-400 line-through">
                  {formatMoney(product.retailPrice)}
                </span>
              )}
            </div>
            {product.wholesalePrice && (
              <p className="mt-1 text-sm text-neutral-500">
                Prix de gros {formatMoney(product.wholesalePrice)} à partir de {product.minWholesaleQty}{' '}
                unités — appliqué automatiquement au panier.
              </p>
            )}
            <p className="mt-2 text-sm text-neutral-500">
              {product.stock > 0 ? `${product.stock} en stock` : 'Rupture de stock'} · SKU {product.sku}
            </p>

            <div className="mt-4 flex items-center gap-3">
              <input
                type="number"
                min={1}
                max={product.stock}
                value={qty}
                onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
                className="w-20 rounded-lg border border-neutral-300 px-3 py-2"
              />
              <button
                onClick={handleAddToCart}
                disabled={status === 'pending' || product.stock === 0}
                className="flex-1 rounded-full bg-emerald-600 py-2.5 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {product.stock === 0
                  ? 'Rupture de stock'
                  : status === 'pending'
                    ? 'Ajout...'
                    : status === 'done'
                      ? 'Ajouté ✓'
                      : 'Ajouter au panier'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <section className="mt-14">
        <h2 className="text-xl font-bold">Avis clients</h2>
        <div className="mt-4 space-y-4">
          {product.reviews.length === 0 && (
            <p className="text-sm text-neutral-500">Aucun avis pour le moment.</p>
          )}
          {product.reviews.map((r) => (
            <div key={r.id} className="rounded-xl border border-neutral-200 p-4">
              <p className="text-amber-600">{'★'.repeat(r.rating)}</p>
              <p className="mt-1 text-sm text-neutral-700">{r.comment}</p>
            </div>
          ))}
        </div>

        <form onSubmit={handleReview} className="mt-6 max-w-md space-y-3 rounded-xl border border-neutral-200 p-4">
          <p className="font-medium">Laisser un avis</p>
          <select
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2"
          >
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n} étoile{n > 1 ? 's' : ''}
              </option>
            ))}
          </select>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            required
            placeholder="Votre expérience avec ce produit..."
            className="w-full rounded-lg border border-neutral-300 px-3 py-2"
          />
          <button className="rounded-full bg-neutral-900 px-5 py-2 text-sm font-semibold text-white hover:bg-neutral-700">
            {reviewStatus === 'pending' ? 'Envoi...' : 'Publier l’avis'}
          </button>
        </form>
      </section>
    </div>
  )
}
