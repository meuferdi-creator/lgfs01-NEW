import { createFileRoute, Link } from '@tanstack/react-router'
import { listInvestmentProjects } from '@/server/investments.functions'
import { formatMoney } from '@/lib/format'

export const Route = createFileRoute('/investissements/')({
  loader: async () => listInvestmentProjects(),
  component: InvestmentsPage,
})

function InvestmentsPage() {
  const projects = Route.useLoaderData()

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-extrabold">Opportunités d'investissement</h1>
      <p className="mt-2 text-sm text-neutral-600">
        Investissez dans des projets locaux (agriculture, élevage, immobilier, commerce) et suivez leur
        financement en temps réel.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => {
          const progress = Math.min(100, (Number(p.collectedAmount) / Number(p.targetAmount)) * 100)
          return (
            <Link
              key={p.id}
              to="/investissements/$id"
              params={{ id: String(p.id) }}
              className="overflow-hidden rounded-2xl border border-neutral-200 hover:border-emerald-300"
            >
              {p.imageUrl && <img src={p.imageUrl} className="h-36 w-full object-cover" />}
              <div className="p-4">
                <p className="text-xs font-medium uppercase text-emerald-700">{p.category}</p>
                <p className="mt-1 font-semibold">{p.title}</p>
                <div className="mt-2 h-2 rounded-full bg-neutral-100">
                  <div className="h-2 rounded-full bg-emerald-600" style={{ width: `${progress}%` }} />
                </div>
                <p className="mt-2 text-sm text-neutral-500">
                  {formatMoney(p.collectedAmount)} / {formatMoney(p.targetAmount)} · ROI {p.expectedRoiPercent}%
                </p>
                <p className="text-xs text-neutral-400">
                  {p.status === 'open' ? 'Ouvert aux investissements' : p.status === 'funded' ? 'Financé' : p.status}
                </p>
              </div>
            </Link>
          )
        })}
        {projects.length === 0 && <p className="text-sm text-neutral-500">Aucun projet disponible pour le moment.</p>}
      </div>
    </div>
  )
}
