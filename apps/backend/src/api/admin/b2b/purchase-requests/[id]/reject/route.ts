import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"

import { MedusaError } from "@medusajs/framework/utils"
import B2BPurchaseModuleService from "../../../../../../modules/b2b-purchase/service"
import { B2BPurchaseRequestStatus } from "../../../../../../modules/b2b-purchase/types"

const B2B_PURCHASE_MODULE = "b2bPurchase"

const PostRejectQuoteSchema = z.object({
  reason: z.string().min(1, "Rejection reason is required"),
})

type Body = z.infer<typeof PostRejectQuoteSchema>

/**
 * POST /admin/b2b/purchase-requests/[id]/reject
 *
 * Reject a purchase request (cancel quotation).
 *
 * This can be used when the merchant cannot fulfill the quote or wishes to cancel.
 * Transitions the purchase request to REJECTED status.
 *
 * Request body: { reason: string }
 * Response: { purchase_request: B2BPurchaseRequest }
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<Body>,
  res: MedusaResponse
) => {
  try {
    const body = PostRejectQuoteSchema.parse(req.body || {})
    const service = req.scope.resolve<B2BPurchaseModuleService>(
      B2B_PURCHASE_MODULE
    )

    const request =
      await service.retrieveB2BPurchaseRequest(req.params.id)

    if (!request) {
      return res.status(404).json({
        error: "Purchase request not found",
      })
    }

    // Allow rejection from either quote or approval status
    if (
      ![
        B2BPurchaseRequestStatus.PENDING_MERCHANT_QUOTE,
        B2BPurchaseRequestStatus.PENDING_INTERNAL_APPROVAL,
      ].includes(request.status)
    ) {
      return res.status(400).json({
        error: "This purchase request cannot be rejected in its current status",
      })
    }

    const now = new Date()

    const updated =
      await service.updateB2BPurchaseRequests({
        id: request.id,
        status: B2BPurchaseRequestStatus.REJECTED,
        rejected_at: now,
      })

    return res.status(200).json({ purchase_request: updated })
  } catch (error: any) {
    console.error("Error rejecting purchase request:", error)

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Invalid request body",
        details: error.issues,
      })
    }

    return res.status(500).json({
      error: "Failed to reject purchase request",
    })
  }
}
