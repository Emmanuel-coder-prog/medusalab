import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { B2B_FINANCE_MODULE } from "../../../../modules/b2b-finance"
import B2BFinanceModuleService from "../../../../modules/b2b-finance/service"

import {
  B2BFinanceReviewStatus,
  B2BOrderReleaseStatus,
  B2BPaymentTermsStatus,
} from "../../../../modules/b2b-finance/types"

import { HUBLOFT_MODULE } from "../../../../modules/hubloft"
import HubLoftModuleService from "../../../../modules/hubloft/service"

import { HubLoftFulfillmentOutboxStatus } from "../../../../modules/hubloft/types"
import { B2B_AUDIT_MODULE } from "../../../../modules/b2b-audit"
import B2BAuditModuleService from "../../../../modules/b2b-audit/service"

/**
 * GET /admin/b2b/exceptions
 *
 * Aggregated view of operational exceptions across B2B workflows:
 * - Finance reviews pending too long
 * - Expired finance reviews
 * - Overdue payment obligations
 * - Eligible releases not yet dispatched
 * - Blocked orders
 * - Failed ERP/warehouse handoffs
 */
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const financeService = req.scope.resolve<B2BFinanceModuleService>(
    B2B_FINANCE_MODULE
  )
  const hubloftService = req.scope.resolve<HubLoftModuleService>(
    HUBLOFT_MODULE
  )
  const auditService = req.scope.resolve<B2BAuditModuleService>(B2B_AUDIT_MODULE)
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const now = new Date()
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const exceptions: any[] = []

  try {
    // 1. Finance reviews pending too long (over 7 days)
    const pendingReviews = await financeService.listB2BOrderFinanceReviews({
      status: B2BFinanceReviewStatus.PENDING,
    })

    const pendingTooLong = pendingReviews.filter((review) => {
      const createdAt = new Date(review.created_at)
      return createdAt < weekAgo
    })

    for (const review of pendingTooLong) {
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
                "customer.*",
              ],
              filters: { id: review.order_id },
            })
          ).data[0] ?? null
        : null

      exceptions.push({
        type: "finance_pending_too_long",
        severity: "warning",
        order_id: review.order_id,
        order_display_id: order?.display_id,
        organization_id: review.organization_id,
        customer_email: order?.customer?.email,
        status: review.status,
        created_at: review.created_at,
        days_pending: Math.floor(
          (now.getTime() - new Date(review.created_at).getTime()) /
            (24 * 60 * 60 * 1000)
        ),
        reference: review.id,
        available_actions: ["open_record"],
      })
    }

    // 2. Expired finance reviews (moved to MANUAL_REVIEW)
    const manualReviews = await financeService.listB2BOrderFinanceReviews({
      status: B2BFinanceReviewStatus.MANUAL_REVIEW,
      decision_reason_code: "review_expired",
    })

    for (const review of manualReviews) {
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
                "customer.*",
              ],
              filters: { id: review.order_id },
            })
          ).data[0] ?? null
        : null

      exceptions.push({
        type: "finance_review_expired",
        severity: "critical",
        order_id: review.order_id,
        order_display_id: order?.display_id,
        organization_id: review.organization_id,
        customer_email: order?.customer?.email,
        status: review.status,
        reason: "Review exceeded allowed window",
        expired_at: review.valid_until,
        note: review.decision_note,
        reference: review.id,
        available_actions: ["open_record", "escalate"],
      })
    }

    // 3. Overdue payment obligations
    const overdueObligations =
      await financeService.listB2BPaymentTermsObligations({
        status: B2BPaymentTermsStatus.OVERDUE,
      })

    for (const obligation of overdueObligations) {
      const order = obligation.order_id
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
                "customer.*",
              ],
              filters: { id: obligation.order_id },
            })
          ).data[0] ?? null
        : null

      exceptions.push({
        type: "overdue_payment_obligation",
        severity: "critical",
        order_id: obligation.order_id,
        order_display_id: order?.display_id,
        organization_id: obligation.finance_review_id ? (await financeService.retrieveB2BOrderFinanceReview(obligation.finance_review_id))?.organization_id : undefined,
        customer_email: order?.customer?.email,
        amount: obligation.amount_due,
        currency: obligation.currency_code,
        due_at: obligation.due_at,
        days_overdue: Math.floor(
          (now.getTime() - new Date(obligation.due_at).getTime()) /
            (24 * 60 * 60 * 1000)
        ),
        reference: obligation.id,
        available_actions: ["open_record", "escalate"],
      })
    }

    // 4. Blocked orders (release blocked)
    const blockedReleases = await financeService.listB2BOrderReleases({
      status: B2BOrderReleaseStatus.BLOCKED,
    })

    for (const release of blockedReleases) {
      const order = release.order_id
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
                "customer.*",
              ],
              filters: { id: release.order_id },
            })
          ).data[0] ?? null
        : null

      exceptions.push({
        type: "blocked_order_release",
        severity: "warning",
        order_id: release.order_id,
        order_display_id: order?.display_id,
        organization_id: (await financeService.retrieveB2BOrderFinanceReview(release.finance_review_id))?.organization_id,
        customer_email: order?.customer?.email,
        reason: release.blocked_reason_code,
        note: release.blocked_reason_note,
        blocked_at: release.blocked_at,
        reference: release.id,
        available_actions: ["open_record", "override"],
      })
    }

    // 5. Eligible releases not yet dispatched
    const eligibleReleases = await financeService.listB2BOrderReleases({
      status: B2BOrderReleaseStatus.ELIGIBLE_FOR_RELEASE,
    })

    for (const release of eligibleReleases) {
      // Check if fulfillment outbox exists for this order
      const outboxes = await hubloftService.listFulfillmentOutboxes({
        order_id: release.order_id,
      })

      const outbox = outboxes?.[0]

      // If no outbox or outbox is stuck, this is an exception
      if (!outbox || (outbox && outbox.status === HubLoftFulfillmentOutboxStatus.PENDING)) {
        const order = release.order_id
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
                  "customer.*",
                ],
                filters: { id: release.order_id },
              })
            ).data[0] ?? null
          : null

        exceptions.push({
          type: "release_not_dispatched",
          severity: "warning",
          order_id: release.order_id,
          order_display_id: order?.display_id,
          organization_id: (await financeService.retrieveB2BOrderFinanceReview(release.finance_review_id))?.organization_id,
          customer_email: order?.customer?.email,
          status: release.status,
          outbox_status: outbox?.status || "missing",
          eligible_since: release.created_at,
          days_eligible: Math.floor(
            (now.getTime() - new Date(release.created_at).getTime()) /
              (24 * 60 * 60 * 1000)
          ),
          reference: outbox?.id || release.id,
          available_actions: outbox ? ["open_record", "retry"] : ["open_record"],
        })
      }
    }

    // 6. Failed/retryable warehouse handoffs
    const failedOutboxes = await hubloftService.listFulfillmentOutboxes({
      status: HubLoftFulfillmentOutboxStatus.FAILED,
    })
    const manualOutboxes = await hubloftService.listFulfillmentOutboxes({
      status: HubLoftFulfillmentOutboxStatus.MANUAL_REVIEW,
    })

    const allFailedOutboxes = [...(failedOutboxes || []), ...(manualOutboxes || [])]

    for (const outbox of allFailedOutboxes) {
      const order = outbox.order_id
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
                "customer.*",
              ],
              filters: { id: outbox.order_id },
            })
          ).data[0] ?? null
        : null

      exceptions.push({
        type: "warehouse_dispatch_failed",
        severity: "critical",
        order_id: outbox.order_id,
        order_display_id: order?.display_id,
        customer_email: order?.customer?.email,
        status: outbox.status,
        attempts: outbox.attempts || 0,
        last_error: outbox.last_error,
        failed_at: outbox.failed_at,
        reference: outbox.id,
        available_actions: ["open_record", "retry"],
      })
    }

    const snoozes = await auditService.listB2BAuditEvents({
      action: "b2b.exception.snoozed",
      entity_type: "b2b_exception",
    })
    const snoozedUntilByReference = new Map(
      snoozes.map((event) => [event.entity_id, event.note?.match(/Snoozed until (.+)$/)?.[1]])
    )
    const visibleExceptions = exceptions.filter((exception) => {
      const snoozedUntil = snoozedUntilByReference.get(exception.reference)
      return !snoozedUntil || new Date(snoozedUntil).getTime() <= now.getTime()
    })

    return res.json({
      exceptions: visibleExceptions.sort(
        (a, b) =>
          (b.created_at || b.failed_at || b.due_at ? new Date(b.created_at || b.failed_at || b.due_at).getTime() : 0) -
          (a.created_at || a.failed_at || a.due_at ? new Date(a.created_at || a.failed_at || a.due_at).getTime() : 0)
      ),
      total: visibleExceptions.length,
      summary: {
        critical: visibleExceptions.filter((e) => e.severity === "critical").length,
        warning: visibleExceptions.filter((e) => e.severity === "warning").length,
      },
    })
  } catch (error) {
    console.error("Error fetching B2B exceptions:", error)
    return res.status(500).json({ error: "Failed to fetch exceptions" })
  }
}
