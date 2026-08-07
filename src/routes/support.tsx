import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useServerFn } from '@tanstack/react-start'
import { createSupportTicket, getMyTickets } from '@/server/support.functions'
import { useIdentity } from '@/lib/identity-context'

export const Route = createFileRoute('/support')({
  component: SupportPage,
})

const FAQ = [
  { q: 'Comment suivre ma commande ?', a: 'Rendez-vous dans "Mon compte > Commandes" pour voir le statut de chaque commande.' },
  { q: 'Quels moyens de paiement sont acceptés ?', a: 'Paiement par carte bancaire (Stripe) et par portefeuille LGF. Le Mobile Money est en cours d\'intégration.' },
  { q: "Comment devenir vendeur ou livreur ?", a: 'Utilisez les liens "Vendre sur LGF" ou "Devenir livreur" dans le menu. Une vérification KYC et une validation admin sont requises.' },
]

function SupportPage() {
  const { user, ready } = useIdentity()
  const createTicketFn = useServerFn(createSupportTicket)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const whatsapp = import.meta.env.VITE_SUPPORT_WHATSAPP || '22890000000'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ready || !user) {
      setError('Connectez-vous pour envoyer une demande de support.')
      return
    }
    try {
      await createTicketFn({ data: { subject, message } })
      setSent(true)
      setSubject('')
      setMessage('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-extrabold">Support client</h1>

      <div className="mt-4 flex flex-wrap gap-3">
        <a
          href={`https://wa.me/${whatsapp}`}
          target="_blank"
          rel="noreferrer"
          className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          Discuter sur WhatsApp
        </a>
        <a href={`tel:+${whatsapp}`} className="rounded-full border border-neutral-300 px-5 py-2 text-sm font-semibold hover:bg-neutral-50">
          Appeler le support
        </a>
      </div>

      <div className="mt-8 rounded-2xl border border-neutral-200 p-6">
        <h2 className="font-semibold">Ouvrir un ticket</h2>
        <form onSubmit={handleSubmit} className="mt-3 space-y-3">
          <input value={subject} onChange={(e) => setSubject(e.target.value)} required placeholder="Sujet" className="w-full rounded-lg border border-neutral-300 px-3 py-2" />
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} required placeholder="Votre message" className="w-full rounded-lg border border-neutral-300 px-3 py-2" />
          {error && <p className="text-sm text-red-600">{error}</p>}
          {sent && <p className="text-sm text-emerald-700">Ticket envoyé ✓ Nous vous répondrons rapidement.</p>}
          <button className="rounded-full bg-neutral-900 px-5 py-2 text-sm font-semibold text-white hover:bg-neutral-800">
            Envoyer
          </button>
        </form>
      </div>

      <div className="mt-8">
        <h2 className="font-semibold">Questions fréquentes</h2>
        <div className="mt-3 space-y-3">
          {FAQ.map((item) => (
            <div key={item.q} className="rounded-xl border border-neutral-200 p-4">
              <p className="font-medium">{item.q}</p>
              <p className="mt-1 text-sm text-neutral-600">{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
