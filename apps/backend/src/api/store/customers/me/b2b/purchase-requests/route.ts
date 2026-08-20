import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import { MedusaError } from "@medusajs/framework/utils"
import { z } from "@medusajs/framework/zod"

import { B2B_ORGANIZATION_MODULE } from "../../../../../../modules/b2b-organization"
import B2BOrganizationModuleService from "../../../../../../modules/b2b-organization/service"
import {
  B2BOrganizationMemberStatus,
  B2BOrganizationRole,
} from "../../../../../../modules/b2b-organization/types"
import { B2B_PURCHASE_MODULE } from "../../../../../../modules/b2b-purchase"
import B2BPurchaseModuleService from "../../../../../../modules/b2b-purchase/service"
import { B2BPurchaseRequestStatus } from "../../../../../../modules/b2b-purchase/types"
import {
  submitB2BPurchaseRequestWorkflow,
} from "../../../../../../workflows/b2b/submit-purchase-request"

import {
  PostB2BPurchaseRequest,
} from "./validators"

type Body = z.infer<typeof PostB2BPurchaseRequest>

export const GET = async (
  req: AuthenticatedMedusaRequest,
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
    return res.json({ purchase_requests: [], total: 0, count: 0 })
  }

  const purchaseService = req.scope.resolve<B2BPurchaseModuleService>(
    B2B_PURCHASE_MODULE
  )

  const filters: Record<string, unknown> = {
    organization_id: approverOrgIds,
    status: B2BPurchaseRequestStatus.PENDING_INTERNAL_APPROVAL,
  }

  if (req.query.organization_id) {
    filters.organization_id = String(req.query.organization_id)
  }

  const requests = await purchaseService.listB2BPurchaseRequests(filters)

  return res.json({
    purchase_requests: requests,
    total: requests.length,
    count: requests.length,
  })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<Body>,
  res: MedusaResponse
) => {
  const { result } =
    await submitB2BPurchaseRequestWorkflow(
      req.scope
    ).run({
      input: {
        cart_id: req.validatedBody.cart_id,
        customer_id: req.auth_context.actor_id,
        purchase_order_number:
          req.validatedBody.purchase_order_number,
      },
    })

  res.status(201).json(result)
}

