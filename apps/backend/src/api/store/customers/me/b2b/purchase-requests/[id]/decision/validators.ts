import { z } from "@medusajs/framework/zod"
import { B2BPurchaseApprovalDecision } from "../../../../../../../../modules/b2b-purchase/types"

export const PostPurchaseRequestDecision = z.object({
  decision: z.enum([
    B2BPurchaseApprovalDecision.APPROVED,
    B2BPurchaseApprovalDecision.REJECTED,
  ]),
  note: z.string().optional(),
})
