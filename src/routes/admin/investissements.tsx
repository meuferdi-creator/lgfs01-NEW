import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useServerFn } from '@tanstack/react-start'
import { listInvestmentProjects } from '@/server/investments.functions'
import { createInvestmentProject } from '@/server/admin.functions'
import { formatMoney } from '@/lib/format'

export const Route = createFileRoute('/admin/investissements')({
  loader: async () => listInvestmentProjects(),
  component: AdminInvestmentsPage,
})

const CATEGORIES = ['agriculture', 'elevage', 'immobilier', 'commerce', 'autres'] as const

function AdminInvestmentsPage() {
  const initial = Route.useLoaderData()
  const [projects, setProjects] = useState(initial)
  const createFn = useServerFn(createInvestmentProject)
  const [form, setForm] = useState({
    title: '',
    category: 'agriculture' as (typeof CATEGORIES)[number],
    description: '',
    imageUrl: '',
    targetAmount: '',
    expectedRoiPercent: '',
    durationMonths: '',
  })
  const [error, setError] = useState('')

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const created = await createFn({
        data: {
          title: form.title,
          category: form.category,
          description: form.description,
          imageUrl: form.imageUrl,
          targetAmount: Number(form.targetAmount),
          expectedRoiPercent: Number(form.expectedRoiPercent),
          durationMonths: Number(form.durationMonths),
        },
      })
      setProjects([created, ...projects])
      setForm({ title: '', category: 'agriculture', description: '', imageUrl: '', targetAmount: '', expectedRoiPercent: '', durationMonths: '' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleCreate} className="grid gap-3 rounded-2xl border border-neutral-200 p-6 sm:grid-cols-2">
        <input required placeholder="Titre du projet" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="rounded-lg border border-neutral-300 px-3 py-2 sm:col-span-2" />
        <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as (typeof CATEGORIES)[number] })} className="rounded-lg border border-neutral-300 px-3 py-2">
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <input placeholder="URL de l'image" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} className="rounded-lg border border-neutral-300 px-3 py-2" />
        <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="rounded-lg border border-neutral-300 px-3 py-2 sm:col-span-2" />
        <input type="number" required placeholder="Objectif de financement (FCFA)" value={form.targetAmount} onChange={(e) => setForm({ ...form, targetAmount: e.target.value })} className="rounded-lg border border-neutral-300 px-3 py-2" />
        <input type="number" required placeholder="ROI attendu (%)" value={form.expectedRoiPercent} onChange={(e) => setForm({ ...form, expectedRoiPercent: e.target.value })} className="rounded-lg border border-neutral-300 px-3 py-2" />
        <input type="number" required placeholder="Durée (mois)" value={form.durationMonths} onChange={(e) => setForm({ ...form, durationMonths: e.target.value })} className="rounded-lg border border-neutral-300 px-3 py-2" />
        {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
        <button className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 sm:col-span-2">
          Créer le projet
        </button>
      </form>

      <div className="space-y-2">
        {projects.map((p) => (
          <div key={p.id} className="flex items-center justify-between rounded-xl border border-neutral-200 p-4">
            <div>
              <p className="font-medium">{p.title}</p>
              <p className="text-sm text-neutral-500">{p.category} · statut {p.status}</p>
            </div>
            <p className="text-sm text-neutral-500">{formatMoney(p.collectedAmount)} / {formatMoney(p.targetAmount)}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
