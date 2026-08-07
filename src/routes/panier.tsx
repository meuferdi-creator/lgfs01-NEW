import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useServerFn } from '@tanstack/react-start'
import { getCart, updateCartItem, removeCartItem } from '@/server/cart.functions'
import { formatMoney } from '@/lib/format'
import { useIdentity } from '@/lib/identity-context'

export const Route = createFileRoute('/panier')({
  component: CartPage,
})

function CartPage() {
  const { user, ready } = useIdentity()
  const router = useRouter()
  const updateFn = useServerFn(updateCartItem)
  const removeFn = useServerFn(removeCartItem)
  const [cart, setCart] = useState<Awaited<ReturnType<typeof getCart>> | null>(null)

  useEffect(() => {
    if (!ready) return
    if (!user) {
      router.navigate({ to: '/connexion' })
      return
    }
    getCart().then(setCart)
  }, [ready, user])

  if (!cart) return <div className="p-10 text-center text-neutral-500">Chargement du panier...</div>

  const DELIVERY_FEE = cart.items.length > 0 ? 1500 : 0

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-extrabold">Mon panier</h1>

      {cart.items.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-neutral-300 p-16 text-center text-neutral-500">
          <p>Votre panier est vide.</p>
          <Link to="/" className="mt-3 inline-block text-emerald-700 underline">
            Continuer les achats
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {cart.items.map((item) => (
            <div key={item.id} className="flex items-center gap-4 rounded-xl border border-neutral-200 p-4">
              <div className="h-16 w-16 overflow-hidden rounded-lg bg-neutral-100">
                {item.images[0] && <img src={item.images[0]} className="h-full w-full object-cover" />}
              </div>
              <div className="flex-1">
                <Link to="/produits/$slug" params={{ slug: item.slug }} className="font-semibold hover:underline">
                  {item.name}
                </Link>
                <p className="text-sm text-neutral-500">{item.vendorName || "LGF's Mall"}</p>
                <p className="text-sm font-medium text-emerald-700">{formatMoney(item.unitPrice)} / unité</p>
              </div>
              <input
                type="number"
                min={0}
                max={item.stock}
                value={item.quantity}
                onChange={async (e) => {
                  const quantity = Math.max(0, Number(e.target.value))
                  const updated = await updateFn({ data: { id: item.id, quantity } })
                  setCart(updated)
                }}
                className="w-16 rounded-lg border border-neutral-300 px-2 py-1 text-center"
              />
              <p className="w-24 text-right font-semibold">{formatMoney(item.lineTotal)}</p>
              <button
                onClick={async () => setCart(await removeFn({ data: { id: item.id } }))}
                className="text-neutral-400 hover:text-red-600"
                aria-label="Retirer"
              >
                ✕
              </button>
            </div>
          ))}

          <div className="mt-6 rounded-xl border border-neutral-200 p-5">
            <div className="flex justify-between text-sm text-neutral-600">
              <span>Sous-total</span>
              <span>{formatMoney(cart.subtotal)}</span>
            </div>
            <div className="mt-1 flex justify-between text-sm text-neutral-600">
              <span>Livraison</span>
              <span>{formatMoney(DELIVERY_FEE)}</span>
            </div>
            <div className="mt-3 flex justify-between border-t border-neutral-200 pt-3 text-lg font-bold">
              <span>Total</span>
              <span>{formatMoney(cart.subtotal + DELIVERY_FEE)}</span>
            </div>
            <Link
              to="/checkout"
              className="mt-4 block rounded-full bg-emerald-600 py-3 text-center font-semibold text-white hover:bg-emerald-700"
            >
              Passer à la commande
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
