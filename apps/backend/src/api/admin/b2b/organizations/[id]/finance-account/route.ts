import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { B2B_FINANCE_MODULE } from "../../../../../../modules/b2b-finance"
import B2BFinanceModuleService from "../../../../../../modules/b2b-finance/service"
import { B2BFinanceAccountStatus } from "../../../../../../modules/b2b-finance/types"

export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const service = req.scope.resolve<B2BFinanceModuleService>(B2B_FINANCE_MODULE)
  const accounts = await service.listB2BFinanceAccounts({ organization_id: req.params.id })
  return res.json({ finance_accounts: accounts })
}

export const POST = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const service = req.scope.resolve<B2BFinanceModuleService>(B2B_FINANCE_MODULE)
  const body = req.body as Record<string, unknown>
  if (!body.currency_code) throw new MedusaError(MedusaError.Types.INVALID_DATA, "currency_code is required.")
  const account = await service.createB2BFinanceAccounts({
    organization_id: req.params.id,
    currency_code: String(body.currency_code),
    status: body.status ? String(body.status) as B2BFinanceAccountStatus : B2BFinanceAccountStatus.PENDING,
    payment_terms_code: body.payment_terms_code ? String(body.payment_terms_code) : null,
    approved_credit_limit: body.approved_credit_limit === undefined || body.approved_credit_limit === null ? null : Number(body.approved_credit_limit),
    requires_manual_review: body.requires_manual_review !== false,
    external_finance_account_id: body.external_finance_account_id ? String(body.external_finance_account_id) : null,
    finance_source: body.finance_source ? String(body.finance_source) : null,
  })
  return res.status(201).json({ finance_account: account })
}

export const PATCH = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const service = req.scope.resolve<B2BFinanceModuleService>(B2B_FINANCE_MODULE)
  const body = req.body as Record<string, unknown>
  if (!body.id) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Finance account id is required.")
  const account = await service.updateB2BFinanceAccounts({
    id: String(body.id),
    ...(body.status !== undefined && { status: String(body.status) as B2BFinanceAccountStatus }),
    ...(body.payment_terms_code !== undefined && { payment_terms_code: body.payment_terms_code ? String(body.payment_terms_code) : null }),
    ...(body.approved_credit_limit !== undefined && { approved_credit_limit: body.approved_credit_limit === null ? null : Number(body.approved_credit_limit) }),
    ...(body.requires_manual_review !== undefined && { requires_manual_review: Boolean(body.requires_manual_review) }),
    ...(body.external_finance_account_id !== undefined && { external_finance_account_id: body.external_finance_account_id ? String(body.external_finance_account_id) : null }),
    ...(body.finance_source !== undefined && { finance_source: body.finance_source ? String(body.finance_source) : null }),
  } as any)
  return res.json({ finance_account: account })
}
