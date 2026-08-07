import { eq, and, inArray } from 'drizzle-orm'
import { db } from '../../db'
import {
  cartItems,
  orders,
  orderItems,
  products,
  vendors,
  users,
  walletTransactions,
} from '../../db/schema'
import { priceForQuantity } from './catalog.server'

const DELIVERY_FEE = 1500

export async function buildOrderFromCart(userId: string) {
  const rows = await db
    .select({
      productId: products.id,
      name: products.name,
      retailPrice: products.retailPrice,
      wholesalePrice: products.wholesalePrice,
      minWholesaleQty: products.minWholesaleQty,
      stock: products.stock,
      quantity: cartItems.quantity,
      vendorId: products.vendorId,
      commissionRate: vendors.commissionRate,
      cartItemId: cartItems.id,
    })
    .from(cartItems)
    .innerJoin(products, eq(cartItems.productId, products.id))
    .leftJoin(vendors, eq(products.vendorId, vendors.id))
    .where(eq(cartItems.userId, userId))

  if (rows.length === 0) throw new Error('Cart is empty')

  for (const r of rows) {
    if (r.quantity > r.stock) {
      throw new Error(`Stock insuffisant pour "${r.name}"`)
    }
  }

  const lines = rows.map((r) => {
    const unitPrice = priceForQuantity(r, r.quantity)
    const lineTotal = unitPrice * r.quantity
    const commissionAmount = r.vendorId
      ? (lineTotal * Number(r.commissionRate ?? 10)) / 100
      : lineTotal
    return {
      productId: r.productId,
      vendorId: r.vendorId,
      productName: r.name,
      unitPrice: String(unitPrice),
      quantity: r.quantity,
      lineTotal: String(lineTotal),
      commissionAmount: String(commissionAmount),
    }
  })

  const subtotal = lines.reduce((sum, l) => sum + Number(l.lineTotal), 0)
  const deliveryFee = DELIVERY_FEE
  const total = subtotal + deliveryFee

  return { lines, subtotal, deliveryFee, total }
}

export async function createPendingOrder(
  userId: string,
  shippingAddress: {
    fullName: string
    phone: string
    city: string
    country: string
    addressLine: string
  },
) {
  const { lines, subtotal, deliveryFee, total } = await buildOrderFromCart(userId)

  const [order] = await db
    .insert(orders)
    .values({
      userId,
      status: 'pending',
      subtotal: String(subtotal),
      deliveryFee: String(deliveryFee),
      total: String(total),
      paymentStatus: 'unpaid',
      shippingAddress,
    })
    .returning()

  await db.insert(orderItems).values(
    lines.map((l) => ({
      orderId: order.id,
      productId: l.productId,
      vendorId: l.vendorId,
      productName: l.productName,
      unitPrice: l.unitPrice,
      quantity: l.quantity,
      lineTotal: l.lineTotal,
      commissionAmount: l.commissionAmount,
    })),
  )

  return order
}

/** Finalizes a paid order: decrements stock, credits vendor wallets, clears the cart. Idempotent. */
export async function markOrderPaid(orderId: number, provider: string) {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId))
  if (!order) throw new Error('Order not found')
  if (order.paymentStatus === 'paid') return order

  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId))

  for (const item of items) {
    if (!item.productId) continue
    const [p] = await db.select().from(products).where(eq(products.id, item.productId))
    if (p) {
      await db
        .update(products)
        .set({ stock: Math.max(0, p.stock - item.quantity) })
        .where(eq(products.id, item.productId))
    }

    if (item.vendorId) {
      const vendorRows = await db.select().from(vendors).where(eq(vendors.id, item.vendorId))
      const vendor = vendorRows[0]
      if (vendor) {
        const net = Number(item.lineTotal) - Number(item.commissionAmount)
        const [profile] = await db.select().from(users).where(eq(users.id, vendor.userId))
        if (profile) {
          await db
            .update(users)
            .set({ walletBalance: String(Number(profile.walletBalance) + net) })
            .where(eq(users.id, vendor.userId))
          await db.insert(walletTransactions).values({
            userId: vendor.userId,
            type: 'credit',
            amount: String(net),
            reason: `Vente commande #${order.id} — ${item.productName}`,
            referenceOrderId: order.id,
          })
        }
      }
    }
  }

  const [updated] = await db
    .update(orders)
    .set({ status: 'paid', paymentStatus: 'paid', paymentProvider: provider })
    .where(eq(orders.id, orderId))
    .returning()

  await db.delete(cartItems).where(eq(cartItems.userId, order.userId))

  return updated
}

export async function listMyOrders(userId: string) {
  const rows = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(orders.createdAt)

  const ids = rows.map((r) => r.id)
  const items = ids.length
    ? await db.select().from(orderItems).where(inArray(orderItems.orderId, ids))
    : []

  return rows
    .map((o) => ({ ...o, items: items.filter((i) => i.orderId === o.id) }))
    .reverse()
}

export async function getOrderForUser(orderId: number, userId: string) {
  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
  if (!order) return null
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId))
  return { ...order, items }
}
