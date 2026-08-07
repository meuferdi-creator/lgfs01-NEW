import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db } from '../../db'
import { supportTickets } from '../../db/schema'
import { requireAuthMiddleware } from '../middleware/identity'
import { ensureUserProfile } from './users.server'

export const createSupportTicket = createServerFn({ method: 'POST' })
  .middleware([requireAuthMiddleware])
  .inputValidator(z.object({ subject: z.string().min(1), message: z.string().min(1) }))
  .handler(async ({ context, data }) => {
    await ensureUserProfile(context.user)
    const [ticket] = await db
      .insert(supportTickets)
      .values({ userId: context.user.id, subject: data.subject, message: data.message })
      .returning()
    return ticket
  })

export const getMyTickets = createServerFn({ method: 'GET' })
  .middleware([requireAuthMiddleware])
  .handler(async ({ context }) =>
    db.select().from(supportTickets).where(eq(supportTickets.userId, context.user.id)),
  )
