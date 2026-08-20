import { z } from "@medusajs/framework/zod"

export const PostB2BOrganization = z.object({
  legal_name: z.string().min(1).max(255),
  display_name: z.string().min(1).max(255),
  handle: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
  approval_threshold: z.number().positive().optional(),
  approval_currency_code: z.string().length(3).optional(),
  requires_merchant_quote: z.boolean().default(false),
  quote_validity_days: z.number().int().positive().default(7),
})
