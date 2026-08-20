import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import B2BPurchaseModuleService from "../../../../modules/b2b-purchase/service"
import { B2BPurchaseRequestStatus } from "../../../../modules/b2b-purchase/types"

const B2B_PURCHASE_MODULE = "b2bPurchase"

/**
 * GET /admin/b2b/purchase-requests
 *
 * List purchase requests in PENDING_MERCHANT_QUOTE status
 * (purchase requests awaiting merchant quotation)
 *
 * Query params:
 * - status: optional, filter by status (defaults to PENDING_MERCHANT_QUOTE)
 * - skip: pagination offset
 * - take: pagination limit
 *
 * Response: { purchase_requests: B2BPurchaseRequest[], total: number }
 */
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const service = req.scope.resolve<B2BPurchaseModuleService>(
    B2B_PURCHASE_MODULE
  )

  // Default to quote queue; can be overridden via query
  const status = (req.query.status as string) || B2BPurchaseRequestStatus.PENDING_MERCHANT_QUOTE
  const skip = req.query.skip ? parseInt(req.query.skip as string) : 0
  const take = req.query.take ? parseInt(req.query.take as string) : 20

  try {
    const [requests, total] =
      await service.listB2BPurchaseRequests(
        { status },
        { skip, take }
      )

    return res.json({
      purchase_requests: requests,
      total,
      count: (requests as any).length || 0,
    })
  } catch (error) {
    console.error("Error fetching purchase requests:", error)
    return res.status(500).json({ error: "Failed to fetch purchase requests" })
  }
}
