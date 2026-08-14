import { z } from "@medusajs/framework/zod"

export const PostSubmitB2BPurchaseRequest = z.object({
  cart_id: z.string().min(1),
})
