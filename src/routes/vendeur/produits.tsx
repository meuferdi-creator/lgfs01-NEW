import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useServerFn } from '@tanstack/react-start'
import { getVendorDashboard, createVendorProduct, updateVendorProduct, uploadProductImage } from '@/server/vendors.functions'
import { getCategories } from '@/server/catalog.functions'
import { formatMoney } from '@/lib/format'

export const Route = createFileRoute('/vendeur/produits')({
  loader: async () => {
    const [dashboard, categories] = await Promise.all([getVendorDashboard(), getCategories()])
    return { dashboard, categories }
  },
  component: VendorProductsPage,
})

type ProductForm = {
  id?: number
  name: string
  description: string
  categoryId: string
  sku: string
  stock: string
  retailPrice: string
  wholesalePrice: string
  minWholesaleQty: string
  fulfillment: 'lgf' | 'vendor' | 'vendor_lgf_delivery'
  status: 'draft' | 'active' | 'archived'
  images: string[]
}

const EMPTY_FORM: ProductForm = {
  name: '',
  description: '',
  categoryId: '',
  sku: '',
  stock: '0',
  retailPrice: '',
  wholesalePrice: '',
  minWholesaleQty: '0',
  fulfillment: 'vendor',
  status: 'active',
  images: [],
}

function VendorProductsPage() {
  const { dashboard, categories } = Route.useLoaderData()
  const createFn = useServerFn(createVendorProduct)
  const updateFn = useServerFn(updateVendorProduct)
  const uploadFn = useServerFn(uploadProductImage)

  const [products, setProducts] = useState(dashboard.products)
  const [form, setForm] = useState<ProductForm | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  if (!dashboard.vendor || dashboard.vendor.status !== 'approved') {
    return <p className="text-sm text-neutral-500">Votre boutique doit être approuvée pour gérer des produits.</p>
  }

  const openCreate = () => setForm(EMPTY_FORM)
  const openEdit = (p: (typeof products)[number]) =>
    setForm({
      id: p.id,
      name: p.name,
      description: p.description ?? '',
      categoryId: p.categoryId ? String(p.categoryId) : '',
      sku: p.sku,
      stock: String(p.stock),
      retailPrice: String(p.retailPrice),
      wholesalePrice: p.wholesalePrice ? String(p.wholesalePrice) : '',
      minWholesaleQty: String(p.minWholesaleQty),
      fulfillment: p.fulfillment as ProductForm['fulfillment'],
      status: p.status as ProductForm['status'],
      images: (p.images as string[]) ?? [],
    })

  const handleImageUpload = async (file: File) => {
    if (!form) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.set('image', file)
      const { url } = await uploadFn({ data: fd })
      setForm({ ...form, images: [...form.images, url] })
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    if (!form) return
    setError('')
    try {
      const payload = {
        name: form.name,
        description: form.description,
        categoryId: form.categoryId ? Number(form.categoryId) : undefined,
        sku: form.sku,
        stock: Number(form.stock),
        retailPrice: Number(form.retailPrice),
        wholesalePrice: form.wholesalePrice ? Number(form.wholesalePrice) : undefined,
        minWholesaleQty: Number(form.minWholesaleQty),
        images: form.images,
        fulfillment: form.fulfillment,
      }
      if (form.id) {
        const updated = await updateFn({ data: { ...payload, id: form.id, status: form.status } })
        setProducts(products.map((p) => (p.id === updated.id ? updated : p)))
      } else {
        const created = await createFn({ data: payload })
        setProducts([created, ...products])
      }
      setForm(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <h2 className="font-semibold">Mes produits ({products.length})</h2>
        <button onClick={openCreate} className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
          + Nouveau produit
        </button>
      </div>

      <div className="space-y-2">
        {products.map((p) => (
          <div key={p.id} className="flex items-center justify-between rounded-xl border border-neutral-200 p-4">
            <div>
              <p className="font-medium">{p.name}</p>
              <p className="text-sm text-neutral-500">
                SKU {p.sku} · Stock {p.stock} · {formatMoney(p.retailPrice)}
                {p.wholesalePrice && ` (gros dès ${p.minWholesaleQty}: ${formatMoney(p.wholesalePrice)})`}
              </p>
            </div>
            <button onClick={() => openEdit(p)} className="text-sm font-medium text-emerald-700 underline">
              Modifier
            </button>
          </div>
        ))}
        {products.length === 0 && <p className="text-sm text-neutral-500">Aucun produit pour l'instant.</p>}
      </div>

      {form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6">
            <h3 className="font-semibold">{form.id ? 'Modifier le produit' : 'Nouveau produit'}</h3>
            <div className="mt-4 space-y-3">
              <input placeholder="Nom" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-neutral-300 px-3 py-2" />
              <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-lg border border-neutral-300 px-3 py-2" />
              <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="w-full rounded-lg border border-neutral-300 px-3 py-2">
                <option value="">Catégorie...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <input placeholder="SKU" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="w-full rounded-lg border border-neutral-300 px-3 py-2" />
              <input type="number" placeholder="Stock" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="w-full rounded-lg border border-neutral-300 px-3 py-2" />
              <input type="number" placeholder="Prix de détail (FCFA)" value={form.retailPrice} onChange={(e) => setForm({ ...form, retailPrice: e.target.value })} className="w-full rounded-lg border border-neutral-300 px-3 py-2" />
              <input type="number" placeholder="Prix de gros (optionnel)" value={form.wholesalePrice} onChange={(e) => setForm({ ...form, wholesalePrice: e.target.value })} className="w-full rounded-lg border border-neutral-300 px-3 py-2" />
              <input type="number" placeholder="Quantité minimum de gros" value={form.minWholesaleQty} onChange={(e) => setForm({ ...form, minWholesaleQty: e.target.value })} className="w-full rounded-lg border border-neutral-300 px-3 py-2" />
              <select value={form.fulfillment} onChange={(e) => setForm({ ...form, fulfillment: e.target.value as ProductForm['fulfillment'] })} className="w-full rounded-lg border border-neutral-300 px-3 py-2">
                <option value="vendor">Expédié par le vendeur</option>
                <option value="vendor_lgf_delivery">Vendu par le vendeur, livré par LGF</option>
                <option value="lgf">Vendu et livré par LGF</option>
              </select>
              {form.id && (
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ProductForm['status'] })} className="w-full rounded-lg border border-neutral-300 px-3 py-2">
                  <option value="active">Actif</option>
                  <option value="draft">Brouillon</option>
                  <option value="archived">Archivé</option>
                </select>
              )}
              <div>
                <label className="text-sm font-medium">Images</label>
                <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])} disabled={uploading} className="mt-1 w-full text-sm" />
                <div className="mt-2 flex gap-2">
                  {form.images.map((url) => (
                    <img key={url} src={url} className="h-14 w-14 rounded object-cover" />
                  ))}
                </div>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-2">
                <button onClick={handleSave} className="flex-1 rounded-full bg-emerald-600 py-2 font-semibold text-white hover:bg-emerald-700">
                  Enregistrer
                </button>
                <button onClick={() => setForm(null)} className="flex-1 rounded-full border border-neutral-300 py-2 font-semibold hover:bg-neutral-50">
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
