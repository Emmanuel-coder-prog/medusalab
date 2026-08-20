import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import { B2B_FINANCE_MODULE } from "../../../../../modules/b2b-finance"
import B2BFinanceModuleService from "../../../../../modules/b2b-finance/service"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const financeService = req.scope.resolve<B2BFinanceModuleService>(
    B2B_FINANCE_MODULE
  )

  const orderId = req.params.id

  const obligations = await financeService.listB2BPaymentTermsObligations({
    order_id: orderId,
  })

  const obligation = obligations?.[0] ?? null

  return res.json({
    payment_terms_obligation: obligation,
  })
}
