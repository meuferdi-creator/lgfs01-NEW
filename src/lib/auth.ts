import { createServerFn } from '@tanstack/react-start'
import { getUser, type User } from '@netlify/identity'

export type { User as IdentityUser }

export const getServerUser = createServerFn({ method: 'GET' }).handler(
  async () => {
    const user = await getUser()
    return (user ?? null) as User | null
  },
)

export function isAdmin(user: User | null | undefined) {
  return !!user?.roles?.includes('admin') || !!user?.roles?.includes('super_admin')
}
