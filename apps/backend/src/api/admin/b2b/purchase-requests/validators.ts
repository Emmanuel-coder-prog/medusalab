import { z } from "@medusajs/framework/zod"

export const PostSendOfferSchema = z.object({
  note: z.string().optional(),
})

export type PostSendOfferInput = z.infer<typeof PostSendOfferSchema>

export const PostRejectQuoteSchema = z.object({
  reason: z.string().min(1, "Rejection reason is required"),
})

export type PostRejectQuoteInput = z.infer<typeof PostRejectQuoteSchema>
