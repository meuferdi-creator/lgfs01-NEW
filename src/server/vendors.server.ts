import { eq, desc, inArray, sql } from 'drizzle-orm'
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
  // Compter les produits avec une requête SQL agrégée
  const productCountResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(products)
    .where(eq(products.vendorId, vendorId))
  const productCount = Number(productCountResult[0]?.count ?? 0)

  // Calculer le revenu et le nombre de commandes payées avec une jointure SQL
  // On joint orderItems avec orders pour filtrer uniquement les commandes payées
  const revenueResult = await db
    .select({
      totalRevenue: sql<number>`coalesce(sum(${orderItems.lineTotal} - ${orderItems.commissionAmount}), 0)`,
      ordersCount: sql<number>`count(distinct ${orderItems.orderId})`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(eq(orderItems.vendorId, vendorId))
    .where(eq(orders.paymentStatus, 'paid'))

  const revenue = Number(revenueResult[0]?.totalRevenue ?? 0)
  const ordersCount = Number(revenueResult[0]?.ordersCount ?? 0)

  return {
    productCount,
    ordersCount,
    revenue,
  }
}
