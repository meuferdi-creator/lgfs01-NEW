import { getStore } from '@netlify/blobs'

/** Site-wide store for KYC documents and vendor/product images. */
export function getUploadsStore() {
  return getStore('lgf-mall-uploads')
}

export async function saveUpload(prefix: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop() || 'bin'
  const key = `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const store = getUploadsStore()
  await store.set(key, await file.arrayBuffer(), {
    metadata: { contentType: file.type || 'application/octet-stream' },
  })
  return `/api/uploads/${key}`
}
