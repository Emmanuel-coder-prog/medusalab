import crypto from "node:crypto"
import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { B2B_FINANCE_MODULE } from "../../../../modules/b2b-finance"
import B2BFinanceModuleService from "../../../../modules/b2b-finance/service"
import { B2BFinanceOperatorRole, B2BOrderReleaseStatus, B2BFinanceReviewStatus } from "../../../../modules/b2b-finance/types"
import { B2B_AUDIT_MODULE } from "../../../../modules/b2b-audit"
import B2BAuditModuleService from "../../../../modules/b2b-audit/service"
import { B2BAuditActorType, B2BAuditOutcome } from "../../../../modules/b2b-audit/types"
import { HUBLOFT_MODULE } from "../../../../modules/hubloft"
import HubLoftModuleService from "../../../../modules/hubloft/service"
import { HubLoftFulfillmentOutboxStatus } from "../../../../modules/hubloft/types"

const requireOperator = async (service: B2BFinanceModuleService, adminUserId: string, roles: B2BFinanceOperatorRole[]) => {
  const operators = await service.listB2BFinanceOperators({ admin_user_id: adminUserId, active: true })
  if (!operators[0] || !roles.includes(operators[0].role)) {
    throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "This recovery action is not authorized for the current operator.")
  }
}

const recordRecoveryAudit = async (req: AuthenticatedMedusaRequest, action: string, entityType: string, entityId: string, note?: string) => {
  const audit = req.scope.resolve<B2BAuditModuleService>(B2B_AUDIT_MODULE)
  return audit.createB2BAuditEvents({
    event_id: crypto.randomUUID(),
    action,
    outcome: B2BAuditOutcome.SUCCESS,
    entity_type: entityType,
    entity_id: entityId,
    actor_type: B2BAuditActorType.ADMIN,
    actor_id: req.auth_context.actor_id,
    note: note ?? null,
    occurred_at: new Date(),
  })
}

export const POST = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const body = req.body as Record<string, unknown>
  const action = String(body.action ?? "")
  const entityId = String(body.entity_id ?? "")
  const adminUserId = req.auth_context.actor_id
  if (!action || !entityId) throw new MedusaError(MedusaError.Types.INVALID_DATA, "action and entity_id are required.")

  const finance = req.scope.resolve<B2BFinanceModuleService>(B2B_FINANCE_MODULE)

  if (action === "retry_fulfillment" || action === "requeue_fulfillment") {
    await requireOperator(finance, adminUserId, [B2BFinanceOperatorRole.APPROVER, B2BFinanceOperatorRole.RELEASE_OVERRIDE])
    const hubloft = req.scope.resolve<HubLoftModuleService>(HUBLOFT_MODULE)
    const outbox = await hubloft.retrieveFulfillmentOutbox(entityId)
    if (!outbox) throw new MedusaError(MedusaError.Types.NOT_FOUND, "Fulfillment outbox not found.")
    if (![HubLoftFulfillmentOutboxStatus.FAILED, HubLoftFulfillmentOutboxStatus.MANUAL_REVIEW, HubLoftFulfillmentOutboxStatus.PENDING].includes(outbox.status)) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "This fulfillment outbox cannot be retried from its current state.")
    }
    const updated = await hubloft.updateFulfillmentOutboxes({ id: entityId, status: HubLoftFulfillmentOutboxStatus.PENDING, attempts: outbox.attempts + 1, last_error: null, failed_at: null })
    await recordRecoveryAudit(req, `b2b.fulfillment.${action}`, "hubloft_fulfillment_outbox", entityId)
    return res.json({ fulfillment_outbox: updated })
  }

  if (action === "override_release") {
    await requireOperator(finance, adminUserId, [B2BFinanceOperatorRole.RELEASE_OVERRIDE])
    const release = await finance.retrieveB2BOrderRelease(entityId)
    if (!release) throw new MedusaError(MedusaError.Types.NOT_FOUND, "Order release not found.")
    if (release.status !== B2BOrderReleaseStatus.BLOCKED) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Only blocked releases can be overridden.")
    const updated = await finance.updateB2BOrderReleases({ id: entityId, status: B2BOrderReleaseStatus.ELIGIBLE_FOR_RELEASE, blocked_reason_code: null, blocked_reason_note: null })
    await recordRecoveryAudit(req, "b2b.order_release.overridden", "b2b_order_release", entityId, String(body.note ?? "Release override"))
    return res.json({ release: updated })
  }

  if (action === "escalate_finance") {
    await requireOperator(finance, adminUserId, [B2BFinanceOperatorRole.APPROVER, B2BFinanceOperatorRole.RELEASE_OVERRIDE])
    const review = await finance.retrieveB2BOrderFinanceReview(entityId)
    if (!review) throw new MedusaError(MedusaError.Types.NOT_FOUND, "Finance review not found.")
    if (![B2BFinanceReviewStatus.PENDING, B2BFinanceReviewStatus.MANUAL_REVIEW].includes(review.status)) throw new MedusaError(MedusaError.Types.INVALID_DATA, "This finance review cannot be escalated.")
    const updated = await finance.updateB2BOrderFinanceReviews({ id: entityId, status: B2BFinanceReviewStatus.MANUAL_REVIEW, decision_reason_code: "operations_escalation", decision_note: String(body.note ?? "Escalated by operations") })
    await recordRecoveryAudit(req, "b2b.finance_review.escalated", "b2b_order_finance_review", entityId, String(body.note ?? "Escalated by operations"))
    return res.json({ review: updated })
  }

  if (action === "acknowledge_exception") {
    await requireOperator(finance, adminUserId, [B2BFinanceOperatorRole.VIEWER, B2BFinanceOperatorRole.APPROVER, B2BFinanceOperatorRole.RELEASE_OVERRIDE])
    await recordRecoveryAudit(req, "b2b.exception.acknowledged", "b2b_exception", entityId, String(body.note ?? "Acknowledged by operations"))
    return res.json({ acknowledged: true, persisted_as: "audit_event" })
  }

  if (action === "snooze_exception") {
    await requireOperator(finance, adminUserId, [B2BFinanceOperatorRole.VIEWER, B2BFinanceOperatorRole.APPROVER, B2BFinanceOperatorRole.RELEASE_OVERRIDE])
    const hours = Math.min(Math.max(Number(body.hours ?? 24), 1), 168)
    const snoozedUntil = new Date(Date.now() + hours * 60 * 60 * 1000)
    await recordRecoveryAudit(req, "b2b.exception.snoozed", "b2b_exception", entityId, `Snoozed until ${snoozedUntil.toISOString()}`)
    return res.json({ snoozed: true, snoozed_until: snoozedUntil.toISOString(), persisted_as: "audit_event" })
  }

  throw new MedusaError(MedusaError.Types.INVALID_DATA, `Unsupported recovery action: ${action}`)
}
