import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { eq, desc, count, sql, limit, offset } from 'drizzle-orm'
import { db } from '../../db'
import {
  vendors,
  drivers,
  kycDocuments,
  users,
  orders,
  orderItems,
  products,
  coupons,
  investmentProjects,
  investments,
  supportTickets,
} from '../../db/schema'
import { requireAdminMiddleware } from '../middleware/identity'

const LIST_PAGE_SIZE = 50

export const getAdminOverview = createServerFn({ method: 'GET' })
  .middleware([requireAdminMiddleware])
  .handler(async () => {
    const [userCount] = await db.select({ n: count() }).from(users)
    const [vendorPending] = await db
      .select({ n: count() })
      .from(vendors)
      .where(eq(vendors.status, 'pending'))
    const [driverPending] = await db
      .select({ n: count() })
      .from(drivers)
      .where(eq(drivers.status, 'pending'))
    const [orderCount] = await db.select({ n: count() }).from(orders)
    
    // Calcul du GMV avec une requête SQL agrégée au lieu de charger toutes les commandes
    const [gmvResult] = await db
      .select({ total: sql<number>`coalesce(sum(${orders.total}), 0)` })
      .from(orders)
      .where(eq(orders.paymentStatus, 'paid'))
    const gmv = Number(gmvResult?.total ?? 0)
    
    const [openTickets] = await db
      .select({ n: count() })
      .from(supportTickets)
      .where(eq(supportTickets.status, 'open'))

    return {
      userCount: userCount.n,
      vendorPending: vendorPending.n,
      driverPending: driverPending.n,
      orderCount: orderCount.n,
      gmv,
      openTickets: openTickets.n,
    }
  })

export const listAllVendors = createServerFn({ method: 'GET' })
  .middleware([requireAdminMiddleware])
  .inputValidator(z.object({ page: z.number().int().min(1).default(1) }).optional())
  .handler(async ({ data }) => {
    const page = data?.page ?? 1
    return db
      .select()
      .from(vendors)
      .orderBy(desc(vendors.createdAt))
      .limit(LIST_PAGE_SIZE)
      .offset((page - 1) * LIST_PAGE_SIZE)
  })

export const listAllDrivers = createServerFn({ method: 'GET' })
  .middleware([requireAdminMiddleware])
  .inputValidator(z.object({ page: z.number().int().min(1).default(1) }).optional())
  .handler(async ({ data }) => {
    const page = data?.page ?? 1
    return db
      .select()
      .from(drivers)
      .orderBy(desc(drivers.createdAt))
      .limit(LIST_PAGE_SIZE)
      .offset((page - 1) * LIST_PAGE_SIZE)
  })

export const listAllKyc = createServerFn({ method: 'GET' })
  .middleware([requireAdminMiddleware])
  .inputValidator(z.object({ page: z.number().int().min(1).default(1) }).optional())
  .handler(async ({ data }) => {
    const page = data?.page ?? 1
    return db
      .select()
      .from(kycDocuments)
      .orderBy(desc(kycDocuments.createdAt))
      .limit(LIST_PAGE_SIZE)
      .offset((page - 1) * LIST_PAGE_SIZE)
  })

