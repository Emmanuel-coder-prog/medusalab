import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { B2B_ORGANIZATION_MODULE } from "../../../../modules/b2b-organization"
import B2BOrganizationModuleService from "../../../../modules/b2b-organization/service"
import { B2BOrganizationStatus } from "../../../../modules/b2b-organization/types"

export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const service = req.scope.resolve<B2BOrganizationModuleService>(B2B_ORGANIZATION_MODULE)
  const organizations = await service.listB2BOrganizations({}, { take: 100 })
  return res.json({ organizations })
}

export const POST = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const service = req.scope.resolve<B2BOrganizationModuleService>(B2B_ORGANIZATION_MODULE)
  const body = req.body as Record<string, unknown>
  if (!body.legal_name || !body.display_name || !body.handle || !body.sales_channel_id) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "legal_name, display_name, handle, and sales_channel_id are required.")
  }
  const organization = await service.createB2BOrganizations({
    legal_name: String(body.legal_name),
    display_name: String(body.display_name),
    handle: String(body.handle),
    sales_channel_id: String(body.sales_channel_id),
    status: body.status ? String(body.status) as B2BOrganizationStatus : B2BOrganizationStatus.PENDING,
    customer_group_id: body.customer_group_id ? String(body.customer_group_id) : null,
    default_region_id: body.default_region_id ? String(body.default_region_id) : null,
    approval_threshold: body.approval_threshold === undefined || body.approval_threshold === null ? null : Number(body.approval_threshold),
    approval_currency_code: body.approval_currency_code ? String(body.approval_currency_code) : null,
    requires_merchant_quote: Boolean(body.requires_merchant_quote),
    quote_validity_days: body.quote_validity_days ? Number(body.quote_validity_days) : 7,
  })
  return res.status(201).json({ organization })
}
