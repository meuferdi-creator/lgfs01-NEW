import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db } from '../../db'
import { drivers, kycDocuments, orders, walletTransactions, users } from '../../db/schema'
import { requireAuthMiddleware } from '../middleware/identity'
import { ensureUserProfile } from './users.server'
import { saveUpload } from './uploads.server'

export const getMyDriver = createServerFn({ method: 'GET' })
  .middleware([requireAuthMiddleware])
  .handler(async ({ context }) => {
    const rows = await db.select().from(drivers).where(eq(drivers.userId, context.user.id))
    return rows[0] ?? null
  })

export const applyAsDriver = createServerFn({ method: 'POST' })
  .middleware([requireAuthMiddleware])
  .inputValidator((formData: FormData) => formData)
  .handler(async ({ context, data: formData }) => {
    await ensureUserProfile(context.user)
    const existing = await db.select().from(drivers).where(eq(drivers.userId, context.user.id))
    if (existing.length > 0) throw new Error('Une demande de livreur existe déjà')

    const vehicleType = String(formData.get('vehicleType') || 'motorcycle')
    const zone = String(formData.get('zone') || '').trim()
    const idType = String(formData.get('idType') || 'driver_license')
    const idNumber = String(formData.get('idNumber') || '').trim()
    const idDocument = formData.get('idDocument') as File | null
    const selfie = formData.get('selfie') as File | null

    if (!zone || !idNumber || !idDocument || idDocument.size === 0) {
      throw new Error('Champs requis manquants')
    }

    const [driver] = await db
      .insert(drivers)
      .values({ userId: context.user.id, vehicleType, zone, status: 'pending' })
      .returning()

    const documentUrl = await saveUpload(`kyc/${context.user.id}`, idDocument)
    const selfieUrl = selfie && selfie.size > 0 ? await saveUpload(`kyc/${context.user.id}`, selfie) : ''

    await db.insert(kycDocuments).values({
      userId: context.user.id,
      applicantType: 'driver',
      idType,
      idNumber,
      documentUrl,
      selfieUrl,
      status: 'pending',
    })

    return driver
  })

export const setDriverAvailability = createServerFn({ method: 'POST' })
  .middleware([requireAuthMiddleware])
  .inputValidator(z.object({ isAvailable: z.boolean() }))
  .handler(async ({ context, data }) => {
    const rows = await db.select().from(drivers).where(eq(drivers.userId, context.user.id))
    const driver = rows[0]
    if (!driver || driver.status !== 'approved') throw new Error('Compte livreur non approuvé')
    const [updated] = await db
      .update(drivers)
      .set({ isAvailable: data.isAvailable })
      .where(eq(drivers.id, driver.id))
      .returning()
    return updated
  })

export const getMyDeliveries = createServerFn({ method: 'GET' })
  .middleware([requireAuthMiddleware])
  .handler(async ({ context }) => {
    const rows = await db.select().from(drivers).where(eq(drivers.userId, context.user.id))
    const driver = rows[0]
    if (!driver) return []
    return db.select().from(orders).where(eq(orders.assignedDriverId, driver.id))
  })

export const markDeliveryDone = createServerFn({ method: 'POST' })
  .middleware([requireAuthMiddleware])
  .inputValidator(z.object({ orderId: z.number().int() }))
  .handler(async ({ context, data }) => {
    const rows = await db.select().from(drivers).where(eq(drivers.userId, context.user.id))
    const driver = rows[0]
    if (!driver) throw new Error('Compte livreur introuvable')

    const [order] = await db.select().from(orders).where(eq(orders.id, data.orderId))
    if (!order || order.assignedDriverId !== driver.id) throw new Error('Livraison introuvable')
    if (order.status === 'delivered') return order

    const [updated] = await db
      .update(orders)
      .set({ status: 'delivered' })
      .where(eq(orders.id, order.id))
      .returning()

    const [profile] = await db.select().from(users).where(eq(users.id, context.user.id))
    if (profile) {
      const fee = Number(order.deliveryFee)
      await db
        .update(users)
        .set({ walletBalance: String(Number(profile.walletBalance) + fee) })
        .where(eq(users.id, context.user.id))
      await db.insert(walletTransactions).values({
        userId: context.user.id,
        type: 'credit',
        amount: String(fee),
        reason: `Livraison commande #${order.id}`,
        referenceOrderId: order.id,
      })
    }

    return updated
  })