export const reviewVendor = createServerFn({ method: 'POST' })
  .middleware([requireAdminMiddleware])
  .inputValidator(
    z.object({
      vendorId: z.number().int(),
      approve: z.boolean(),
      reason: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const [vendor] = await db
      .update(vendors)
      .set({
        status: data.approve ? 'approved' : 'rejected',
        rejectionReason: data.reason ?? '',
        reviewedAt: sql`now()`,
      })
      .where(eq(vendors.id, data.vendorId))
      .returning()

    await db
      .update(kycDocuments)
      .set({ status: data.approve ? 'approved' : 'rejected', reviewedAt: sql`now()` })
      .where(eq(kycDocuments.vendorId, data.vendorId))

    return vendor
  })

export const reviewDriver = createServerFn({ method: 'POST' })
  .middleware([requireAdminMiddleware])
  .inputValidator(z.object({ driverId: z.number().int(), approve: z.boolean() }))
  .handler(async ({ data }) => {
    const [driver] = await db
      .update(drivers)
      .set({ status: data.approve ? 'approved' : 'rejected' })
      .where(eq(drivers.id, data.driverId))
      .returning()

    await db
      .update(kycDocuments)
      .set({ status: data.approve ? 'approved' : 'rejected', reviewedAt: sql`now()` })
      .where(eq(kycDocuments.userId, driver.userId))

    return driver
  })

export const listAllOrders = createServerFn({ method: 'GET' })
  .middleware([requireAdminMiddleware])
  .inputValidator(z.object({ page: z.number().int().min(1).default(1) }).optional())
  .handler(async ({ data }) => {
    const page = data?.page ?? 1
    return db
      .select()
      .from(orders)
      .orderBy(desc(orders.createdAt))
      .limit(LIST_PAGE_SIZE)
      .offset((page - 1) * LIST_PAGE_SIZE)
  })

export const assignDriverToOrder = createServerFn({ method: 'POST' })
  .middleware([requireAdminMiddleware])
  .inputValidator(z.object({ orderId: z.number().int(), driverId: z.number().int() }))
  .handler(async ({ data }) => {
    const [updated] = await db
      .update(orders)
      .set({ assignedDriverId: data.driverId, status: 'shipped' })
      .where(eq(orders.id, data.orderId))
      .returning()
    return updated
  })

export const updateOrderStatus = createServerFn({ method: 'POST' })
  .middleware([requireAdminMiddleware])
  .inputValidator(
    z.object({
      orderId: z.number().int(),
      status: z.enum(['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']),
    }),
  )
  .handler(async ({ data }) => {
    const [updated] = await db
      .update(orders)
      .set({ status: data.status })
      .where(eq(orders.id, data.orderId))
      .returning()
    return updated
  })

export const createCoupon = createServerFn({ method: 'POST' })
  .middleware([requireAdminMiddleware])
  .inputValidator(
    z.object({
      code: z.string().min(3),
      discountType: z.enum(['percent', 'fixed']),
      discountValue: z.number().positive(),
      minOrderAmount: z.number().min(0).default(0),
      usageLimit: z.number().int().min(0).default(0),
    }),
  )
  .handler(async ({ data }) => {
    const [coupon] = await db
      .insert(coupons)
      .values({
        code: data.code.toUpperCase(),
        discountType: data.discountType,
        discountValue: String(data.discountValue),
        minOrderAmount: String(data.minOrderAmount),
        usageLimit: data.usageLimit,
      })
      .returning()
    return coupon
  })

export const listCoupons = createServerFn({ method: 'GET' })
  .middleware([requireAdminMiddleware])
  .inputValidator(z.object({ page: z.number().int().min(1).default(1) }).optional())
  .handler(async ({ data }) => {
    const page = data?.page ?? 1
    return db
      .select()
      .from(coupons)
      .orderBy(desc(coupons.createdAt))
      .limit(LIST_PAGE_SIZE)
      .offset((page - 1) * LIST_PAGE_SIZE)
  })

export const createInvestmentProject = createServerFn({ method: 'POST' })
  .middleware([requireAdminMiddleware])
  .inputValidator(
    z.object({
      title: z.string().min(1),
      category: z.enum(['agriculture', 'elevage', 'immobilier', 'commerce', 'autres']),
      description: z.string().default(''),
      imageUrl: z.string().default(''),
      targetAmount: z.number().positive(),
      expectedRoiPercent: z.number().positive(),
      durationMonths: z.number().int().positive(),
    }),
  )
  .handler(async ({ data }) => {
    const [project] = await db
      .insert(investmentProjects)
      .values({
        title: data.title,
        category: data.category,
        description: data.description,
        imageUrl: data.imageUrl,
        targetAmount: String(data.targetAmount),
        expectedRoiPercent: String(data.expectedRoiPercent),
        durationMonths: data.durationMonths,
      })
      .returning()
    return project
  })

export const listAllTickets = createServerFn({ method: 'GET' })
  .middleware([requireAdminMiddleware])
  .inputValidator(z.object({ page: z.number().int().min(1).default(1) }).optional())
  .handler(async ({ data }) => {
    const page = data?.page ?? 1
    return db
      .select()
      .from(supportTickets)
      .orderBy(desc(supportTickets.createdAt))
      .limit(LIST_PAGE_SIZE)
      .offset((page - 1) * LIST_PAGE_SIZE)
  })

export const updateTicketStatus = createServerFn({ method: 'POST' })
  .middleware([requireAdminMiddleware])
  .inputValidator(z.object({ id: z.number().int(), status: z.enum(['open', 'in_progress', 'resolved']) }))
  .handler(async ({ data }) => {
    const [updated] = await db
      .update(supportTickets)
      .set({ status: data.status })
      .where(eq(supportTickets.id, data.id))
      .returning()
    return updated
  })
