import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { eq, and } from 'drizzle-orm'
import { db } from '../../db'
import { cartItems, products, vendors } from '../../db/schema'
import { requireAuthMiddleware } from '../middleware/identity'
import { ensureUserProfile } from './users.server'
import { priceForQuantity } from './catalog.server'

async function loadCart(userId: string) {
  const rows = await db
    .select({
      id: cartItems.id,
      quantity: cartItems.quantity,
      productId: products.id,
      name: products.name,
      slug: products.slug,
      images: products.images,
      retailPrice: products.retailPrice,
      wholesalePrice: products.wholesalePrice,
      minWholesaleQty: products.minWholesaleQty,
      stock: products.stock,
      vendorName: vendors.shopName,
    })
    .from(cartItems)
    .innerJoin(products, eq(cartItems.productId, products.id))
    .leftJoin(vendors, eq(products.vendorId, vendors.id))
    .where(eq(cartItems.userId, userId))

  const items = rows.map((r) => {
    const unitPrice = priceForQuantity(r, r.quantity)
    return { ...r, unitPrice, lineTotal: unitPrice * r.quantity }
  })
  const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0)
  return { items, subtotal }
}

export const getCart = createServerFn({ method: 'GET' })
  .middleware([requireAuthMiddleware])
  .handler(async ({ context }) => {
    await ensureUserProfile(context.user)
    return loadCart(context.user.id)
  })

export const addToCart = createServerFn({ method: 'POST' })
  .middleware([requireAuthMiddleware])
  .inputValidator(z.object({ productId: z.number().int(), quantity: z.number().int().min(1) }))
  .handler(async ({ context, data }) => {
    await ensureUserProfile(context.user)
    const existing = await db
      .select()
      .from(cartItems)
      .where(
        and(eq(cartItems.userId, context.user.id), eq(cartItems.productId, data.productId)),
      )

    if (existing[0]) {
      await db
        .update(cartItems)
        .set({ quantity: existing[0].quantity + data.quantity })
        .where(eq(cartItems.id, existing[0].id))
    } else {
      await db.insert(cartItems).values({
        userId: context.user.id,
        productId: data.productId,
        quantity: data.quantity,
      })
    }
    return loadCart(context.user.id)
  })

export const updateCartItem = createServerFn({ method: 'POST' })
  .middleware([requireAuthMiddleware])
  .inputValidator(z.object({ id: z.number().int(), quantity: z.number().int().min(0) }))
  .handler(async ({ context, data }) => {
    if (data.quantity === 0) {
      await db
        .delete(cartItems)
        .where(and(eq(cartItems.id, data.id), eq(cartItems.userId, context.user.id)))
    } else {
      await db
        .update(cartItems)
        .set({ quantity: data.quantity })
        .where(and(eq(cartItems.id, data.id), eq(cartItems.userId, context.user.id)))
    }
    return loadCart(context.user.id)
  })

export const removeCartItem = createServerFn({ method: 'POST' })
  .middleware([requireAuthMiddleware])
  .inputValidator(z.object({ id: z.number().int() }))
  .handler(async ({ context, data }) => {
    await db
      .delete(cartItems)
      .where(and(eq(cartItems.id, data.id), eq(cartItems.userId, context.user.id)))
    return loadCart(context.user.id)
  })
