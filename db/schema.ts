import {
  pgTable,
  serial,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
  jsonb,
} from 'drizzle-orm/pg-core'

// A profile row is created the first time an authenticated user touches the
// app. `id` is the Netlify Identity user id (a UUID string) - not a serial -
// so it can be used directly as a foreign key from every other table.
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull(),
  fullName: text('full_name').notNull().default(''),
  phone: text('phone').notNull().default(''),
  walletBalance: numeric('wallet_balance', { precision: 12, scale: 2 })
    .notNull()
    .default('0'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const vendors = pgTable('vendors', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  shopName: text('shop_name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description').notNull().default(''),
  city: text('city').notNull().default(''),
  country: text('country').notNull().default('Togo'),
  logoUrl: text('logo_url').notNull().default(''),
  status: text('status').notNull().default('pending'), // pending | approved | rejected | suspended
  commissionRate: numeric('commission_rate', { precision: 5, scale: 2 })
    .notNull()
    .default('10'), // percent
  rejectionReason: text('rejection_reason').notNull().default(''),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  reviewedAt: timestamp('reviewed_at'),
})

export const kycDocuments = pgTable('kyc_documents', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  vendorId: integer('vendor_id').references(() => vendors.id),
  applicantType: text('applicant_type').notNull(), // vendor | driver
  idType: text('id_type').notNull(), // national_id | passport | driver_license
  idNumber: text('id_number').notNull(),
  documentUrl: text('document_url').notNull(),
  selfieUrl: text('selfie_url').notNull().default(''),
  status: text('status').notNull().default('pending'), // pending | approved | rejected
  reviewNote: text('review_note').notNull().default(''),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  reviewedAt: timestamp('reviewed_at'),
})

export const drivers = pgTable('drivers', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id)
    .unique(),
  vehicleType: text('vehicle_type').notNull().default('motorcycle'),
  zone: text('zone').notNull().default(''),
  status: text('status').notNull().default('pending'), // pending | approved | rejected | suspended
  isAvailable: boolean('is_available').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
})

export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  vendorId: integer('vendor_id').references(() => vendors.id), // null = sold directly by LGF's Mall
  categoryId: integer('category_id').references(() => categories.id),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description').notNull().default(''),
  images: jsonb('images').$type<string[]>().notNull().default([]),
  sku: text('sku').notNull(),
  stock: integer('stock').notNull().default(0),
  retailPrice: numeric('retail_price', { precision: 12, scale: 2 }).notNull(),
  wholesalePrice: numeric('wholesale_price', { precision: 12, scale: 2 }),
  minWholesaleQty: integer('min_wholesale_qty').notNull().default(0),
  fulfillment: text('fulfillment').notNull().default('vendor'), // lgf | vendor | vendor_lgf_delivery
  status: text('status').notNull().default('active'), // draft | active | archived
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const productReviews = pgTable('product_reviews', {
  id: serial('id').primaryKey(),
  productId: integer('product_id')
    .notNull()
    .references(() => products.id),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  rating: integer('rating').notNull(),
  comment: text('comment').notNull().default(''),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const cartItems = pgTable('cart_items', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  productId: integer('product_id')
    .notNull()
    .references(() => products.id),
  quantity: integer('quantity').notNull().default(1),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  status: text('status').notNull().default('pending'), // pending | paid | processing | shipped | delivered | cancelled | refunded
  subtotal: numeric('subtotal', { precision: 12, scale: 2 }).notNull(),
  deliveryFee: numeric('delivery_fee', { precision: 12, scale: 2 })
    .notNull()
    .default('0'),
  total: numeric('total', { precision: 12, scale: 2 }).notNull(),
  currency: text('currency').notNull().default('XOF'),
  paymentProvider: text('payment_provider').notNull().default(''),
  paymentStatus: text('payment_status').notNull().default('unpaid'), // unpaid | paid | failed
  shippingAddress: jsonb('shipping_address')
    .$type<{
      fullName: string
      phone: string
      city: string
      country: string
      addressLine: string
    }>()
    .notNull(),
  assignedDriverId: integer('assigned_driver_id').references(() => drivers.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id')
    .notNull()
    .references(() => orders.id),
  productId: integer('product_id').references(() => products.id),
  vendorId: integer('vendor_id').references(() => vendors.id),
  productName: text('product_name').notNull(),
  unitPrice: numeric('unit_price', { precision: 12, scale: 2 }).notNull(),
  quantity: integer('quantity').notNull(),
  lineTotal: numeric('line_total', { precision: 12, scale: 2 }).notNull(),
  commissionAmount: numeric('commission_amount', {
    precision: 12,
    scale: 2,
  })
    .notNull()
    .default('0'),
})

export const walletTransactions = pgTable('wallet_transactions', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  type: text('type').notNull(), // credit | debit
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  reason: text('reason').notNull(),
  referenceOrderId: integer('reference_order_id').references(() => orders.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const coupons = pgTable('coupons', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  discountType: text('discount_type').notNull().default('percent'), // percent | fixed
  discountValue: numeric('discount_value', {
    precision: 12,
    scale: 2,
  }).notNull(),
  minOrderAmount: numeric('min_order_amount', { precision: 12, scale: 2 })
    .notNull()
    .default('0'),
  usageLimit: integer('usage_limit').notNull().default(0), // 0 = unlimited
  usedCount: integer('used_count').notNull().default(0),
  active: boolean('active').notNull().default(true),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const investmentProjects = pgTable('investment_projects', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  category: text('category').notNull(), // agriculture | elevage | immobilier | commerce | autres
  description: text('description').notNull().default(''),
  imageUrl: text('image_url').notNull().default(''),
  targetAmount: numeric('target_amount', { precision: 14, scale: 2 }).notNull(),
  collectedAmount: numeric('collected_amount', { precision: 14, scale: 2 })
    .notNull()
    .default('0'),
  expectedRoiPercent: numeric('expected_roi_percent', {
    precision: 5,
    scale: 2,
  }).notNull(),
  durationMonths: integer('duration_months').notNull(),
  status: text('status').notNull().default('open'), // open | funded | closed
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const investments = pgTable('investments', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id')
    .notNull()
    .references(() => investmentProjects.id),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  amount: numeric('amount', { precision: 14, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const supportTickets = pgTable('support_tickets', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  subject: text('subject').notNull(),
  message: text('message').notNull(),
  status: text('status').notNull().default('open'), // open | in_progress | resolved
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
