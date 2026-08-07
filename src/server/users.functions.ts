import { createServerFn } from '@tanstack/react-start'
import { requireAuthMiddleware } from '../middleware/identity'
import { ensureUserProfile, getUserProfile } from './users.server'
import { db } from '../../db'
import { users } from '../../db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

export const getMyProfile = createServerFn({ method: 'GET' })
  .middleware([requireAuthMiddleware])
  .handler(async ({ context }) => {
    const profile = await ensureUserProfile(context.user)
    return profile
  })

export const updateMyProfile = createServerFn({ method: 'POST' })
  .middleware([requireAuthMiddleware])
  .inputValidator(
    z.object({
      fullName: z.string().min(1).max(120),
      phone: z.string().max(30),
    }),
  )
  .handler(async ({ context, data }) => {
    await ensureUserProfile(context.user)
    const [row] = await db
      .update(users)
      .set({ fullName: data.fullName, phone: data.phone })
      .where(eq(users.id, context.user.id))
      .returning()
    return row
  })

export const getMyWallet = createServerFn({ method: 'GET' })
  .middleware([requireAuthMiddleware])
  .handler(async ({ context }) => {
    const profile = await getUserProfile(context.user.id)
    return { balance: profile?.walletBalance ?? '0' }
  })
