import { listPurchaseRequestsForApproval } from "@lib/data/b2b"
import { getPurchaseRequestStatusColor, getPurchaseRequestStatusLabel } from "@lib/helpers/b2b-status"
import { notFound } from "next/navigation"
import { Container, Heading, Text, Button } from "@modules/common/components/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { B2BPurchaseRequestStatus } from "@lib/api/types/b2b"

export const metadata = {
  title: "My Quotes",
  description: "Review merchant quotes awaiting your acceptance",
}

export default async function QuotesListPage() {
  const requests = await listPurchaseRequestsForApproval().catch(() => [])

  // Filter to only PENDING_BUYER_ACCEPTANCE (buyer's quotes)
  const quotes = requests.filter(r => r.status === B2BPurchaseRequestStatus.PENDING_BUYER_ACCEPTANCE)

  return (
    <Container className="py-12" data-testid="b2b-quotes-list">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <Heading level="h1">My Quotes</Heading>
          <Text className="text-ui-fg-muted mt-2">
            Review and accept merchant quotes for your purchase requests.
          </Text>
        </div>
        <LocalizedClientLink href="/account/b2b/organizations">
          <Button variant="secondary">Organizations</Button>
        </LocalizedClientLink>
      </div>

      {quotes.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-200 p-8 text-center">
          <Text className="text-ui-fg-muted">
            You have no quotes waiting for acceptance.
          </Text>
        </div>
      ) : (
        <div className="space-y-4">
          {quotes.map((quote) => {
            const color = getPurchaseRequestStatusColor(quote.status)
            const statusClasses: Record<string, string> = {
              yellow: "bg-yellow-100 text-yellow-800",
              blue: "bg-blue-100 text-blue-800",
              orange: "bg-orange-100 text-orange-800",
              red: "bg-red-100 text-red-800",
              green: "bg-green-100 text-green-800",
              gray: "bg-gray-100 text-gray-800",
            }

            const isExpired = quote.expires_at && new Date(quote.expires_at) < new Date()
            const total = quote.requested_total ? Number(quote.requested_total).toFixed(2) : "—"

            return (
              <div key={quote.id} className="rounded-lg border border-gray-200 p-4" data-testid="quote-item">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <Text className="text-xs uppercase tracking-wide text-ui-fg-muted">
                      {quote.reference || quote.id}
                    </Text>
                    <Heading level="h3" className="mt-1">
                      {quote.organization_id}
                    </Heading>
                  </div>
                  <div className="flex items-center gap-2">
                    {isExpired && (
                      <span className="inline-flex rounded-full px-2 py-1 text-xs font-medium bg-red-100 text-red-800">
                        Expired
                      </span>
                    )}
                    {!isExpired && (
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusClasses[color]}`}>
                        {getPurchaseRequestStatusLabel(quote.status)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <div>
                    <Text className="text-ui-fg-muted text-sm">Quote Total</Text>
                    <Text className="mt-1">{quote.currency_code?.toUpperCase()} {total}</Text>
                  </div>
                  <div>
                    <Text className="text-ui-fg-muted text-sm">Submitted</Text>
                    <Text className="mt-1">{quote.submitted_at ? new Date(quote.submitted_at).toLocaleDateString() : "—"}</Text>
                  </div>
                  <div>
                    <Text className="text-ui-fg-muted text-sm">Expires</Text>
                    <Text className={`mt-1 ${isExpired ? "text-red-600 font-medium" : ""}`}>
                      {quote.expires_at ? new Date(quote.expires_at).toLocaleDateString() : "—"}
                    </Text>
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <LocalizedClientLink href={`/account/b2b/quotes/${quote.id}`}>
                    <Button variant="secondary">Review Quote</Button>
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
