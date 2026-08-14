import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import { MedusaError } from "@medusajs/framework/utils"
import { z } from "@medusajs/framework/zod"

import { B2B_ORGANIZATION_MODULE } from "../../../../../../modules/b2b-organization"
import B2BOrganizationModuleService from "../../../../../../modules/b2b-organization/service"
import { submitPurchaseRequestWorkflow } from "../../../../../../workflows/b2b/submit-purchase-request"

import { PostSubmitB2BPurchaseRequest } from "./validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<
    z.infer<typeof PostSubmitB2BPurchaseRequest>
  >,
  res: MedusaResponse
) => {
  const customerId = req.auth_context?.actor_id

  if (!customerId) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "Customer authentication is required."
    )
  }

  const service =
    req.scope.resolve<B2BOrganizationModuleService>(
      B2B_ORGANIZATION_MODULE
    )

  const contexts = await service.listB2BCartContexts({
    cart_id: req.validatedBody.cart_id,
    customer_id: customerId,
  })

  const context = contexts[0]

  if (!context) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "No active B2B organization is selected for this cart."
    )
  }

  const { result } = await submitPurchaseRequestWorkflow(req.scope).run({
    input: {
      cart_id: req.validatedBody.cart_id,
      customer_id: customerId,
      organization_id: context.organization_id,
      member_id: context.member_id,
    },
  })

  return res.status(200).json(result)
}
