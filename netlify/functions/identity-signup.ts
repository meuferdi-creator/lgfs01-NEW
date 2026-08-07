import type { Handler, HandlerEvent } from '@netlify/functions'

/**
 * Fires on every new Netlify Identity signup. Every account starts as a
 * plain customer — vendor/driver/admin access is granted later by an admin
 * after a KYC review, never chosen at signup time.
 */
const handler: Handler = async (event: HandlerEvent) => {
  const user = JSON.parse(event.body || '{}')
  return {
    statusCode: 200,
    body: JSON.stringify({
      app_metadata: {
        roles: ['customer'],
      },
      user_metadata: {
        ...user.user_metadata,
        signed_up_at: new Date().toISOString(),
      },
    }),
  }
}

export { handler }
