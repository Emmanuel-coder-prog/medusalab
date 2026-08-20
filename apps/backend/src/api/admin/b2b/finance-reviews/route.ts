import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { B2B_FINANCE_MODULE } from "../../../../modules/b2b-finance"
import B2BFinanceModuleService from "../../../../modules/b2b-finance/service"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const financeService = req.scope.resolve<B2BFinanceModuleService>(
    B2B_FINANCE_MODULE
  )
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const status = req.query.status as string | undefined
  const skip = req.query.skip ? parseInt(req.query.skip as string, 10) : 0
  const take = req.query.take ? parseInt(req.query.take as string, 10) : 20

  const filters = status ? { status } : undefined
  const reviews = await financeService.listB2BOrderFinanceReviews(filters, {
    skip,
    take,
  })

  const financeReviews = await Promise.all(
    reviews.map(async (review) => {
      const releases = await financeService.listB2BOrderReleases({
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

      return {
        review,
        order,
        organization: { id: review.organization_id },
        customer: order?.customer ?? null,
        finance_account: financeAccount ?? null,
        release: releases?.[0] ?? null,
      }
    })
  )

  return res.json({
    finance_reviews: financeReviews,
    count: financeReviews.length,
    total: reviews.length,
  })
}
