import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Badge, Button, Container, Heading, Text, toast } from "@medusajs/ui"
import { defineRouteConfig } from "@medusajs/admin-sdk"
import { useState } from "react"

type ReviewEntry = {
  review: {
    id: string
    order_id: string
    organization_id: string
    status: string
    order_total: number | string
    currency_code: string
    decision_reason_code?: string | null
    decision_note?: string | null
  }
  order?: { display_id?: string | number; email?: string } | null
  release?: { status: string } | null
}

const label = (value?: string | null) =>
  value ? value.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "—"

const FinanceReviewsPage = () => {
  const queryClient = useQueryClient()
  const [busyId, setBusyId] = useState<string | null>(null)
  const reviewsQuery = useQuery({
    queryKey: ["b2b-finance-reviews-admin"],
    queryFn: async () => {
      const response = await fetch("/admin/b2b/finance-reviews?take=100")
      if (!response.ok) throw new Error("Unable to load finance reviews")
      return (await response.json()) as { finance_reviews: ReviewEntry[] }
    },
  })

  const decide = async (id: string, decision: string) => {
    setBusyId(id)
    try {
      const response = await fetch(`/admin/b2b/finance-reviews/${id}/decision`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ decision }),
      })
      if (!response.ok) throw new Error("Finance decision failed")
      toast.success("Finance decision recorded")
      await queryClient.invalidateQueries({ queryKey: ["b2b-finance-reviews-admin"] })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Finance decision failed")
    } finally {
      setBusyId(null)
    }
  }

  const reviews = reviewsQuery.data?.finance_reviews ?? []

  return (
    <Container className="py-8">
      <Heading>Finance Reviews</Heading>
      <Text className="text-ui-fg-subtle mt-2 mb-6">
        Review orders and record decisions through the existing finance workflow.
      </Text>
      {reviewsQuery.isError && <Text className="text-ui-fg-error mb-4">Unable to load finance reviews.</Text>}
      <div className="rounded-lg border border-ui-border-base divide-y divide-ui-border-base">
        {reviews.length === 0 ? <Text className="p-4 text-ui-fg-subtle">No finance reviews returned.</Text> : reviews.map(({ review, order, release }) => (
          <div key={review.id} className="p-4">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <Text className="font-medium">Order {order?.display_id ?? review.order_id}</Text>
                <Text className="text-sm text-ui-fg-subtle mt-1">Organization: {review.organization_id} · {order?.email ?? "No customer email"}</Text>
                <Text className="text-sm mt-2">{review.order_total} {review.currency_code} · Release: {label(release?.status)}</Text>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge>{label(review.status)}</Badge>
                <Button size="small" variant="secondary" disabled={busyId === review.id} onClick={() => decide(review.id, "approved_on_account")}>Approve on account</Button>
                <Button size="small" variant="secondary" disabled={busyId === review.id} onClick={() => decide(review.id, "prepayment_required")}>Require prepayment</Button>
                <Button size="small" variant="danger" disabled={busyId === review.id} onClick={() => decide(review.id, "rejected")}>Reject</Button>
              </div>
            </div>
            {(review.decision_reason_code || review.decision_note) && <Text className="text-xs text-ui-fg-subtle mt-3">{review.decision_reason_code ?? ""}{review.decision_note ? `: ${review.decision_note}` : ""}</Text>}
          </div>
        ))}
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({ label: "Finance Reviews" })
export default FinanceReviewsPage
