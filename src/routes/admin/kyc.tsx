import { createFileRoute } from '@tanstack/react-router'
import { listAllKyc } from '@/server/admin.functions'

export const Route = createFileRoute('/admin/kyc')({
  loader: async () => listAllKyc(),
  component: AdminKycPage,
})

function AdminKycPage() {
  const docs = Route.useLoaderData()

  return (
    <div className="space-y-3">
      {docs.map((d) => (
        <div key={d.id} className="rounded-xl border border-neutral-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium capitalize">{d.applicantType} · {d.idType}</p>
              <p className="text-sm text-neutral-500">N° pièce : {d.idNumber} · Statut : {d.status}</p>
            </div>
            <div className="flex gap-2">
              <a href={d.documentUrl} target="_blank" rel="noreferrer" className="text-sm font-medium text-emerald-700 underline">Document</a>
              {d.selfieUrl && (
                <a href={d.selfieUrl} target="_blank" rel="noreferrer" className="text-sm font-medium text-emerald-700 underline">Selfie</a>
              )}
            </div>
          </div>
        </div>
      ))}
      {docs.length === 0 && <p className="text-sm text-neutral-500">Aucun document KYC.</p>}
      <p className="text-xs text-neutral-400">
        L'approbation/rejet se fait depuis les onglets "Vendeurs" et "Livreurs" (elle met aussi à jour le statut KYC associé).
      </p>
    </div>
  )
}
