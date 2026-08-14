import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import { MedusaError, Modules } from "@medusajs/framework/utils"
import { z } from "@medusajs/framework/zod"

import { B2B_ORGANIZATION_MODULE } from "../../../../../../../../modules/b2b-organization"
import B2BOrganizationModuleService from "../../../../../../../../modules/b2b-organization/service"
import { B2BOrganizationMemberStatus } from "../../../../../../../../modules/b2b-organization/types"
import { B2B_PURCHASE_MODULE } from "../../../../../../../../modules/b2b-purchase"
import B2BPurchaseModuleService from "../../../../../../../../modules/b2b-purchase/service"
import {
  B2BPurchaseApprovalDecision,
  B2BPurchaseRequestStatus,
} from "../../../../../../../../modules/b2b-purchase/types"

const PostPurchaseRequestDecision = z.object({
  decision: z.enum([B2BPurchaseApprovalDecision.APPROVED, B2BPurchaseApprovalDecision.REJECTED]),
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

  const b2bOrgService = req.scope.resolve<
    B2BOrganizationModuleService
  >(B2B_ORGANIZATION_MODULE)

  const contexts = await b2bOrgService.listB2BCartContexts({
    customer_id: customerId,
  })

  const selectedCartContext = contexts.find(
    (context) => context.organization_id === req.params.id
  )

  if (!selectedCartContext) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "No active B2B organization context was found for this customer."
    )
  }

  const purchaseService = req.scope.resolve<B2BPurchaseModuleService>(
    B2B_PURCHASE_MODULE
  )

  const requests = await purchaseService.listB2BPurchaseRequests({
    id: req.params.id,
    customer_id: customerId,
  })

  const request = requests[0]

  if (!request) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "Purchase request not found."
    )
  }

  if (request.status !== B2BPurchaseRequestStatus.PENDING_BUYER_ACCEPTANCE) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Purchase request is not awaiting buyer acceptance."
    )
  }

  if (req.validatedBody.decision === B2BPurchaseApprovalDecision.REJECTED) {
    const rejected = await purchaseService.updateB2BPurchaseRequests({
      id: request.id,
      status: B2BPurchaseRequestStatus.REJECTED,
      rejected_at: new Date(),
    })

    return res.status(200).json({ purchase_request: rejected })
  }

  const accepted = await purchaseService.updateB2BPurchaseRequests({
    id: request.id,
    status: B2BPurchaseRequestStatus.CONVERTED,
    accepted_at: new Date(),
  })

  return res.status(200).json({ purchase_request: accepted })
}
