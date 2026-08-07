CREATE TABLE "cart_items" (
	"id" serial PRIMARY KEY,
	"user_id" text NOT NULL,
	"product_id" integer NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY,
	"name" text NOT NULL,
	"slug" text NOT NULL UNIQUE
);
--> statement-breakpoint
CREATE TABLE "coupons" (
	"id" serial PRIMARY KEY,
	"code" text NOT NULL UNIQUE,
	"discount_type" text DEFAULT 'percent' NOT NULL,
	"discount_value" numeric(12,2) NOT NULL,
	"min_order_amount" numeric(12,2) DEFAULT '0' NOT NULL,
	"usage_limit" integer DEFAULT 0 NOT NULL,
	"used_count" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "drivers" (
	"id" serial PRIMARY KEY,
	"user_id" text NOT NULL UNIQUE,
	"vehicle_type" text DEFAULT 'motorcycle' NOT NULL,
	"zone" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"is_available" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "investment_projects" (
	"id" serial PRIMARY KEY,
	"title" text NOT NULL,
	"category" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"image_url" text DEFAULT '' NOT NULL,
	"target_amount" numeric(14,2) NOT NULL,
	"collected_amount" numeric(14,2) DEFAULT '0' NOT NULL,
	"expected_roi_percent" numeric(5,2) NOT NULL,
	"duration_months" integer NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "investments" (
	"id" serial PRIMARY KEY,
	"project_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"amount" numeric(14,2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kyc_documents" (
	"id" serial PRIMARY KEY,
	"user_id" text NOT NULL,
	"vendor_id" integer,
	"applicant_type" text NOT NULL,
	"id_type" text NOT NULL,
	"id_number" text NOT NULL,
	"document_url" text NOT NULL,
	"selfie_url" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"review_note" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"reviewed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" serial PRIMARY KEY,
	"order_id" integer NOT NULL,
	"product_id" integer,
	"vendor_id" integer,
	"product_name" text NOT NULL,
	"unit_price" numeric(12,2) NOT NULL,
	"quantity" integer NOT NULL,
	"line_total" numeric(12,2) NOT NULL,
	"commission_amount" numeric(12,2) DEFAULT '0' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY,
	"user_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"subtotal" numeric(12,2) NOT NULL,
	"delivery_fee" numeric(12,2) DEFAULT '0' NOT NULL,
	"total" numeric(12,2) NOT NULL,
	"currency" text DEFAULT 'XOF' NOT NULL,
	"payment_provider" text DEFAULT '' NOT NULL,
	"payment_status" text DEFAULT 'unpaid' NOT NULL,
	"shipping_address" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_reviews" (
	"id" serial PRIMARY KEY,
	"product_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"rating" integer NOT NULL,
	"comment" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY,
	"vendor_id" integer,
	"category_id" integer,
	"name" text NOT NULL,
	"slug" text NOT NULL UNIQUE,
	"description" text DEFAULT '' NOT NULL,
	"images" jsonb DEFAULT '[]' NOT NULL,
	"sku" text NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL,
	"retail_price" numeric(12,2) NOT NULL,
	"wholesale_price" numeric(12,2),
	"min_wholesale_qty" integer DEFAULT 0 NOT NULL,
	"fulfillment" text DEFAULT 'vendor' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_tickets" (
	"id" serial PRIMARY KEY,
	"user_id" text NOT NULL,
	"subject" text NOT NULL,
	"message" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY,
	"email" text NOT NULL,
	"full_name" text DEFAULT '' NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"wallet_balance" numeric(12,2) DEFAULT '0' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vendors" (
	"id" serial PRIMARY KEY,
	"user_id" text NOT NULL,
	"shop_name" text NOT NULL,
	"slug" text NOT NULL UNIQUE,
	"description" text DEFAULT '' NOT NULL,
	"city" text DEFAULT '' NOT NULL,
	"country" text DEFAULT 'Togo' NOT NULL,
	"logo_url" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"commission_rate" numeric(5,2) DEFAULT '10' NOT NULL,
	"rejection_reason" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"reviewed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "wallet_transactions" (
	"id" serial PRIMARY KEY,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"amount" numeric(12,2) NOT NULL,
	"reason" text NOT NULL,
	"reference_order_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_product_id_products_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id");--> statement-breakpoint
ALTER TABLE "drivers" ADD CONSTRAINT "drivers_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "investments" ADD CONSTRAINT "investments_project_id_investment_projects_id_fkey" FOREIGN KEY ("project_id") REFERENCES "investment_projects"("id");--> statement-breakpoint
ALTER TABLE "investments" ADD CONSTRAINT "investments_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "kyc_documents" ADD CONSTRAINT "kyc_documents_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "kyc_documents" ADD CONSTRAINT "kyc_documents_vendor_id_vendors_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id");--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id");--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id");--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_vendor_id_vendors_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id");--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_product_id_products_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id");--> statement-breakpoint
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_vendor_id_vendors_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id");--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id");--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_reference_order_id_orders_id_fkey" FOREIGN KEY ("reference_order_id") REFERENCES "orders"("id");