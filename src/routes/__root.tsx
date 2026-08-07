import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { IdentityProvider } from '@/lib/identity-context'
import { CallbackHandler } from '@/components/CallbackHandler'
import { Header } from '@/components/Header'

import '../styles.css'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: "LGF's Mall — Marketplace du Togo" },
      {
        name: 'description',
        content:
          "LGF's Mall, la marketplace multi-vendeurs togolaise : achetez, vendez et livrez en toute confiance.",
      },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <HeadContent />
      </head>
      <body className="bg-neutral-50 text-neutral-900 antialiased">
        <IdentityProvider>
          <CallbackHandler>
            <Header />
            <main className="min-h-screen">{children}</main>
          </CallbackHandler>
        </IdentityProvider>
        <Scripts />
      </body>
    </html>
  )
}
