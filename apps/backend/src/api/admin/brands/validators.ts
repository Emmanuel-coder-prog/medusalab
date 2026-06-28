import { z } from "@medusajs/framework/zod"

export const AdminCreateBrandSchema = z.object({
  name: z.string().min(1, "Brand name is required"),
  handle: z.string().min(1, "Brand handle is required"),
  description: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
})

export type AdminCreateBrandInput = z.infer<typeof AdminCreateBrandSchema>

export const AdminListBrandSchema = z.object({
  offset: z.coerce.number().int().min(0).optional(),
  limit: z.coerce.number().int().min(1).optional(),
})

export type AdminListBrandQuery = z.infer<typeof AdminListBrandSchema>
