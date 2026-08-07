import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db } from '../../db'
import { orders, users, walletTransactions } from '../../db/schema'
import { requireAuthMiddleware } from '../middleware/identity'
import { ensureUserProfile } from './users.server'
import {
  createPendingOrder,
  markOrderPaid,
  listMyOrders,
  getOrderForUser,
} from './orders.server'

export const getStripeEnabled = createServerFn({ method: 'GET' }).handler(
  () => !!process.env.STRIPE_SECRET_KEY,
)

const AddressSchema = z.object({
  fullName: z.string().min(1),
  phone: z.string().min(6),
  city: z.string().min(1),
  country: z.string().min(1),
  addressLine: z.string().min(1),
})

export const createOrder = createServerFn({ method: 'POST' })
  .middleware([requireAuthMiddleware])
  .inputValidator(AddressSchema)
  .handler(async ({ context, data }) => {
    await ensureUserProfile(context.user)
    const order = await createPendingOrder(context.user.id, data)
    return order
  })

export const payOrderWithStripe = createServerFn({ method: 'POST' })
  .middleware([requireAuthMiddleware])
  .inputValidator(z.object({ orderId: z.number().int() }))
  .handler(async ({ context, data }) => {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('Stripe is not configured')
    }
    const order = await getOrderForUser(data.orderId, context.user.id)
    if (!order) throw new Error('Order not found')
    if (order.paymentStatus === 'paid') throw new Error('Order already paid')

    const { default: Stripe } = await import('stripe')
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: `Commande LGF's Mall #${order.id}` },
            unit_amount: Math.round(Number(order.total)),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      metadata: { orderId: String(order.id) },
      success_url: `${process.env.SITE_URL ?? 'http://localhost:3000'}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.SITE_URL ?? 'http://localhost:3000'}/checkout/cancel`,
    })

    return session.url
  })

export const confirmStripeOrder = createServerFn({ method: 'POST' })
  .middleware([requireAuthMiddleware])
  .inputValidator(z.object({ sessionId: z.string() }))
  .handler(async ({ context, data }) => {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('Stripe is not configured')
    }
    const { default: Stripe } = await import('stripe')
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    const session = await stripe.checkout.sessions.retrieve(data.sessionId)

    if (session.payment_status !== 'paid') {
      throw new Error('Payment not completed')
    }
    const orderId = Number(session.metadata?.orderId)
    const order = await getOrderForUser(orderId, context.user.id)
    if (!order) throw new Error('Order not found')

    const updated = await markOrderPaid(orderId, 'stripe')
    return updated
  })

export const payOrderWithWallet = createServerFn({ method: 'POST' })
  .middleware([requireAuthMiddleware])
  .inputValidator(z.object({ orderId: z.number().int() }))
  .handler(async ({ context, data }) => {
    const order = await getOrderForUser(data.orderId, context.user.id)
    if (!order) throw new Error('Order not found')
    if (order.paymentStatus === 'paid') throw new Error('Order already paid')

    const [profile] = await db.select().from(users).where(eq(users.id, context.user.id))
    const balance = Number(profile?.walletBalance ?? 0)
    if (balance < Number(order.total)) {
      throw new Error('Solde du portefeuille insuffisant')
    }

    await db
      .update(users)
      .set({ walletBalance: String(balance - Number(order.total)) })
      .where(eq(users.id, context.user.id))
    await db.insert(walletTransactions).values({
      userId: context.user.id,
      type: 'debit',
      amount: order.total,
      reason: `Paiement commande #${order.id} par portefeuille`,
      referenceOrderId: order.id,
    })

    return markOrderPaid(order.id, 'wallet')
  })

export const getMyOrders = createServerFn({ method: 'GET' })
  .middleware([requireAuthMiddleware])
  .handler(async ({ context }) => listMyOrders(context.user.id))

export const getMyOrder = createServerFn({ method: 'GET' })
  .middleware([requireAuthMiddleware])
  .inputValidator(z.object({ orderId: z.number().int() }))
  .handler(async ({ context, data }) => getOrderForUser(data.orderId, context.user.id))

export const topUpWalletWithStripe = createServerFn({ method: 'POST' })
  .middleware([requireAuthMiddleware])
  .inputValidator(z.object({ amount: z.number().int().min(500) }))
  .handler(async ({ context, data }) => {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('Stripe is not configured')
    }
    const { default: Stripe } = await import('stripe')
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: 'Rechargement portefeuille LGF' },
            unit_amount: data.amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      metadata: { walletTopup: 'true', userId: context.user.id, amount: String(data.amount) },
      success_url: `${process.env.SITE_URL ?? 'http://localhost:3000'}/account/wallet?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.SITE_URL ?? 'http://localhost:3000'}/account/wallet`,
    })
    return session.url
  })

export const confirmWalletTopup = createServerFn({ method: 'POST' })
  .middleware([requireAuthMiddleware])
  .inputValidator(z.object({ sessionId: z.string() }))
  .handler(async ({ context, data }) => {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('Stripe is not configured')
    }
    const { default: Stripe } = await import('stripe')
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    const session = await stripe.checkout.sessions.retrieve(data.sessionId)

    if (session.payment_status !== 'paid') throw new Error('Payment not completed')
    if (session.metadata?.userId !== context.user.id) throw new Error('Session mismatch')

    const amount = Number(session.metadata?.amount ?? 0)
    const [profile] = await db.select().from(users).where(eq(users.id, context.user.id))
    const existingTx = await db
      .select()
      .from(walletTransactions)
      .where(eq(walletTransactions.reason, `Rechargement Stripe ${data.sessionId}`))
    if (existingTx.length > 0) return { balance: profile?.walletBalance ?? '0' }

    const newBalance = Number(profile?.walletBalance ?? 0) + amount
    await db
      .update(users)
      .set({ walletBalance: String(newBalance) })
      .where(eq(users.id, context.user.id))
    await db.insert(walletTransactions).values({
      userId: context.user.id,
      type: 'credit',
      amount: String(amount),
      reason: `Rechargement Stripe ${data.sessionId}`,
    })

    return { balance: String(newBalance) }
  })

export const getMyWalletTransactions = createServerFn({ method: 'GET' })
  .middleware([requireAuthMiddleware])
  .handler(async ({ context }) => {
    return db
      .select()
      .from(walletTransactions)
      .where(eq(walletTransactions.userId, context.user.id))
      .orderBy(walletTransactions.createdAt)
  })
