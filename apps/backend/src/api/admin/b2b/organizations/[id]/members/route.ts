import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { B2B_ORGANIZATION_MODULE } from "../../../../../../modules/b2b-organization"
import B2BOrganizationModuleService from "../../../../../../modules/b2b-organization/service"
import { B2BOrganizationMemberStatus, B2BOrganizationRole } from "../../../../../../modules/b2b-organization/types"

export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const service = req.scope.resolve<B2BOrganizationModuleService>(B2B_ORGANIZATION_MODULE)
  const members = await service.listB2BOrganizationMembers({ organization_id: req.params.id })
  return res.json({ members })
}

export const POST = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const service = req.scope.resolve<B2BOrganizationModuleService>(B2B_ORGANIZATION_MODULE)
  const body = req.body as Record<string, unknown>
  if (!body.customer_id) throw new MedusaError(MedusaError.Types.INVALID_DATA, "customer_id is required.")
  const member = await service.createB2BOrganizationMembers({
    organization_id: req.params.id,
    customer_id: String(body.customer_id),
    role: body.role ? String(body.role) as B2BOrganizationRole : B2BOrganizationRole.BUYER,
    status: body.status ? String(body.status) as B2BOrganizationMemberStatus : B2BOrganizationMemberStatus.INVITED,
  })
  return res.status(201).json({ member })
}
