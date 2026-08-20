import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import B2BPurchaseModuleService from "../../../../../modules/b2b-purchase/service"

const B2B_PURCHASE_MODULE = "b2bPurchase"

/**
 * GET /admin/b2b/purchase-requests/[id]
 *
 * Retrieve a single purchase request with full details
 * including draft order, cart snapshot, and policy snapshot
 *
 * Response: { purchase_request: B2BPurchaseRequest }
 */
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const service = req.scope.resolve<B2BPurchaseModuleService>(
    B2B_PURCHASE_MODULE
  )

  try {
    const request =
      await service.retrieveB2BPurchaseRequest(req.params.id)

    if (!request) {
      return res.status(404).json({
        error: "Purchase request not found",
      })
    }

    return res.json({ purchase_request: request })
  } catch (error) {
    console.error("Error fetching purchase request:", error)
    return res.status(500).json({ error: "Failed to fetch purchase request" })
  }
}
