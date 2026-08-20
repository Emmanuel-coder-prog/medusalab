# Lab 19: B2B Operations and ERP Controls

## Overview

This lab implements:
1. Append-only audit event log for compliance and debugging
2. Finance/ERP connector outbox pattern for asynchronous integration
3. Business event emission after successful workflows
4. Contract definitions for ERP communication

---

## 19.1 Design the audit stream (append-only event log)

**Status**: ✅ Complete

### Model: B2BAuditEvent

File: [`apps/backend/src/modules/b2b-audit/models/b2b-audit-event.ts`](../../../apps/backend/src/modules/b2b-audit/models/b2b-audit-event.ts)

Records sensitive B2B actions for compliance, debugging, and audit trails:

```typescript
export const B2BAuditEvent = model
  .define("b2b_audit_event", {
    id: model.id().primaryKey(),
    event_id: model.text().unique(),
    action: model.text().index(),
    outcome: model
      .enum(Object.values(B2BAuditOutcome))
      .default(B2BAuditOutcome.SUCCESS),
    entity_type: model.text().index(),
    entity_id: model.text().index(),
    organization_id: model.text().index().nullable(),
    actor_type: model
      .enum(Object.values(B2BAuditActorType))
      .default(B2BAuditActorType.SERVICE),
    actor_id: model.text().nullable(),
    actor_display: model.text().nullable(),
    correlation_id: model.text().index().nullable(),
    causation_id: model.text().nullable(),
    reason_code: model.text().nullable(),
    note: model.text().nullable(),
    metadata: model.json().nullable(),
    occurred_at: model.dateTime().index(),
  })
  .indexes([
    { on: ["entity_type", "entity_id", "occurred_at"] },
    { on: ["organization_id", "occurred_at"] },
    { on: ["action", "outcome", "occurred_at"] },
  ])
```

### Audit Actor Types

- `CUSTOMER` — B2B customer approval decision
- `ADMIN` — Merchant admin action
- `SERVICE` — Automated system action (workflow, job, ERP sync)
- `EXTERNAL_SYSTEM` — ERP or other integrated system

### Audit Outcomes

- `SUCCESS` — Action succeeded
- `DENIED` — Authorization or business rule rejected action
- `FAILURE` — Technical error during execution

### Metadata Policy

- ✅ ALLOWED: order amount, currency, status before/after, decision reason
- ❌ NEVER: raw payment secrets, full card data, SSN, full address history

---

## 19.2 Make the audit table immutable at database level

**Status**: ✅ Complete

### Append-Only Trigger

File: [`apps/backend/src/modules/b2b-audit/migrations/Migration20260818101940.ts`](../../../apps/backend/src/modules/b2b-audit/migrations/Migration20260818101940.ts)

The migration includes a PostgreSQL trigger that rejects any UPDATE or DELETE:

```sql
CREATE OR REPLACE FUNCTION reject_b2b_audit_event_mutation()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'b2b_audit_event is append-only';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER b2b_audit_event_no_update_delete
BEFORE UPDATE OR DELETE ON b2b_audit_event
FOR EACH ROW
EXECUTE FUNCTION reject_b2b_audit_event_mutation();
```

### Database Role Enforcement

**Application Role**:
- ✅ INSERT — Create new audit events
- ✅ SELECT — Query audit history
- ❌ UPDATE — Blocked by trigger
- ❌ DELETE — Blocked by trigger

**API Exposure**:
- ❌ No PATCH/PUT routes for audit events
- ❌ No DELETE routes for audit events
- ✅ GET routes for audit queries (read-only)

---

## 19.3 Reusable audit workflow step

**Status**: ✅ Complete

File: [`apps/backend/src/workflows/b2b/steps/record-b2b-audit-event.ts`](../../../apps/backend/src/workflows/b2b/steps/record-b2b-audit-event.ts)

### Usage Pattern

Place this step **after** the successful state mutation:

```typescript
// 1. State mutation
const approval = decidePurchaseRequestStep(input)

// 2. Audit entry (captures what succeeded)
recordB2BAuditEventStep({
  action: "b2b.purchase_request.approved",
  outcome: B2BAuditOutcome.SUCCESS,
  entity_type: "purchase_request",
  entity_id: approval.purchase_request_id,
  organization_id: input.organization_id,
  actor_type: B2BAuditActorType.CUSTOMER,
  actor_id: input.approver_customer_id,
  correlation_id: input.purchase_request_id,
  metadata: {
    next_status: approval.next_status,
  },
})

// 3. Emit business event
emitEventStep({
  eventName: "b2b.purchase_request.approved",
  data: { order_id: approval.order_id },
})
```

### Sensitive Actions Requiring DENIED Audit

When authorization denies a sensitive action **at the route level**:

```typescript
const canApprove = await checkApprovalPermission(member, request)
if (!canApprove) {
  // Record DENIED audit entry
  await auditService.createB2BAuditEvents({
    action: "b2b.purchase_request.approved",
    outcome: B2BAuditOutcome.DENIED,
    entity_type: "purchase_request",
    entity_id: id,
    actor_type: B2BAuditActorType.CUSTOMER,
    actor_id: member.customer_id,
    reason_code: "INSUFFICIENT_ROLE",
  })

  throw new HttpException(403, "Not authorized")
}
```

**Never compensate successful audit events**: An audit entry saying "approved" must only exist after the approval actually succeeded.

