import { useQuery } from "@tanstack/react-query"
import { Badge, Container, Heading, Text } from "@medusajs/ui"
import { defineRouteConfig } from "@medusajs/admin-sdk"

type FinanceReview = {
  review: {
    id: string
    order_id: string
    organization_id: string
    status: string
    order_total: number | string
    currency_code: string
    reviewed_at?: string | null
    decision_reason_code?: string | null
  }
  order?: {
    display_id?: string | number
    email?: string
  } | null
  release?: {
    status: string
  } | null
}

type ExceptionRecord = {
  type: string
  severity: string
  reference: string
  order_display_id?: string | number
  organization_id?: string
  status?: string
  reason?: string
  note?: string
  available_actions?: string[]
}

const formatLabel = (value: string) =>
  value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase())

const formatDate = (value?: string | null) => {
  if (!value) return "—"
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString()
}

const B2BOperationsPage = () => {
  const financeQuery = useQuery({
    queryKey: ["b2b-finance-reviews"],
    queryFn: async () => {
      const response = await fetch("/admin/b2b/finance-reviews?take=50")
      if (!response.ok) throw new Error("Unable to load finance reviews")
      return (await response.json()) as {
        finance_reviews: FinanceReview[]
      }
    },
  })

  const exceptionsQuery = useQuery({
    queryKey: ["b2b-exceptions"],
    queryFn: async () => {
      const response = await fetch("/admin/b2b/exceptions")
      if (!response.ok) throw new Error("Unable to load B2B exceptions")
      return (await response.json()) as {
        exceptions: ExceptionRecord[]
        total: number
        summary: { critical: number; warning: number }
      }
    },
  })

  const financeReviews = financeQuery.data?.finance_reviews ?? []
  const exceptions = exceptionsQuery.data?.exceptions ?? []

  return (
    <Container className="py-8">
      <div className="mb-8">
        <Heading>B2B Operations</Heading>
        <Text className="text-ui-fg-subtle mt-2">
          Read-only operational visibility for B2B finance and exception queues.
        </Text>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-8">
        <div className="rounded-lg border border-ui-border-base p-4">
          <Text className="text-ui-fg-subtle">Finance reviews</Text>
          <Text className="text-2xl font-semibold mt-2">
            {financeQuery.isLoading ? "…" : financeReviews.length}
          </Text>
        </div>
        <div className="rounded-lg border border-ui-border-base p-4">
          <Text className="text-ui-fg-subtle">Critical exceptions</Text>
          <Text className="text-2xl font-semibold mt-2">
            {exceptionsQuery.isLoading ? "…" : exceptionsQuery.data?.summary.critical ?? 0}
          </Text>
        </div>
        <div className="rounded-lg border border-ui-border-base p-4">
          <Text className="text-ui-fg-subtle">Warnings</Text>
          <Text className="text-2xl font-semibold mt-2">
            {exceptionsQuery.isLoading ? "…" : exceptionsQuery.data?.summary.warning ?? 0}
          </Text>
        </div>
      </div>

      {(financeQuery.isError || exceptionsQuery.isError) && (
        <div className="rounded-lg border border-ui-border-error bg-ui-bg-base p-4 mb-8">
          <Text className="text-ui-fg-error">
            Some B2B operational data could not be loaded. Check the backend endpoint permissions and logs.
          </Text>
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
        <section>
          <div className="flex items-center justify-between mb-3">
            <Heading level="h2">Finance Reviews</Heading>
            <Text className="text-ui-fg-subtle text-sm">Existing decisions only</Text>
          </div>
          <div className="rounded-lg border border-ui-border-base divide-y divide-ui-border-base">
            {financeReviews.length === 0 ? (
              <Text className="p-4 text-ui-fg-subtle">No finance reviews returned.</Text>
            ) : (
              financeReviews.map(({ review, order, release }) => (
                <div key={review.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Text className="font-medium">
                        Order {order?.display_id ?? review.order_id}
                      </Text>
                      <Text className="text-sm text-ui-fg-subtle mt-1">
                        Organization: {review.organization_id}
                      </Text>
                    </div>
                    <Badge>{formatLabel(review.status)}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                    <Text>Total: {review.order_total} {review.currency_code}</Text>
                    <Text>Release: {release ? formatLabel(release.status) : "Not created"}</Text>
                    <Text>Customer: {order?.email ?? "—"}</Text>
                    <Text>Reviewed: {formatDate(review.reviewed_at)}</Text>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <Heading level="h2">Exceptions</Heading>
            <Text className="text-ui-fg-subtle text-sm">Read-only</Text>
          </div>
          <div className="rounded-lg border border-ui-border-base divide-y divide-ui-border-base">
            {exceptions.length === 0 ? (
              <Text className="p-4 text-ui-fg-subtle">No B2B exceptions returned.</Text>
            ) : (
              exceptions.map((exception) => (
                <div key={exception.reference} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Text className="font-medium">{formatLabel(exception.type)}</Text>
                      <Text className="text-sm text-ui-fg-subtle mt-1">
                        Order: {exception.order_display_id ?? "—"} · Organization: {exception.organization_id ?? "—"}
                      </Text>
                    </div>
                    <Badge>{formatLabel(exception.severity)}</Badge>
                  </div>
                  <Text className="text-sm mt-3">
                    Status: {exception.status ? formatLabel(exception.status) : "—"}
                  </Text>
                  {(exception.reason || exception.note) && (
                    <Text className="text-sm text-ui-fg-subtle mt-1">
                      {exception.reason ?? exception.note}
                    </Text>
                  )}
                  <Text className="text-xs text-ui-fg-subtle mt-3">
                    Available actions: {exception.available_actions?.join(", ") || "None"}. Recovery actions are available where the exception supports them.
                  </Text>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "B2B Operations",
})

export default B2BOperationsPage
