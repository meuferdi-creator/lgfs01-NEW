import { createFileRoute } from '@tanstack/react-router'
import { getUploadsStore } from '@/server/uploads.server'

export const Route = createFileRoute('/api/uploads/$')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const key = params._splat
        if (!key) return new Response('Not found', { status: 404 })
        const store = getUploadsStore()
        const result = await store.getWithMetadata(key, { type: 'arrayBuffer' })
        if (!result) return new Response('Not found', { status: 404 })
        return new Response(result.data as ArrayBuffer, {
          headers: {
            'Content-Type': result.metadata.contentType || 'application/octet-stream',
            'Cache-Control': 'public, max-age=31536000, immutable',
          },
        })
      },
    },
  },
})
