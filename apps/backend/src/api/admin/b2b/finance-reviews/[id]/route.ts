import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { B2B_FINANCE_MODULE } from "../../../../../modules/b2b-finance"
import B2BFinanceModuleService from "../../../../../modules/b2b-finance/service"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const financeService = req.scope.resolve<B2BFinanceModuleService>(
    B2B_FINANCE_MODULE
  )
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const review = await financeService.retrieveB2BOrderFinanceReview(req.params.id)

  if (!review) {
    return res.status(404).json({ error: "Finance review not found" })
  }

  const [release] = await financeService.listB2BOrderReleases({
    finance_review_id: review.id,
  })

  const order = review.order_id
    ? (
        await query.graph({
          entity: "order",
          fields: [
            "id",
            "display_id",
            "email",
            "currency_code",
            "total",
            "customer_id",
            "status",
            "created_at",
            "updated_at",
            "customer.*",
          ],
          filters: {
            id: review.order_id,
          },
        })
      ).data[0] ?? null
    : null

  const financeAccount = review.finance_account_id
    ? await financeService
        .retrieveB2BFinanceAccount(review.finance_account_id)
        .catch(() => null)
    : null

  const [obligation] = await financeService.listB2BPaymentTermsObligations({
    finance_review_id: review.id,
  })

  return res.json({
    finance_review: {
      review,
      order,
      organization: { id: review.organization_id },
      customer: order?.customer ?? null,
      finance_account: financeAccount ?? null,
      release: release ?? null,
      payment_terms_obligation: obligation ?? null,
    },
  })
}
