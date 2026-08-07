import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db } from '../../db'
import { investmentProjects, investments, users } from '../../db/schema'
import { requireAuthMiddleware } from '../middleware/identity'
import { ensureUserProfile } from './users.server'

export const listInvestmentProjects = createServerFn({ method: 'GET' }).handler(async () => {
  return db.select().from(investmentProjects).orderBy(investmentProjects.createdAt)
})

export const getInvestmentProject = createServerFn({ method: 'GET' })
  .inputValidator((id: number) => id)
  .handler(async ({ data: id }) => {
    const rows = await db.select().from(investmentProjects).where(eq(investmentProjects.id, id))
    return rows[0] ?? null
  })

export const investInProject = createServerFn({ method: 'POST' })
  .middleware([requireAuthMiddleware])
  .inputValidator(z.object({ projectId: z.number().int(), amount: z.number().positive() }))
  .handler(async ({ context, data }) => {
    await ensureUserProfile(context.user)
    const [profile] = await db.select().from(users).where(eq(users.id, context.user.id))
    const balance = Number(profile?.walletBalance ?? 0)
    if (balance < data.amount) throw new Error('Solde du portefeuille insuffisant pour cet investissement')

    const [project] = await db
      .select()
      .from(investmentProjects)
      .where(eq(investmentProjects.id, data.projectId))
    if (!project) throw new Error('Projet introuvable')
    if (project.status !== 'open') throw new Error("Ce projet n'accepte plus d'investissements")

    await db
      .update(users)
      .set({ walletBalance: String(balance - data.amount) })
      .where(eq(users.id, context.user.id))

    const [investment] = await db
      .insert(investments)
      .values({ projectId: data.projectId, userId: context.user.id, amount: String(data.amount) })
      .returning()

    const newCollected = Number(project.collectedAmount) + data.amount
    await db
      .update(investmentProjects)
      .set({
        collectedAmount: String(newCollected),
        status: newCollected >= Number(project.targetAmount) ? 'funded' : 'open',
      })
      .where(eq(investmentProjects.id, project.id))

    return investment
  })

export const getMyInvestments = createServerFn({ method: 'GET' })
  .middleware([requireAuthMiddleware])
  .handler(async ({ context }) => {
    const rows = await db
      .select({
        id: investments.id,
        amount: investments.amount,
        createdAt: investments.createdAt,
        projectTitle: investmentProjects.title,
        projectStatus: investmentProjects.status,
        expectedRoiPercent: investmentProjects.expectedRoiPercent,
      })
      .from(investments)
      .innerJoin(investmentProjects, eq(investments.projectId, investmentProjects.id))
      .where(eq(investments.userId, context.user.id))
    return rows
  })
