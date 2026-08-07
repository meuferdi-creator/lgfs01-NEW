import { db } from '../db'
import { users, vendors } from '../db/schema'
import { eq, sql } from 'drizzle-orm'

/**
 * Script pour lier le compte admin à une boutique "LGF's Store" pré-approuvée.
 * 
 * Usage: npx tsx scripts/seed-lgf-store.ts
 * 
 * Ce script:
 * 1. Cherche l'utilisateur avec email lgfmall.lmd11@gmail.com
 * 2. Si trouvé et aucune boutique n'existe pour cet utilisateur, crée une boutique approuvée
 * 3. Affiche un message si l'utilisateur n'existe pas encore (doit se connecter d'abord)
 */

async function seedLgfStore() {
  const ADMIN_EMAIL = 'lgfmall.lmd11@gmail.com'
  const SHOP_NAME = "LGF's Store"

  // 1. Chercher l'utilisateur par email
  const userRows = await db.select().from(users).where(eq(users.email, ADMIN_EMAIL))

  if (userRows.length === 0) {
    console.log(`❌ Aucun utilisateur trouvé avec l'email "${ADMIN_EMAIL}".`)
    console.log('Veuillez vous connecter une fois sur le site avec ce compte avant de relancer ce script.')
    process.exit(0)
  }

  const user = userRows[0]
  console.log(`✅ Utilisateur trouvé: ${user.email} (ID: ${user.id})`)

  // 2. Vérifier si une boutique existe déjà pour cet utilisateur
  const existingVendors = await db.select().from(vendors).where(eq(vendors.userId, user.id))

  if (existingVendors.length > 0) {
    console.log(`ℹ️ Une boutique existe déjà pour cet utilisateur: "${existingVendors[0].shopName}" (statut: ${existingVendors[0].status})`)
    console.log('Aucune action nécessaire.')
    process.exit(0)
  }

  // 3. Créer la boutique "LGF's Store" avec statut approuvé et commission à 0%
  const slugBase = shopNameToSlug(SHOP_NAME)
  
  const [newVendor] = await db
    .insert(vendors)
    .values({
      userId: user.id,
      shopName: SHOP_NAME,
      slug: slugBase,
      description: 'Boutique officielle de LGF\'s Mall',
      city: '',
      country: 'Togo',
      status: 'approved',
      commissionRate: '0', // 0% car c'est la boutique de la plateforme
      reviewedAt: new Date(),
    })
    .returning()

  console.log(`✅ Boutique créée avec succès:`)
  console.log(`   - Nom: ${newVendor.shopName}`)
  console.log(`   - Slug: ${newVendor.slug}`)
  console.log(`   - Statut: ${newVendor.status}`)
  console.log(`   - Commission: ${newVendor.commissionRate}%`)
  console.log(`\nL'utilisateur peut maintenant accéder à /vendeur pour gérer sa boutique.`)
}

function shopNameToSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

seedLgfStore().catch((err) => {
  console.error('Erreur lors de l\'exécution du script:', err)
  process.exit(1)
})
