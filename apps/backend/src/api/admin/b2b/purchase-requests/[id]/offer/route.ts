import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"

import { sendB2BQuoteOfferWorkflow } from "../../../../../../workflows/b2b/send-quote-offer"

const PostSendOfferSchema = z.object({
  note: z.string().optional(),
})

type Body = z.infer<typeof PostSendOfferSchema>

/**
 * POST /admin/b2b/purchase-requests/[id]/offer
 *
 * Send a quote offer to the buyer.
 *
 * This transitions the purchase request from PENDING_MERCHANT_QUOTE to PENDING_BUYER_ACCEPTANCE.
 * The merchant must have already edited the draft order using Medusa's native draft order
 * editing mechanisms. This endpoint just marks the offer as sent.
 *
 * Request body: { note?: string }
 * Response: { purchase_request: B2BPurchaseRequest }
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<Body>,
  res: MedusaResponse
) => {
  try {
    const body = PostSendOfferSchema.parse(req.body || {})

    const { result } = await sendB2BQuoteOfferWorkflow(
      req.scope
    ).run({
      input: {
        purchase_request_id: req.params.id,
        admin_user_id: req.auth_context.actor_id,
        note: body.note,
      },
    })

    return res.status(200).json(result)
  } catch (error: any) {
    console.error("Error sending quote offer:", error)

    if (error.type === "invalid_data") {
      return res.status(400).json({ error: error.message })
    }

    if (error.type === "not_found") {
      return res.status(404).json({ error: error.message })
    }

    return res.status(500).json({
      error: "Failed to send quote offer",
    })
  }
}
