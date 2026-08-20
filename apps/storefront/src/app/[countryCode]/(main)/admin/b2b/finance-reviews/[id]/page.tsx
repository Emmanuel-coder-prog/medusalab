import { retrieveFinanceReview, decideFinanceReview } from "@lib/data/b2b"
import { B2BOrderReleaseStatus } from "@lib/api/types/b2b"
import { notFound } from "next/navigation"
import { Button, Container, Heading, Text } from "@modules/common/components/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import {
  getBlockedReasonLabel,
  getFinanceReviewStatusColor,
  getFinanceReviewStatusLabel,
  getOrderReleaseStatusColor,
  getOrderReleaseStatusDescription,
  getOrderReleaseStatusLabel,
} from "@lib/helpers/b2b-status"

const statusClasses: Record<string, string> = {
  yellow: "bg-yellow-100 text-yellow-800",
  blue: "bg-blue-100 text-blue-800",
  orange: "bg-orange-100 text-orange-800",
  red: "bg-red-100 text-red-800",
  green: "bg-green-100 text-green-800",
  purple: "bg-purple-100 text-purple-800",
  gray: "bg-gray-100 text-gray-800",
}

type Props = {
  params: Promise<{ id: string }>
}

export default async function FinanceReviewDetailPage({ params }: Props) {
  const { id } = await params
  const data = await retrieveFinanceReview(id).catch(() => null)

  if (!data || !data.finance_review) {
    return notFound()
  }

  const { review, order, organization, customer, finance_account, release, payment_terms_obligation } = data.finance_review
  const financeColor = getFinanceReviewStatusColor(review.status)
  const releaseColor = getOrderReleaseStatusColor(
    release?.status ?? B2BOrderReleaseStatus.FINANCE_PENDING
  )
  const releaseDescription = release
    ? getOrderReleaseStatusDescription(release.status)
    : "No warehouse release record exists yet."
  const blockedReason = release?.blocked_reason_code
    ? getBlockedReasonLabel(release.blocked_reason_code)
    : null
  const isReleaseEligible = release?.status === B2BOrderReleaseStatus.ELIGIBLE_FOR_RELEASE
  const isReleased = release?.status === B2BOrderReleaseStatus.RELEASED
  const isBlocked = release?.status === B2BOrderReleaseStatus.BLOCKED

  return (
    <Container className="py-12" data-testid="b2b-finance-review-detail">
      <div className="mb-6 flex items-center justify-between gap-3">
        <LocalizedClientLink href="/admin/b2b/finance-reviews">
          <Button variant="secondary">← Back to queue</Button>
        </LocalizedClientLink>
      </div>

      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Text className="text-xs uppercase tracking-wide text-ui-fg-muted">Finance review</Text>
          <Heading level="h1" className="mt-1">Order {order?.display_id ?? review.order_id}</Heading>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusClasses[financeColor]}`}>
            {getFinanceReviewStatusLabel(review.status)}
          </span>
          {release && (
            <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusClasses[releaseColor]}`}>
              {getOrderReleaseStatusLabel(release.status)}
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-6">
          <div className="rounded-lg border border-gray-200 p-5">
            <Heading level="h3" className="mb-4">Warehouse release gate</Heading>
            <div className="space-y-4">
              <div className="rounded border border-gray-200 bg-gray-50 p-3">
                <Text className="text-sm text-ui-fg-muted">Status</Text>
                <Text className="mt-1 font-medium">{release ? getOrderReleaseStatusLabel(release.status) : "No release record"}</Text>
              </div>
              <div>
                <Text className="text-sm text-ui-fg-muted">Release status detail</Text>
                <Text className="mt-1">{releaseDescription}</Text>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Text className="text-sm text-ui-fg-muted">Release timestamp</Text>
                  <Text className="mt-1 font-medium">{release?.released_at ? new Date(release.released_at).toLocaleString() : "—"}</Text>
                </div>
                <div>
                  <Text className="text-sm text-ui-fg-muted">Backend idempotency key</Text>
                  <Text className="mt-1 font-medium break-all">{release?.release_idempotency_key ?? "—"}</Text>
                </div>
              </div>
              <div>
                <Text className="text-sm text-ui-fg-muted">HubLoft dispatch reference</Text>
                <Text className="mt-1">{release && (isReleased || isReleaseEligible) ? "Managed by backend outbox creation; not created directly from the browser." : "Not available in the storefront yet."}</Text>
              </div>
              {blockedReason && (
                <div className="rounded border border-red-200 bg-red-50 p-3">
                  <Text className="text-sm font-medium text-red-900">Blocked reason</Text>
                  <Text className="mt-1 text-red-800">{blockedReason}{release?.blocked_reason_note ? ` — ${release.blocked_reason_note}` : ""}</Text>
                </div>
              )}
              <div className="rounded border border-blue-200 bg-blue-50 p-3">
                <Text className="font-medium text-blue-900">Release action policy</Text>
                <Text className="mt-1 text-sm text-blue-800">
                  The backend remains responsible for eligibility checks, idempotent outbox creation, and HubLoft handoff. The browser UI only surfaces the operational status and the authorization context.
                </Text>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 p-5">
            <Heading level="h3" className="mb-4">Order info</Heading>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Text className="text-sm text-ui-fg-muted">Order</Text>
                <Text className="mt-1 font-medium">{order?.display_id ?? review.order_id}</Text>
              </div>
              <div>
                <Text className="text-sm text-ui-fg-muted">Organization</Text>
                <Text className="mt-1 font-medium">{organization?.id ?? review.organization_id}</Text>
              </div>
              <div>
                <Text className="text-sm text-ui-fg-muted">Customer</Text>
                <Text className="mt-1 font-medium">{customer?.email ?? order?.customer_id ?? "—"}</Text>
              </div>
              <div>
                <Text className="text-sm text-ui-fg-muted">Currency</Text>
                <Text className="mt-1 font-medium">{review.currency_code}</Text>
              </div>
              <div>
                <Text className="text-sm text-ui-fg-muted">Order total</Text>
                <Text className="mt-1 font-medium">{Number(review.order_total).toFixed(2)}</Text>
              </div>
              <div>
                <Text className="text-sm text-ui-fg-muted">Finance account</Text>
                <Text className="mt-1 font-medium">{finance_account?.id ?? review.finance_account_id ?? "—"}</Text>
              </div>
              <div>
                <Text className="text-sm text-ui-fg-muted">Payment terms</Text>
                <Text className="mt-1 font-medium">{review.payment_terms_code ?? finance_account?.payment_terms_code ?? "—"}</Text>
              </div>
              <div>
                <Text className="text-sm text-ui-fg-muted">Review status</Text>
                <Text className="mt-1 font-medium">{getFinanceReviewStatusLabel(review.status)}</Text>
              </div>
              <div>
                <Text className="text-sm text-ui-fg-muted">Release status</Text>
                <Text className="mt-1 font-medium">{release ? getOrderReleaseStatusLabel(release.status) : "—"}</Text>
              </div>
              <div>
                <Text className="text-sm text-ui-fg-muted">Credit-hold reference</Text>
                <Text className="mt-1 font-medium">{review.external_credit_hold_id ?? "—"}</Text>
              </div>
              <div>
                <Text className="text-sm text-ui-fg-muted">Invoice reference</Text>
                <Text className="mt-1 font-medium">{review.external_invoice_id ?? "—"}</Text>
              </div>
              <div>
                <Text className="text-sm text-ui-fg-muted">Reviewer</Text>
                <Text className="mt-1 font-medium">{review.decision_by_admin_user_id ?? "—"}</Text>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 p-5">
            <Heading level="h3" className="mb-4">Decision details</Heading>
            <div className="space-y-3">
              <div>
                <Text className="text-sm text-ui-fg-muted">Reason code</Text>
                <Text className="mt-1">{review.decision_reason_code ?? "—"}</Text>
              </div>
              <div>
                <Text className="text-sm text-ui-fg-muted">Note</Text>
                <Text className="mt-1">{review.decision_note ?? "—"}</Text>
              </div>
              <div>
                <Text className="text-sm text-ui-fg-muted">Review timestamp</Text>
                <Text className="mt-1">{review.reviewed_at ? new Date(review.reviewed_at).toLocaleString() : "—"}</Text>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-gray-200 p-5">
            <Heading level="h3" className="mb-4">Finance actions</Heading>
            <div className="space-y-3">
              <div className="rounded border border-green-200 bg-green-50 p-3">
                <Text className="font-medium text-green-900">Approved on account</Text>
                <Text className="mt-1 text-sm text-green-800">This means finance approved the order for net terms; it is not marked as paid or shipped.</Text>
              </div>
              <div className="rounded border border-orange-200 bg-orange-50 p-3">
                <Text className="font-medium text-orange-900">Prepayment required</Text>
                <Text className="mt-1 text-sm text-orange-800">Customer must complete payment before release or shipment.</Text>
              </div>
              <div className="rounded border border-red-200 bg-red-50 p-3">
                <Text className="font-medium text-red-900">Rejected</Text>
                <Text className="mt-1 text-sm text-red-800">Finance blocked this order from release.</Text>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 p-5">
            <Heading level="h3" className="mb-4">Release override</Heading>
            <div className="space-y-4">
              <div className="rounded border border-amber-200 bg-amber-50 p-3">
                <Text className="font-medium text-amber-900">Authorization model</Text>
                <Text className="mt-1 text-sm text-amber-800">
                  Only operators with the backend release override role can trigger override processing. The browser never creates HubLoft requests or bypasses the B2BOrderRelease gate.
                </Text>
              </div>
              <div className="rounded border border-gray-200 bg-gray-50 p-3">
                <Text className="text-sm text-ui-fg-muted">Current release status</Text>
                <Text className="mt-1 font-medium">{release ? getOrderReleaseStatusLabel(release.status) : "No release record"}</Text>
              </div>
              <Button
                type="button"
                variant="secondary"
                disabled={!isReleaseEligible && !isBlocked}
                className="w-full"
              >
                {isReleaseEligible ? "Release override available" : isBlocked ? "Override requires backend authorization" : "Not eligible for release override"}
              </Button>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 p-5">
            <Heading level="h3" className="mb-4">Sensitive action</Heading>
            <form action={async (formData) => {
              "use server"
              const decision = formData.get("decision") as string
              const reasonCode = (formData.get("reason_code") as string) || undefined
              const note = (formData.get("note") as string) || undefined

              if (!decision) return
              await decideFinanceReview(id, decision as any, reasonCode, note)
            }} className="space-y-3">
              <div>
                <Text className="text-sm text-ui-fg-muted">Reason code</Text>
                <input name="reason_code" className="mt-1 w-full rounded border border-gray-200 px-3 py-2" placeholder="e.g. credit_review" />
              </div>
              <div>
                <Text className="text-sm text-ui-fg-muted">Optional note</Text>
                <textarea name="note" rows={3} className="mt-1 w-full rounded border border-gray-200 px-3 py-2" placeholder="Describe the approval reason or risk context." />
              </div>
              <div className="space-y-2">
                <Button type="submit" name="decision" value="approved_on_account" variant="primary" className="w-full">Approve on account</Button>
                <Button type="submit" name="decision" value="prepayment_required" variant="secondary" className="w-full">Require prepayment</Button>
                <Button type="submit" name="decision" value="rejected" variant="secondary" className="w-full">Reject</Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Container>
  )
}
