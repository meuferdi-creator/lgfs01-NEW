import { db } from '../../db'
import { categories, products, vendors, productReviews } from '../../db/schema'
import { eq, and, ilike, sql, desc } from 'drizzle-orm'

const DEFAULT_CATEGORIES = [
  'Électronique',
  'Mode & Vêtements',
  'Maison & Cuisine',
  'Alimentation & Boissons',
  'Beauté & Santé',
  'Bricolage & Jardin',
  'Téléphonie',
  'Autres',
]

export async function ensureCategoriesSeeded() {
  const existing = await db.select().from(categories)
  if (existing.length > 0) return existing
  const rows = DEFAULT_CATEGORIES.map((name) => ({
    name,
    slug: name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, ''),
  }))
  return db.insert(categories).values(rows).returning()
}

export async function listCategories() {
  return ensureCategoriesSeeded()
}

export async function listProducts(filters: {
  search?: string
  categorySlug?: string
  minPrice?: number
  maxPrice?: number
}) {
  const conditions = [eq(products.status, 'active')]
  if (filters.search) {
    conditions.push(ilike(products.name, `%${filters.search}%`))
  }
  if (filters.minPrice != null) {
    conditions.push(sql`${products.retailPrice} >= ${filters.minPrice}`)
  }
  if (filters.maxPrice != null) {
    conditions.push(sql`${products.retailPrice} <= ${filters.maxPrice}`)
  }

  let categoryId: number | undefined
  if (filters.categorySlug) {
    const cat = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, filters.categorySlug))
    categoryId = cat[0]?.id
    if (categoryId) conditions.push(eq(products.categoryId, categoryId))
  }

  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      images: products.images,
      retailPrice: products.retailPrice,
      wholesalePrice: products.wholesalePrice,
      minWholesaleQty: products.minWholesaleQty,
      stock: products.stock,
      vendorId: products.vendorId,
      vendorName: vendors.shopName,
    })
    .from(products)
    .leftJoin(vendors, eq(products.vendorId, vendors.id))
    .where(and(...conditions))
    .orderBy(desc(products.createdAt))

  return rows
}

export async function getProductBySlug(slug: string) {
  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      description: products.description,
      images: products.images,
      sku: products.sku,
      stock: products.stock,
      retailPrice: products.retailPrice,
      wholesalePrice: products.wholesalePrice,
      minWholesaleQty: products.minWholesaleQty,
      fulfillment: products.fulfillment,
      vendorId: products.vendorId,
      vendorName: vendors.shopName,
      categoryId: products.categoryId,
    })
    .from(products)
    .leftJoin(vendors, eq(products.vendorId, vendors.id))
    .where(eq(products.slug, slug))

  const product = rows[0]
  if (!product) return null

  const reviews = await db
    .select()
    .from(productReviews)
    .where(eq(productReviews.productId, product.id))
    .orderBy(desc(productReviews.createdAt))

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : null

  return { ...product, reviews, avgRating }
}

/** Unit price actually charged for a given quantity, honoring wholesale tiers. */
export function priceForQuantity(product: {
  retailPrice: string
  wholesalePrice: string | null
  minWholesaleQty: number
}, quantity: number) {
  if (
    product.wholesalePrice &&
    product.minWholesaleQty > 0 &&
    quantity >= product.minWholesaleQty
  ) {
    return Number(product.wholesalePrice)
  }
  return Number(product.retailPrice)
}
