import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import { MedusaError } from "@medusajs/framework/utils"
import { z } from "@medusajs/framework/zod"

import { B2B_PURCHASE_MODULE } from "../../../../../../../../modules/b2b-purchase"
import B2BPurchaseModuleService from "../../../../../../../../modules/b2b-purchase/service"
import { B2BPurchaseApprovalDecision } from "../../../../../../../../modules/b2b-purchase/types"
import { decideB2BPurchaseRequestWorkflow } from "../../../../../../../../workflows/b2b/decide-purchase-request"

const PostPurchaseRequestDecision = z.object({
  decision: z.enum([
    B2BPurchaseApprovalDecision.APPROVED,
    B2BPurchaseApprovalDecision.REJECTED,
  ]),
  note: z.string().optional(),
})

type PostPurchaseRequestDecisionBody = z.infer<typeof PostPurchaseRequestDecision>

type RouteParams = {
  id: string
}

export const POST = async (
  req: AuthenticatedMedusaRequest<PostPurchaseRequestDecisionBody, RouteParams>,
  res: MedusaResponse
) => {
  const customerId = req.auth_context?.actor_id

  if (!customerId) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "Customer authentication is required."
    )
  }

  const purchaseService = req.scope.resolve<B2BPurchaseModuleService>(
    B2B_PURCHASE_MODULE
  )

  const request = await purchaseService.retrieveB2BPurchaseRequest(req.params.id)

  if (!request) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "Purchase request not found."
    )
  }

  const { result } = await decideB2BPurchaseRequestWorkflow(req.scope).run({
    input: {
      purchase_request_id: req.params.id,
      approver_customer_id: customerId,
      decision: req.validatedBody.decision,
      note: req.validatedBody.note,
    },
  })

  const approvalHistory = await purchaseService.listB2BPurchaseApprovals({
    purchase_request_id: req.params.id,
  })

  return res.status(200).json({
    purchase_request: result.purchase_request,
    approval: approvalHistory.at(-1) ?? null,
  })
}
