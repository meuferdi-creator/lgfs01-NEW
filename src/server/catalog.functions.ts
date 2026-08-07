import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { listCategories, listProducts, getProductBySlug } from './catalog.server'

export const getCategories = createServerFn({ method: 'GET' }).handler(async () => {
  return listCategories()
})

export const getProducts = createServerFn({ method: 'GET' })
  .inputValidator(
    z.object({
      search: z.string().optional(),
      categorySlug: z.string().optional(),
      minPrice: z.number().optional(),
      maxPrice: z.number().optional(),
    }),
  )
  .handler(async ({ data }) => {
    return listProducts(data)
  })

export const getProduct = createServerFn({ method: 'GET' })
  .inputValidator((slug: string) => slug)
  .handler(async ({ data: slug }) => {
    return getProductBySlug(slug)
  })
