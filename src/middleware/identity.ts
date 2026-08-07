import { createMiddleware } from '@tanstack/react-start'
import { getUser } from '@netlify/identity'

/** Injects the Netlify Identity user (or null) into context. Never throws. */
export const identityMiddleware = createMiddleware().server(async ({ next }) => {
  const user = (await getUser()) ?? null
  return next({ context: { user } })
})

/** Requires a logged-in Netlify Identity user. */
export const requireAuthMiddleware = createMiddleware().server(async ({ next }) => {
  const user = await getUser()
  if (!user) throw new Error('Authentication required')
  return next({ context: { user } })
})

/** Requires the `admin` (or `super_admin`) Identity role. */
export const requireAdminMiddleware = createMiddleware().server(async ({ next }) => {
  const user = await getUser()
  if (!user) throw new Error('Authentication required')
  if (!user.roles?.includes('admin') && !user.roles?.includes('super_admin')) {
    throw new Error('Admin role required')
  }
  return next({ context: { user } })
})
