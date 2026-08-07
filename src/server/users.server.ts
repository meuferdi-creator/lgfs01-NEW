import { db } from '../../db'
import { users } from '../../db/schema'
import { eq } from 'drizzle-orm'
import type { User } from '@netlify/identity'

/** Creates (or updates the email/name on) the local profile row for an Identity user. */
export async function ensureUserProfile(user: User) {
  const existing = await db.select().from(users).where(eq(users.id, user.id))
  if (existing.length > 0) return existing[0]
  const fullName = (user.metadata?.full_name as string) || user.name || ''
  const phone = (user.metadata?.phone as string) || ''
  const [row] = await db
    .insert(users)
    .values({ id: user.id, email: user.email, fullName, phone })
    .returning()
  return row
}

export async function getUserProfile(userId: string) {
  const rows = await db.select().from(users).where(eq(users.id, userId))
  return rows[0] ?? null
}
