import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import { MedusaError } from "@medusajs/framework/utils"

import B2BOrganizationModuleService from "../../../../../../../modules/b2b-organization/service"
import {
  B2BOrganizationMemberStatus,
  B2BOrganizationRole,
} from "../../../../../../../modules/b2b-organization/types"
import B2BPurchaseModuleService from "../../../../../../../modules/b2b-purchase/service"
import { B2BPurchaseRequestStatus } from "../../../../../../../modules/b2b-purchase/types"

const B2B_ORGANIZATION_MODULE = "b2bOrganization"
const B2B_PURCHASE_MODULE = "b2bPurchase"

type RouteParams = {
  id: string
}

export const GET = async (
  req: AuthenticatedMedusaRequest<unknown, RouteParams>,
  res: MedusaResponse
) => {
  const customerId = req.auth_context?.actor_id

  if (!customerId) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "Customer authentication is required."
    )
  }

  const orgService = req.scope.resolve<B2BOrganizationModuleService>(
    B2B_ORGANIZATION_MODULE
  )

  const memberships = await orgService.listB2BOrganizationMembers({
    customer_id: customerId,
    status: B2BOrganizationMemberStatus.ACTIVE,
  })

  const approverOrgIds = memberships
    .filter((member) =>
      [B2BOrganizationRole.OWNER, B2BOrganizationRole.APPROVER].includes(member.role)
    )
    .map((member) => member.organization_id)

  if (approverOrgIds.length === 0) {
    return res.status(403).json({
      error: "You do not have approval authority for any organization.",
    })
  }

  const purchaseService = req.scope.resolve<B2BPurchaseModuleService>(
    B2B_PURCHASE_MODULE
  )

  const requests = await purchaseService.listB2BPurchaseRequests({
    id: req.params.id,
    organization_id: approverOrgIds,
    status: B2BPurchaseRequestStatus.PENDING_INTERNAL_APPROVAL,
  })

  const request = requests[0]

  if (!request) {
    return res.status(404).json({ error: "Purchase request not found." })
  }

  const approvalHistory = await purchaseService.listB2BPurchaseApprovals({
    purchase_request_id: request.id,
  })

  return res.json({
    purchase_request: request,
    approval_history: approvalHistory,
  })
}
