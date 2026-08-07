import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { db } from '../../db'
import { productReviews } from '../../db/schema'
import { requireAuthMiddleware } from '../middleware/identity'
import { ensureUserProfile } from './users.server'

export const addReview = createServerFn({ method: 'POST' })
  .middleware([requireAuthMiddleware])
  .inputValidator(
    z.object({
      productId: z.number().int(),
      rating: z.number().int().min(1).max(5),
      comment: z.string().max(2000),
    }),
  )
  .handler(async ({ context, data }) => {
    await ensureUserProfile(context.user)
    const [row] = await db
      .insert(productReviews)
      .values({
        productId: data.productId,
        userId: context.user.id,
        rating: data.rating,
        comment: data.comment,
      })
      .returning()
    return row
  })
