import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { login, signup, requestPasswordRecovery } from '@netlify/identity'
import { useIdentity } from '@/lib/identity-context'

export const Route = createFileRoute('/connexion')({
  component: LoginPage,
})

function LoginPage() {
  const { user, ready } = useIdentity()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)

  if (ready && user) {
    navigate({ to: '/compte' })
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setInfo('')
    setBusy(true)
    try {
      if (mode === 'login') {
        await login(email, password)
        navigate({ to: '/compte' })
      } else {
        await signup(email, password, { full_name: fullName })
        setInfo(`Un email de confirmation a été envoyé à ${email}. Cliquez sur le lien pour activer votre compte.`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-[75vh] max-w-md flex-col justify-center px-4 py-10">
      <h1 className="text-2xl font-extrabold">
        {mode === 'login' ? 'Connexion' : 'Créer un compte client'}
      </h1>
      <p className="mt-1 text-sm text-neutral-500">
        Tous les nouveaux comptes sont créés en tant que <strong>Client</strong>. Vous pourrez
        demander à devenir vendeur ou livreur depuis votre espace, sous réserve de validation.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-3">
        {mode === 'signup' && (
          <input
            required
            placeholder="Nom complet"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2"
          />
        )}
        <input
          required
          type="email"
          placeholder="Adresse email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-neutral-300 px-3 py-2"
        />
        <input
          required
          type="password"
          minLength={8}
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-neutral-300 px-3 py-2"
        />

        {error && <p className="text-sm text-red-600">{error}</p>}
        {info && <p className="text-sm text-emerald-700">{info}</p>}

        <button
          disabled={busy}
          className="w-full rounded-full bg-emerald-600 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {busy ? 'Veuillez patienter...' : mode === 'login' ? 'Se connecter' : "S'inscrire"}
        </button>
      </form>

      <div className="mt-4 flex justify-between text-sm">
        <button
          onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
          className="text-emerald-700 underline"
        >
          {mode === 'login' ? 'Créer un compte' : 'J’ai déjà un compte'}
        </button>
        {mode === 'login' && (
          <button
            onClick={async () => {
              if (!email) {
                setError('Entrez votre email pour réinitialiser le mot de passe')
                return
              }
              await requestPasswordRecovery(email)
              setInfo(`Email de réinitialisation envoyé à ${email}`)
            }}
            className="text-neutral-500 underline"
          >
            Mot de passe oublié ?
          </button>
        )}
      </div>
    </div>
  )
}
