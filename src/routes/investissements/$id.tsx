import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { useServerFn } from '@tanstack/react-start'
import { getInvestmentProject, investInProject } from '@/server/investments.functions'
import { useIdentity } from '@/lib/identity-context'
import { formatMoney } from '@/lib/format'

export const Route = createFileRoute('/investissements/$id')({
  loader: async ({ params }) => {
    const project = await getInvestmentProject({ data: Number(params.id) })
    if (!project) throw new Error('Projet introuvable')
    return project
  },
  component: InvestmentDetailPage,
})

function InvestmentDetailPage() {
  const project = Route.useLoaderData()
  const { user, ready } = useIdentity()
  const router = useRouter()
  const investFn = useServerFn(investInProject)
  const [amount, setAmount] = useState(10000)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const progress = Math.min(100, (Number(project.collectedAmount) / Number(project.targetAmount)) * 100)

  const handleInvest = async () => {
    if (!ready || !user) {
      router.navigate({ to: '/connexion' })
      return
    }
    setBusy(true)
    setError('')
    try {
      await investFn({ data: { projectId: project.id, amount } })
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      {project.imageUrl && <img src={project.imageUrl} className="h-56 w-full rounded-2xl object-cover" />}
      <p className="mt-4 text-xs font-medium uppercase text-emerald-700">{project.category}</p>
      <h1 className="text-2xl font-extrabold">{project.title}</h1>
      <p className="mt-3 text-sm text-neutral-600">{project.description}</p>

      <div className="mt-6 rounded-2xl border border-neutral-200 p-6">
        <div className="h-2 rounded-full bg-neutral-100">
          <div className="h-2 rounded-full bg-emerald-600" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-2 text-sm text-neutral-500">
          {formatMoney(project.collectedAmount)} collectés sur {formatMoney(project.targetAmount)}
        </p>
        <p className="mt-1 text-sm text-neutral-500">
          ROI attendu : {project.expectedRoiPercent}% sur {project.durationMonths} mois
        </p>

        {project.status === 'open' ? (
          <div className="mt-4 flex items-center gap-3">
            <input
              type="number"
              min={1000}
              step={1000}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-40 rounded-lg border border-neutral-300 px-3 py-2"
            />
            <button
              onClick={handleInvest}
              disabled={busy}
              className="rounded-full bg-emerald-600 px-5 py-2 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {busy ? 'Traitement...' : 'Investir depuis mon portefeuille'}
            </button>
          </div>
        ) : (
          <p className="mt-4 text-sm font-medium text-neutral-500">Ce projet n'accepte plus de nouveaux investissements.</p>
        )}
        {done && <p className="mt-2 text-sm text-emerald-700">Investissement enregistré ✓</p>}
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  )
}
