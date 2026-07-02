import { z } from "@medusajs/framework/zod"

export const AdminLinkProductBrandSchema = z.object({
  brand_id: z.string().min(1, "Brand is required"),
})

export type AdminLinkProductBrandInput = z.infer<
  typeof AdminLinkProductBrandSchema
>
