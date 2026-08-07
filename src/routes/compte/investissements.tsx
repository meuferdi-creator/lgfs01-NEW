import { createFileRoute } from '@tanstack/react-router'
import { getMyInvestments } from '@/server/investments.functions'
import { formatMoney } from '@/lib/format'

export const Route = createFileRoute('/compte/investissements')({
  loader: async () => getMyInvestments(),
  component: MyInvestmentsPage,
})

function MyInvestmentsPage() {
  const investments = Route.useLoaderData()

  if (investments.length === 0) {
    return <p className="text-sm text-neutral-500">Vous n'avez pas encore investi dans un projet.</p>
  }

  return (
    <div className="space-y-2">
      {investments.map((inv) => (
        <div key={inv.id} className="flex items-center justify-between rounded-xl border border-neutral-200 p-4">
          <div>
            <p className="font-medium">{inv.projectTitle}</p>
            <p className="text-sm text-neutral-500">
              ROI attendu {inv.expectedRoiPercent}% · {new Date(inv.createdAt).toLocaleDateString('fr-FR')}
            </p>
          </div>
          <div className="text-right">
            <p className="font-semibold">{formatMoney(inv.amount)}</p>
            <p className="text-sm text-neutral-500 capitalize">{inv.projectStatus}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
