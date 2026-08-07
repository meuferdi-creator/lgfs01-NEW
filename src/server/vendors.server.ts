import { eq, desc, inArray } from 'drizzle-orm'
import { db } from '../../db'
import { vendors, kycDocuments, products, orderItems, orders } from '../../db/schema'

export async function getVendorByUserId(userId: string) {
  const rows = await db.select().from(vendors).where(eq(vendors.userId, userId))
  return rows[0] ?? null
}

export async function requireApprovedVendor(userId: string) {
  const vendor = await getVendorByUserId(userId)
  if (!vendor) throw new Error('No vendor account for this user')
  if (vendor.status !== 'approved') throw new Error('Vendor account not approved yet')
  return vendor
}

export async function listVendorProducts(vendorId: number) {
  return db.select().from(products).where(eq(products.vendorId, vendorId)).orderBy(desc(products.createdAt))
}

export async function listVendorOrders(vendorId: number) {
  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.vendorId, vendorId))
    .orderBy(desc(orderItems.id))

  const orderIds = [...new Set(items.map((i) => i.orderId))]
  const parentOrders = orderIds.length
    ? await db.select().from(orders).where(inArray(orders.id, orderIds))
    : []

  return items.map((item) => ({
    ...item,
    order: parentOrders.find((o) => o.id === item.orderId) ?? null,
  }))
}

export async function vendorStats(vendorId: number) {
  const vendorProducts = await listVendorProducts(vendorId)
  const vendorOrderItems = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.vendorId, vendorId))

  const paidOrderIds = new Set(
    (
      await db.select().from(orders).where(eq(orders.paymentStatus, 'paid'))
    ).map((o) => o.id),
  )

  const paidItems = vendorOrderItems.filter((i) => paidOrderIds.has(i.orderId))
  const revenue = paidItems.reduce(
    (sum, i) => sum + (Number(i.lineTotal) - Number(i.commissionAmount)),
    0,
  )

  return {
    productCount: vendorProducts.length,
    ordersCount: new Set(paidItems.map((i) => i.orderId)).size,
    revenue,
  }
}
