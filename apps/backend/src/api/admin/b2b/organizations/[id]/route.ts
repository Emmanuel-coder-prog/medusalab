import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { B2B_ORGANIZATION_MODULE } from "../../../../../modules/b2b-organization"
import B2BOrganizationModuleService from "../../../../../modules/b2b-organization/service"
import { B2BOrganizationStatus } from "../../../../../modules/b2b-organization/types"

export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const service = req.scope.resolve<B2BOrganizationModuleService>(B2B_ORGANIZATION_MODULE)
  const organization = await service.retrieveB2BOrganization(req.params.id)
  if (!organization) throw new MedusaError(MedusaError.Types.NOT_FOUND, "Organization not found.")
  const members = await service.listB2BOrganizationMembers({ organization_id: organization.id })
  return res.json({ organization, members })
}

export const PATCH = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const service = req.scope.resolve<B2BOrganizationModuleService>(B2B_ORGANIZATION_MODULE)
  const body = req.body as Record<string, unknown>
  const allowedStatuses = Object.values(B2BOrganizationStatus)
  if (body.status && !allowedStatuses.includes(String(body.status) as B2BOrganizationStatus)) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Invalid organization status.")
  }
  const organization = await service.updateB2BOrganizations({
    id: req.params.id,
    ...(body.legal_name !== undefined && { legal_name: String(body.legal_name) }),
    ...(body.display_name !== undefined && { display_name: String(body.display_name) }),
    ...(body.status !== undefined && { status: String(body.status) }),
    ...(body.approval_threshold !== undefined && { approval_threshold: body.approval_threshold === null ? null : Number(body.approval_threshold) }),
    ...(body.approval_currency_code !== undefined && { approval_currency_code: body.approval_currency_code ? String(body.approval_currency_code) : null }),
    ...(body.requires_merchant_quote !== undefined && { requires_merchant_quote: Boolean(body.requires_merchant_quote) }),
    ...(body.quote_validity_days !== undefined && { quote_validity_days: Number(body.quote_validity_days) }),
    ...(body.customer_group_id !== undefined && { customer_group_id: body.customer_group_id ? String(body.customer_group_id) : null }),
    ...(body.default_region_id !== undefined && { default_region_id: body.default_region_id ? String(body.default_region_id) : null }),
  } as any)
  return res.json({ organization })
}
