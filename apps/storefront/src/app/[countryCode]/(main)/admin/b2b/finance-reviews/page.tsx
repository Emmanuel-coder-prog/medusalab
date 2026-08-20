import { listFinanceReviews } from "@lib/data/b2b"
import { B2BOrderReleaseStatus } from "@lib/api/types/b2b"
import { Heading, Container, Button, Text } from "@modules/common/components/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import {
  getFinanceReviewStatusColor,
  getFinanceReviewStatusLabel,
  getOrderReleaseStatusColor,
  getOrderReleaseStatusLabel,
} from "@lib/helpers/b2b-status"

export const metadata = {
  title: "Finance Review Queue",
  description: "Review B2B orders requiring finance approval",
}

export default async function FinanceReviewQueuePage() {
  const data = await listFinanceReviews().catch(() => ({ finance_reviews: [], total: 0 }))

  const reviews: NonNullable<typeof data.finance_reviews> = data.finance_reviews || []

  return (
    <Container className="py-12" data-testid="b2b-finance-review-queue">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <Heading level="h1">Finance review queue</Heading>
          <Text className="mt-2 text-ui-fg-muted">
            Orders awaiting finance review and approval.
          </Text>
        </div>
      </div>

      {reviews.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-200 p-8 text-center">
          <Text className="text-ui-fg-muted">No B2B orders are currently waiting for finance review.</Text>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((entry) => {
            const { review, order, organization, customer, release } = entry
            const financeColor = getFinanceReviewStatusColor(review.status)
            const releaseColor = getOrderReleaseStatusColor(
              release?.status ?? B2BOrderReleaseStatus.FINANCE_PENDING
            )
            const statusClasses: Record<string, string> = {
              yellow: "bg-yellow-100 text-yellow-800",
              blue: "bg-blue-100 text-blue-800",
              orange: "bg-orange-100 text-orange-800",
              red: "bg-red-100 text-red-800",
              green: "bg-green-100 text-green-800",
              purple: "bg-purple-100 text-purple-800",
              gray: "bg-gray-100 text-gray-800",
            }

            return (
              <div key={review.id} className="rounded-lg border border-gray-200 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <Text className="font-semibold text-base">Order {order?.display_id ?? review.order_id}</Text>
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusClasses[financeColor]}`}>
                        {getFinanceReviewStatusLabel(review.status)}
                      </span>
                      {release && (
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusClasses[releaseColor]}`}>
                          {getOrderReleaseStatusLabel(release.status)}
                        </span>
                      )}
                    </div>

                    <div className="grid gap-3 md:grid-cols-4">
                      <div>
                        <Text className="text-xs text-ui-fg-muted">Organization</Text>
                        <Text className="mt-1 font-medium">{organization?.id ?? review.organization_id}</Text>
                      </div>
                      <div>
                        <Text className="text-xs text-ui-fg-muted">Customer</Text>
                        <Text className="mt-1 font-medium">{customer?.email ?? order?.customer_id ?? "—"}</Text>
                      </div>
                      <div>
                        <Text className="text-xs text-ui-fg-muted">Currency</Text>
                        <Text className="mt-1 font-medium">{review.currency_code}</Text>
                      </div>
                      <div>
                        <Text className="text-xs text-ui-fg-muted">Total</Text>
                        <Text className="mt-1 font-medium">{Number(review.order_total).toFixed(2)}</Text>
                      </div>
                    </div>
                  </div>

                  <LocalizedClientLink href={`/admin/b2b/finance-reviews/${review.id}`}>
                    <Button variant="secondary">Review order</Button>
                  </LocalizedClientLink>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Container>
  )
}
