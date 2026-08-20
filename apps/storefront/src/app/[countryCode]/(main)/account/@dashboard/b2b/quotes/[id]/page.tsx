import { listB2BOrganizations, retrieveQuoteForBuyer } from "@lib/data/b2b"
import { getPurchaseRequestStatusColor, getPurchaseRequestStatusLabel } from "@lib/helpers/b2b-status"
import { notFound } from "next/navigation"
import { Container, Heading, Text, Button } from "@modules/common/components/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import QuoteAcceptanceActions from "@modules/b2b/components/quote-acceptance-actions"
import { B2BPurchaseRequestStatus } from "@lib/api/types/b2b"

type Props = {
  params: Promise<{ id: string }>
}

export const metadata = {
  title: "Quote Review",
  description: "Review and accept merchant quote",
}

export default async function QuoteDetailPage({ params }: Props) {
  const { id } = await params

  const organizations = await listB2BOrganizations().catch(() => [])

  if (!organizations.length) {
    notFound()
  }

  const quote = await retrieveQuoteForBuyer(id).catch(() => null)

  if (!quote) {
    return (
      <Container className="py-12" data-testid="b2b-quote-not-found">
        <LocalizedClientLink href="/account/b2b/organizations">
          <Button variant="secondary" className="mb-4">← Back to account</Button>
        </LocalizedClientLink>
        <Heading level="h1">Quote not found</Heading>
        <Text className="mt-3 text-ui-fg-muted">This quote is not available or has been removed.</Text>
      </Container>
    )
  }

  const { purchase_request, approval_history } = quote
  const isExpired = purchase_request.expires_at && new Date(purchase_request.expires_at) < new Date()
  const isConverted = purchase_request.status === B2BPurchaseRequestStatus.CONVERTED
  const isPendingAcceptance = purchase_request.status === B2BPurchaseRequestStatus.PENDING_BUYER_ACCEPTANCE

  const color = getPurchaseRequestStatusColor(purchase_request.status)
  const statusClasses: Record<string, string> = {
    yellow: "bg-yellow-100 text-yellow-800",
    blue: "bg-blue-100 text-blue-800",
    orange: "bg-orange-100 text-orange-800",
    red: "bg-red-100 text-red-800",
    green: "bg-green-100 text-green-800",
    gray: "bg-gray-100 text-gray-800",
  }

  const items = purchase_request.cart_snapshot?.items || []
  const total = purchase_request.requested_total || 0
  const currencyCode = purchase_request.currency_code?.toUpperCase() || "USD"

  return (
    <Container className="py-12" data-testid="b2b-quote-detail">
      <LocalizedClientLink href="/account/b2b/organizations" className="mb-4 inline-flex">
        <Button variant="secondary">← Back to account</Button>
      </LocalizedClientLink>

      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Text className="text-xs uppercase tracking-wide text-ui-fg-muted">Quote</Text>
          <Heading level="h1" className="mt-1">
            {purchase_request.reference || purchase_request.id}
          </Heading>
        </div>
        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusClasses[color]}`}>
          {getPurchaseRequestStatusLabel(purchase_request.status)}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-6">
          {/* Quote Expired Warning */}
          {isExpired && !isConverted && (
            <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
              <Text className="font-medium text-orange-900">Quote Expired</Text>
              <Text className="mt-1 text-sm text-orange-800">
                This quote expired on {new Date(purchase_request.expires_at!).toLocaleDateString()}
              </Text>
            </div>
          )}

          {/* Quote Items */}
          <div className="rounded-lg border border-gray-200 p-5">
            <Heading level="h3" className="mb-4">Items</Heading>
            <div className="space-y-3">
              {items.length > 0 ? (
                items.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                    <div>
                      <Text className="font-medium">{item.title}</Text>
                      <Text className="text-xs text-ui-fg-muted">Qty: {item.quantity}</Text>
                    </div>
                    <Text className="font-medium">
                      {item.unit_price ? `${currencyCode} ${Number(item.unit_price).toFixed(2)}` : "—"}
                    </Text>
                  </div>
                ))
              ) : (
                <Text className="text-ui-fg-muted">No items in quote</Text>
              )}
            </div>
          </div>

          {/* Pricing Summary */}
          <div className="rounded-lg border border-gray-200 p-5">
            <Heading level="h3" className="mb-4">Pricing</Heading>
            <div className="space-y-2">
              <div className="flex justify-between">
                <Text className="text-ui-fg-muted">Total Amount</Text>
                <Text className="font-medium">
                  {currencyCode} {Number(total).toFixed(2)}
                </Text>
              </div>
              {purchase_request.currency_code && (
                <div className="flex justify-between">
                  <Text className="text-ui-fg-muted">Currency</Text>
                  <Text className="font-medium">{purchase_request.currency_code.toUpperCase()}</Text>
                </div>
              )}
            </div>
          </div>

          {/* Quote Details */}
          <div className="rounded-lg border border-gray-200 p-5">
            <Heading level="h3" className="mb-4">Quote Details</Heading>
            <div className="space-y-3">
              {purchase_request.purchase_order_number && (
                <div>
                  <Text className="text-ui-fg-muted text-sm">Purchase Order Number</Text>
                  <Text className="mt-1 font-medium">{purchase_request.purchase_order_number}</Text>
                </div>
              )}
              {purchase_request.submitted_at && (
                <div>
                  <Text className="text-ui-fg-muted text-sm">Submitted</Text>
                  <Text className="mt-1">
                    {new Date(purchase_request.submitted_at).toLocaleString()}
                  </Text>
                </div>
              )}
              {purchase_request.expires_at && (
                <div>
                  <Text className="text-ui-fg-muted text-sm">Expires</Text>
                  <Text className={`mt-1 ${isExpired ? "text-orange-600 font-medium" : ""}`}>
                    {new Date(purchase_request.expires_at).toLocaleString()}
                  </Text>
                </div>
              )}
            </div>
          </div>

          {/* Accept/Already Converted Section */}
          {isPendingAcceptance && !isExpired && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-5">
              <Heading level="h3" className="mb-3 text-green-900">Ready to Accept?</Heading>
              <Text className="mb-4 text-sm text-green-800">
                Review the quote details above. Clicking "Accept Quote" will create a commercial order.
              </Text>
              <QuoteAcceptanceActions purchaseRequestId={purchase_request.id} />
            </div>
          )}

          {isConverted && purchase_request.order_id && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-5">
              <Heading level="h3" className="mb-3 text-green-900">Quote Accepted ✓</Heading>
              <Text className="mb-3 text-sm text-green-800">
                Your quote has been accepted. A commercial order has been created.
              </Text>
              <div className="rounded border border-green-300 bg-white p-3">
                <Text className="text-xs text-ui-fg-muted">Order ID</Text>
                <Text className="mt-1 font-mono font-medium">{purchase_request.order_id}</Text>
              </div>
              <Text className="mt-3 text-sm text-green-800">
                This order will proceed through finance review and warehouse processing.
              </Text>
            </div>
          )}

          {isExpired && !isConverted && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-5">
              <Heading level="h3" className="mb-3 text-red-900">Quote Cannot Be Accepted</Heading>
              <Text className="text-sm text-red-800">
                This quote has expired and is no longer available for acceptance.
              </Text>
            </div>
          )}
        </div>

        {/* Approval History Sidebar */}
        <div className="rounded-lg border border-gray-200 p-5">
          <Heading level="h3" className="mb-4">History</Heading>
          {approval_history && approval_history.length > 0 ? (
            <div className="space-y-3">
              {approval_history.map((entry: any) => (
                <div key={entry.id} className="rounded border border-gray-200 bg-gray-50 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <Text className="font-medium text-sm">
                      {entry.decision === "approved" ? "Approved" : "Rejected"}
                    </Text>
                    <Text className="text-xs text-ui-fg-muted">
                      {entry.decided_at ? new Date(entry.decided_at).toLocaleDateString() : "—"}
                    </Text>
                  </div>
                  {entry.note && (
                    <Text className="mt-2 text-xs text-ui-fg-muted">{entry.note}</Text>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <Text className="text-ui-fg-muted text-sm">No approval history yet.</Text>
          )}
        </div>
      </div>
    </Container>
  )
}