---

## 19.4 Emit business events after success

**Status**: ✅ Complete (Pattern defined)

### Distinction

| Aspect | Audit Event | Business Event |
|--------|-------------|----------------|
| **Purpose** | Durable evidence of action | Asynchronous instruction for downstream work |
| **Timing** | Synchronous database write | Emitted only after workflow succeeds |
| **Visibility** | Query-able in audit table | Subscribed by listeners (ERP, warehouse) |

### Workflow Step Order

```
1. Validate input and authorization (optional: record DENIED audit)
2. Execute state mutation
3. Record SUCCESS audit entry
4. Emit business event
(Return result)
```

### Sample Business Events

- `b2b.purchase_request.approved`
- `b2b.purchase_request.rejected`
- `b2b.quote.sent`
- `b2b.quote.accepted`
- `b2b.finance.approved_on_account`
- `b2b.finance.prepayment_required`
- `b2b.finance.rejected`
- `b2b.order_release.overridden`
- `b2b.erp_sync.failed`
- `b2b.erp_sync.reconciled`

---

## 19.5 Finance/ERP connector outbox pattern

**Status**: ✅ Complete

### Outbound Command Model

File: [`apps/backend/src/modules/finance-connector/models/finance-sync-outbox.ts`](../../../apps/backend/src/modules/finance-connector/models/finance-sync-outbox.ts)

```typescript
export enum FinanceSyncOutboxStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  ACCEPTED = "accepted",
  FAILED = "failed",
  MANUAL_REVIEW = "manual_review",
  CANCELLED = "cancelled",
}
```

**Deterministic Idempotency Keys**:

```
finance-credit-hold:org_01J:order_01J:v1
finance-invoice:order_01J:v1
finance-account-refresh:fin_acc_01J:2026-08-18:v1
```

### Inbound Event Receipt Model

File: [`apps/backend/src/modules/finance-connector/models/finance-event-receipt.ts`](../../../apps/backend/src/modules/finance-connector/models/finance-event-receipt.ts)

Deduplicates inbound events using `(source, event_id)` composite unique index.

---

## 19.6 Correct Part 18 release behavior

**Status**: ✅ Pattern Defined

### Environment Configuration

```
B2B_FINANCE_AUTHORITY_MODE=manual  # or "erp"
```

### Manual Mode (Default)

Finance approval → release becomes `ELIGIBLE_FOR_RELEASE` immediately

### ERP Mode (Enterprise)

Finance approval → command queued → ERP confirms credit hold → release becomes `ELIGIBLE_FOR_RELEASE`

**Failure handling**: Never silently fall back to local release when ERP is down. Order sits in exception queue.

---

## 19.7 Define the external ERP contract

**Status**: ✅ Complete

File: [`docs/contracts/finance-credit-hold-command-v1.md`](../../contracts/finance-credit-hold-command-v1.md)

### Command Structure

```json
{
  "schema_version": "1.0",
  "command_id": "cmd_01J...",
  "command_type": "credit_hold.create",
  "idempotency_key": "finance-credit-hold:org_01J:order_01J:v1",
  "correlation_id": "order_01J...",
  "organization": {
    "external_finance_account_id": "erp_customer_1001"
  },
  "order": {
    "display_id": 1024,
    "currency_code": "ghs",
    "total": "50000.00"
  },
  "payment_terms": { "code": "NET_30" }
}
```

### Response Structure

```json
{
  "event_type": "credit_hold.accepted",
  "correlation_id": "order_01J...",
  "payload": {
    "external_credit_hold_id": "hold_123",
    "status": "accepted"
  }
}
```

### Inbound Event Validation

Every inbound event must pass:
1. **TLS/HMAC Signature** verification
2. **Timestamp Tolerance** check (±5 min)
3. **Event ID Deduplication**
4. **Payload Hash Verification**
5. **Schema Validation**
6. **Source Allowlist** verification

---

## Summary of Deliverables

| Component | Status | Files |
|-----------|--------|-------|
| B2B Audit Module | ✅ | `src/modules/b2b-audit/` |
| Append-Only Trigger | ✅ | Migration with PostgreSQL trigger |
| Audit Workflow Step | ✅ | `workflows/b2b/steps/record-b2b-audit-event.ts` |
| Finance Connector Module | ✅ | `src/modules/finance-connector/` |
| Outbound Command Model | ✅ | `models/finance-sync-outbox.ts` |
| Inbound Event Model | ✅ | `models/finance-event-receipt.ts` |
| ERP Contract (v1.0) | ✅ | `docs/contracts/finance-credit-hold-command-v1.md` |
| Module Registration | ✅ | `medusa-config.ts` |
| Database Migrations | ✅ | Generated and executed |

---

## Previous Content: Finance Authority Modes

### Manual pilot
An authorized finance operator is the decision authority.

### ERP-authoritative production
ERP/AR is authoritative for:
- credit exposure
- credit hold
- invoice status
- receivables
- overdue status

Medusa stores a commerce-facing projection and must wait for ERP
acknowledgement before warehouse release.

## Audit principle
Every sensitive B2B decision is append-only, attributable, and
operationally searchable.

## Release principle
Order accepted does not mean warehouse released.

A B2B order is released only after:
- finance eligibility is confirmed; and
- the warehouse-release outbox record is created successfully.