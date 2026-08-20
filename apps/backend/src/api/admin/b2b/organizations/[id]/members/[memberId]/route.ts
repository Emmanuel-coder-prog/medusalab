import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { B2B_ORGANIZATION_MODULE } from "../../../../../../../modules/b2b-organization"
import B2BOrganizationModuleService from "../../../../../../../modules/b2b-organization/service"
import { B2BOrganizationMemberStatus, B2BOrganizationRole } from "../../../../../../../modules/b2b-organization/types"

export const PATCH = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const service = req.scope.resolve<B2BOrganizationModuleService>(B2B_ORGANIZATION_MODULE)
  const body = req.body as Record<string, unknown>
  const current = await service.retrieveB2BOrganizationMember(req.params.memberId)
  if (!current) throw new MedusaError(MedusaError.Types.NOT_FOUND, "Organization member not found.")
  if (body.role && !Object.values(B2BOrganizationRole).includes(String(body.role) as B2BOrganizationRole)) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Invalid organization role.")
  }
  if (body.status && !Object.values(B2BOrganizationMemberStatus).includes(String(body.status) as B2BOrganizationMemberStatus)) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Invalid member status.")
  }
  const member = await service.updateB2BOrganizationMembers({
    id: req.params.memberId,
    ...(body.role !== undefined && { role: String(body.role) as B2BOrganizationRole }),
    ...(body.status !== undefined && { status: String(body.status) as B2BOrganizationMemberStatus }),
  } as any)
  return res.json({ member })
}
