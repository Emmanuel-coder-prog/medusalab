import {
  listB2BOrganizations,
  listFinanceReviews,
  listB2BAuditEvents,
  listB2BExceptions,
  retrieveFinanceReview,
} from "@lib/data/b2b"
import { listB2BQuoteQueue } from "@lib/data/b2b-admin"
import {
  B2BFinanceReviewStatus,
  B2BOrderReleaseStatus,
  B2BOrganizationStatus,
  B2BPurchaseRequestStatus,
} from "@lib/api/types/b2b"
import { Button, Container, Heading, Text } from "@modules/common/components/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type QueueCardProps = {
  title: string
  count: number
  href: string
  tone?: "green" | "blue" | "orange" | "red" | "purple" | "gray"
  detail: string
}

const toneClasses: Record<NonNullable<QueueCardProps["tone"]>, string> = {
  green: "bg-green-50 border-green-200 text-green-900",
  blue: "bg-blue-50 border-blue-200 text-blue-900",
  orange: "bg-orange-50 border-orange-200 text-orange-900",
  red: "bg-red-50 border-red-200 text-red-900",
  purple: "bg-purple-50 border-purple-200 text-purple-900",
  gray: "bg-gray-50 border-gray-200 text-gray-900",
}

function QueueCard({ title, count, href, tone = "blue", detail }: QueueCardProps) {
  return (
    <LocalizedClientLink href={href}>
      <div className={`rounded-lg border p-4 transition hover:border-gray-300 ${toneClasses[tone]}`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <Text className="text-sm font-medium">{title}</Text>
            <Text className="mt-2 text-3xl font-semibold leading-none">{count}</Text>
          </div>
          <Button variant="secondary" size="small">Open</Button>
        </div>
        <Text className="mt-3 text-xs opacity-80">{detail}</Text>
      </div>
    </LocalizedClientLink>
  )
}

export const metadata = {
  title: "B2B Operations Dashboard",
  description: "Operational queue overview for B2B organizations, purchase requests, finance, and warehouse release workflows.",
}

export default async function B2BOperationsDashboardPage() {
  const organizations = await listB2BOrganizations().catch(() => [])
  const quoteQueue = await listB2BQuoteQueue().catch(() => ({ purchase_requests: [], total: 0 }))
  const financeQueue = await listFinanceReviews().catch(() => ({ finance_reviews: [], total: 0 }))
  const activityFeed = await listB2BAuditEvents({ take: 1 }).catch(() => ({ audit_events: [], count: 0, total: 0 }))
  const exceptionsData = await listB2BExceptions().catch(() => ({ exceptions: [], total: 0, summary: { critical: 0, warning: 0 } }))

  const pendingReviews = financeQueue.finance_reviews || []
  const detailedFinanceReviews = await Promise.all(
    pendingReviews.map((entry) => retrieveFinanceReview(entry.review.id).catch(() => null))
  )

  const organizationCounts = {
    active: organizations.filter((org) => org.status === B2BOrganizationStatus.ACTIVE).length,
    pending: organizations.filter((org) => org.status === B2BOrganizationStatus.PENDING).length,
    suspended: organizations.filter((org) => org.status === B2BOrganizationStatus.SUSPENDED).length,
  }

  const purchaseCounts = {
    awaiting_approval: (quoteQueue.purchase_requests || []).filter(
      (request) => request.status === B2BPurchaseRequestStatus.PENDING_INTERNAL_APPROVAL
    ).length,
    awaiting_merchant_quote: (quoteQueue.purchase_requests || []).filter(
      (request) => request.status === B2BPurchaseRequestStatus.PENDING_MERCHANT_QUOTE
    ).length,
    awaiting_buyer_acceptance: (quoteQueue.purchase_requests || []).filter(
      (request) => request.status === B2BPurchaseRequestStatus.PENDING_BUYER_ACCEPTANCE
    ).length,
    expired: (quoteQueue.purchase_requests || []).filter(
      (request) => request.status === B2BPurchaseRequestStatus.EXPIRED
    ).length,
    rejected: (quoteQueue.purchase_requests || []).filter(
      (request) => request.status === B2BPurchaseRequestStatus.REJECTED
    ).length,
  }

  const financeCounts = {
    pending_review: (pendingReviews || []).filter(
      (entry) => entry.review.status === B2BFinanceReviewStatus.PENDING
    ).length,
    prepayment_required: (pendingReviews || []).filter(
      (entry) => entry.review.status === B2BFinanceReviewStatus.PREPAYMENT_REQUIRED
    ).length,
    approved_on_account: (pendingReviews || []).filter(
      (entry) => entry.review.status === B2BFinanceReviewStatus.APPROVED_ON_ACCOUNT
    ).length,
    rejected: (pendingReviews || []).filter(
      (entry) => entry.review.status === B2BFinanceReviewStatus.REJECTED
    ).length,
    overdue_obligations: detailedFinanceReviews.filter(
      (detail) => detail?.finance_review?.payment_terms_obligation?.status === "overdue"
    ).length,
  }

  const releaseCounts = {
    finance_pending: (pendingReviews || []).filter(
      (entry) => entry.release?.status === B2BOrderReleaseStatus.FINANCE_PENDING
    ).length,
    eligible_for_release: (pendingReviews || []).filter(
      (entry) => entry.release?.status === B2BOrderReleaseStatus.ELIGIBLE_FOR_RELEASE
    ).length,
    blocked: (pendingReviews || []).filter(
      (entry) => entry.release?.status === B2BOrderReleaseStatus.BLOCKED
    ).length,
    released: (pendingReviews || []).filter(
      (entry) => entry.release?.status === B2BOrderReleaseStatus.RELEASED
    ).length,
    hubloft_dispatch_pending: 0,
  }

  const sections = [
    {
      title: "Organizations",
      href: "/account/b2b/organizations",
      cards: [
        { title: "Active organizations", count: organizationCounts.active, href: "/account/b2b/organizations", tone: "green" as const, detail: "Active buying organizations" },
        { title: "Pending organizations", count: organizationCounts.pending, href: "/account/b2b/organizations", tone: "orange" as const, detail: "Waiting to be approved" },
        { title: "Suspended organizations", count: organizationCounts.suspended, href: "/account/b2b/organizations", tone: "red" as const, detail: "Blocked or suspended" },
      ],
    },
    {
      title: "Purchase requests",
      href: "/admin/b2b/quotes",
      cards: [
        { title: "Awaiting approval", count: purchaseCounts.awaiting_approval, href: "/admin/b2b/quotes", tone: "orange" as const, detail: "Internal approval queue" },
        { title: "Awaiting merchant quote", count: purchaseCounts.awaiting_merchant_quote, href: "/admin/b2b/quotes", tone: "blue" as const, detail: "Quote work remaining" },
        { title: "Awaiting buyer acceptance", count: purchaseCounts.awaiting_buyer_acceptance, href: "/admin/b2b/quotes", tone: "purple" as const, detail: "Buyer review pending" },
        { title: "Expired", count: purchaseCounts.expired, href: "/admin/b2b/quotes", tone: "gray" as const, detail: "Requests that expired without action" },
        { title: "Rejected", count: purchaseCounts.rejected, href: "/admin/b2b/quotes", tone: "red" as const, detail: "Rejected purchase requests" },
      ],
    },
    {
      title: "Finance",
      href: "/admin/b2b/finance-reviews",
      cards: [
        { title: "Pending finance review", count: financeCounts.pending_review, href: "/admin/b2b/finance-reviews", tone: "blue" as const, detail: "Waiting for approval" },
        { title: "Prepayment required", count: financeCounts.prepayment_required, href: "/admin/b2b/finance-reviews", tone: "orange" as const, detail: "Payment must be completed" },
        { title: "Approved on account", count: financeCounts.approved_on_account, href: "/admin/b2b/finance-reviews", tone: "green" as const, detail: "Net terms approved" },
        { title: "Rejected", count: financeCounts.rejected, href: "/admin/b2b/finance-reviews", tone: "red" as const, detail: "Finance rejected" },
        { title: "Overdue obligations", count: financeCounts.overdue_obligations, href: "/admin/b2b/finance-reviews", tone: "red" as const, detail: "Outstanding overdue payment obligations" },
      ],
    },
    {
      title: "Warehouse",
      href: "/admin/b2b/finance-reviews",
      cards: [
        { title: "Finance pending", count: releaseCounts.finance_pending, href: "/admin/b2b/finance-reviews", tone: "gray" as const, detail: "Release record not yet eligible" },
        { title: "Eligible for release", count: releaseCounts.eligible_for_release, href: "/admin/b2b/finance-reviews", tone: "green" as const, detail: "Finance cleared and ready" },
        { title: "Blocked", count: releaseCounts.blocked, href: "/admin/b2b/finance-reviews", tone: "red" as const, detail: "Release blocked by finance or policy" },
        { title: "Released", count: releaseCounts.released, href: "/admin/b2b/finance-reviews", tone: "blue" as const, detail: "Release has been recorded" },
        { title: "HubLoft dispatch pending", count: releaseCounts.hubloft_dispatch_pending, href: "/admin/b2b/finance-reviews", tone: "orange" as const, detail: "No pending outbox records exposed by the current API surface" },
      ],
    },
    {
      title: "Exceptions & Reconciliation",
      href: "/admin/b2b/exceptions",
      cards: [
        { title: "Operational issues", count: exceptionsData.total, href: "/admin/b2b/exceptions", tone: exceptionsData.summary.critical > 0 ? ("red" as const) : ("orange" as const), detail: "Pending reviews, failed dispatch, blocked orders, overdue payments" },
      ],
    },
    {
      title: "Audit activity",
      href: "/admin/b2b/activity",
      cards: [
        { title: "Recorded events", count: activityFeed.total, href: "/admin/b2b/activity", tone: "purple" as const, detail: "Append-only B2B actions captured by the backend audit log" },
      ],
    },
  ]

  return (
    <Container className="py-12" data-testid="b2b-operations-dashboard">
      <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <Heading level="h1">B2B operations dashboard</Heading>
          <Text className="mt-2 text-ui-fg-muted">
            Aggregated operational work queues across organizations, purchasing, finance, and warehouse release.
          </Text>
        </div>
        <LocalizedClientLink href="/account/profile">
          <Button variant="secondary">Back to account</Button>
        </LocalizedClientLink>
      </div>

      <div className="space-y-8">
        {sections.map((section) => (
          <section key={section.title}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <Heading level="h2" className="text-xl">{section.title}</Heading>
              <LocalizedClientLink href={section.href}>
                <Button variant="secondary" size="small">Open queue</Button>
              </LocalizedClientLink>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {section.cards.map((card) => (
                <QueueCard
                  key={card.title}
                  title={card.title}
                  count={card.count}
                  href={card.href}
                  tone={card.tone}
                  detail={card.detail}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </Container>
  )
}
