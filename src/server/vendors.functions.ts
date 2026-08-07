import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db } from '../../db'
import { vendors, kycDocuments, products } from '../../db/schema'
import { requireAuthMiddleware } from '../middleware/identity'
import { ensureUserProfile } from './users.server'
import { slugify } from '../lib/format'
import { saveUpload } from './uploads.server'
import {
  getVendorByUserId,
  requireApprovedVendor,
  listVendorProducts,
  listVendorOrders,
  vendorStats,
} from './vendors.server'

export const getMyVendor = createServerFn({ method: 'GET' })
  .middleware([requireAuthMiddleware])
  .handler(async ({ context }) => getVendorByUserId(context.user.id))

export const applyAsVendor = createServerFn({ method: 'POST' })
  .middleware([requireAuthMiddleware])
  .inputValidator((formData: FormData) => formData)
  .handler(async ({ context, data: formData }) => {
    await ensureUserProfile(context.user)

    const existing = await getVendorByUserId(context.user.id)
    if (existing) throw new Error('Une demande de vendeur existe déjà pour ce compte')

    const shopName = String(formData.get('shopName') || '').trim()
    const description = String(formData.get('description') || '').trim()
    const city = String(formData.get('city') || '').trim()
    const idType = String(formData.get('idType') || 'national_id')
    const idNumber = String(formData.get('idNumber') || '').trim()
    const idDocument = formData.get('idDocument') as File | null
    const selfie = formData.get('selfie') as File | null

    if (!shopName || !idNumber || !idDocument || idDocument.size === 0) {
      throw new Error('Champs requis manquants (boutique, numéro de pièce, document)')
    }

    const slugBase = slugify(shopName)
    let slug = slugBase
    let n = 1
    while ((await db.select().from(vendors).where(eq(vendors.slug, slug))).length > 0) {
      slug = `${slugBase}-${n++}`
    }

    const [vendor] = await db
      .insert(vendors)
      .values({ userId: context.user.id, shopName, slug, description, city, status: 'pending' })
      .returning()

    const documentUrl = await saveUpload(`kyc/${context.user.id}`, idDocument)
    const selfieUrl = selfie && selfie.size > 0 ? await saveUpload(`kyc/${context.user.id}`, selfie) : ''

    await db.insert(kycDocuments).values({
      userId: context.user.id,
      vendorId: vendor.id,
      applicantType: 'vendor',
      idType,
      idNumber,
      documentUrl,
      selfieUrl,
      status: 'pending',
    })

    return vendor
  })

export const getVendorDashboard = createServerFn({ method: 'GET' })
  .middleware([requireAuthMiddleware])
  .handler(async ({ context }) => {
    const vendor = await getVendorByUserId(context.user.id)
    if (!vendor) return { vendor: null, products: [], orders: [], stats: null }
    if (vendor.status !== 'approved') {
      return { vendor, products: [], orders: [], stats: null }
    }
    const [productList, orderList, stats] = await Promise.all([
      listVendorProducts(vendor.id),
      listVendorOrders(vendor.id),
      vendorStats(vendor.id),
    ])
    return { vendor, products: productList, orders: orderList, stats }
  })

const ProductInput = z.object({
  name: z.string().min(1),
  description: z.string().max(5000).default(''),
  categoryId: z.number().int().optional(),
  sku: z.string().min(1),
  stock: z.number().int().min(0),
  retailPrice: z.number().positive(),
  wholesalePrice: z.number().positive().optional(),
  minWholesaleQty: z.number().int().min(0).default(0),
  images: z.array(z.string()).default([]),
  fulfillment: z.enum(['lgf', 'vendor', 'vendor_lgf_delivery']).default('vendor'),
})

export const createVendorProduct = createServerFn({ method: 'POST' })
  .middleware([requireAuthMiddleware])
  .inputValidator(ProductInput)
  .handler(async ({ context, data }) => {
    const vendor = await requireApprovedVendor(context.user.id)

    const slugBase = slugify(data.name)
    let slug = slugBase
    let n = 1
    while ((await db.select().from(products).where(eq(products.slug, slug))).length > 0) {
      slug = `${slugBase}-${n++}`
    }

    const [product] = await db
      .insert(products)
      .values({
        vendorId: vendor.id,
        categoryId: data.categoryId,
        name: data.name,
        slug,
        description: data.description,
        images: data.images,
        sku: data.sku,
        stock: data.stock,
        retailPrice: String(data.retailPrice),
        wholesalePrice: data.wholesalePrice ? String(data.wholesalePrice) : null,
        minWholesaleQty: data.minWholesaleQty,
        fulfillment: data.fulfillment,
        status: 'active',
      })
      .returning()

    return product
  })

export const updateVendorProduct = createServerFn({ method: 'POST' })
  .middleware([requireAuthMiddleware])
  .inputValidator(ProductInput.extend({ id: z.number().int(), status: z.enum(['draft', 'active', 'archived']) }))
  .handler(async ({ context, data }) => {
    const vendor = await requireApprovedVendor(context.user.id)
    const [existing] = await db.select().from(products).where(eq(products.id, data.id))
    if (!existing || existing.vendorId !== vendor.id) throw new Error('Produit introuvable')

    const [updated] = await db
      .update(products)
      .set({
        name: data.name,
        description: data.description,
        categoryId: data.categoryId,
        sku: data.sku,
        stock: data.stock,
        retailPrice: String(data.retailPrice),
        wholesalePrice: data.wholesalePrice ? String(data.wholesalePrice) : null,
        minWholesaleQty: data.minWholesaleQty,
        images: data.images,
        fulfillment: data.fulfillment,
        status: data.status,
      })
      .where(eq(products.id, data.id))
      .returning()

    return updated
  })

export const uploadProductImage = createServerFn({ method: 'POST' })
  .middleware([requireAuthMiddleware])
  .inputValidator((formData: FormData) => formData)
  .handler(async ({ context, data: formData }) => {
    await requireApprovedVendor(context.user.id)
    const file = formData.get('image') as File | null
    if (!file || file.size === 0) throw new Error('Aucune image fournie')
    const url = await saveUpload(`products/${context.user.id}`, file)
    return { url }
  })
