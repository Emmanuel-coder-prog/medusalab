# Finance Credit Hold Command v1.0

## Overview

Command contract for requesting a credit hold in the ERP finance system when a B2B order transitions to the approval stage.

## Request

### Command: `credit_hold.create`

```json
{
  "schema_version": "1.0",
  "command_id": "cmd_01J...",
  "command_type": "credit_hold.create",
  "producer": "wholesale-global-commerce",
  "requested_at": "2026-06-25T18:15:00.000Z",
  "idempotency_key": "finance-credit-hold:org_01J:order_01J:v1",
  "correlation_id": "order_01J...",
  "organization": {
    "id": "org_01J...",
    "external_finance_account_id": "erp_customer_1001"
  },
  "order": {
    "id": "order_01J...",
    "display_id": 1024,
    "currency_code": "ghs",
    "total": "50000.00"
  },
  "payment_terms": {
    "code": "NET_30"
  }
}
```

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `schema_version` | string | Yes | Contract version (e.g., "1.0") |
| `command_id` | string | Yes | Unique command identifier (e.g., ulid) |
| `command_type` | string | Yes | Operation type: `credit_hold.create` |
| `producer` | string | Yes | System originating the command |
| `requested_at` | ISO 8601 | Yes | Command creation timestamp |
| `idempotency_key` | string | Yes | Deterministic key for replay-safety: `finance-credit-hold:{organization_id}:{order_id}:v1` |
| `correlation_id` | string | Yes | Order ID for tracing |
| `organization.id` | string | Yes | Medusa organization ID |
| `organization.external_finance_account_id` | string | Yes | ERP customer/account number |
| `order.id` | string | Yes | Medusa order ID |
| `order.display_id` | number | Yes | Human-readable order number |
| `order.currency_code` | string | Yes | ISO 4217 currency code |
| `order.total` | string | Yes | Order total as decimal string (never float) |
| `payment_terms.code` | string | Yes | Payment terms code (e.g., NET_30, NET_60) |

## Response

### Event: `credit_hold.accepted`

```json
{
  "schema_version": "1.0",
  "event_id": "erp_evt_01J...",
  "event_type": "credit_hold.accepted",
  "producer": "finance-erp",
  "occurred_at": "2026-06-25T18:15:04.000Z",
  "correlation_id": "order_01J...",
  "subject": {
    "type": "order",
    "id": "order_01J..."
  },
  "payload": {
    "external_credit_hold_id": "hold_123",
    "status": "accepted"
  }
}
```

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `schema_version` | string | Yes | Contract version |
| `event_id` | string | Yes | Unique event identifier (ERP-generated) |
| `event_type` | string | Yes | Event type: `credit_hold.accepted` |
| `producer` | string | Yes | System originating the event (e.g., `finance-erp`) |
| `occurred_at` | ISO 8601 | Yes | Event timestamp in ERP system |
| `correlation_id` | string | Yes | Matches command correlation_id for tracing |
| `subject.type` | string | Yes | Entity type: `order` |
| `subject.id` | string | Yes | Order ID |
| `payload.external_credit_hold_id` | string | Yes | ERP credit hold reference number |
| `payload.status` | string | Yes | Hold status: `accepted` |

## Validation Rules

All inbound events from ERP must pass:

1. **TLS/HMAC Signature**: Verify HMAC-SHA256 of event payload using shared secret
2. **Timestamp Tolerance**: Reject if `occurred_at` is more than 5 minutes in the past or future
3. **Event ID Deduplication**: Check `(source, event_id)` composite unique; reject duplicate
4. **Payload Hash Verification**: Hash inbound payload; compare against stored hash if replayed
5. **Schema Validation**: Validate against this contract version
6. **Source Allowlist**: Only accept events from approved ERP IP/DNS/TLS certificate

## Idempotency

The `idempotency_key` is deterministic and scoped:

```
finance-credit-hold:org_01J:order_01J:v1
```

If the same order receives a credit hold creation command twice (e.g., due to retries or network issues), the second attempt should be idempotent:
- Return success if the hold is already created
- Use the existing external_credit_hold_id
- Do not create a duplicate hold

## Error Handling

### Rejected Hold (ERP-Initiated)

```json
{
  "schema_version": "1.0",
  "event_id": "erp_evt_01J...",
  "event_type": "credit_hold.rejected",
  "producer": "finance-erp",
  "occurred_at": "2026-06-25T18:15:10.000Z",
  "correlation_id": "order_01J...",
  "subject": {
    "type": "order",
    "id": "order_01J..."
  },
  "payload": {
    "status": "rejected",
    "reason_code": "CREDIT_LIMIT_EXCEEDED",
    "reason_message": "Organization credit limit would be exceeded"
  }
}
```

Reason codes:
- `CREDIT_LIMIT_EXCEEDED` — Credit limit would be exceeded
- `ACCOUNT_SUSPENDED` — Organization finance account is suspended
- `ACCOUNT_INACTIVE` — Organization has no finance account
- `INVALID_PAYMENT_TERMS` — Payment terms not accepted
- `CURRENCY_NOT_SUPPORTED` — Currency not supported for this account

### Manual Review Required

```json
{
  "schema_version": "1.0",
  "event_id": "erp_evt_01J...",
  "event_type": "credit_hold.manual_review_required",
  "producer": "finance-erp",
  "occurred_at": "2026-06-25T18:15:10.000Z",
  "correlation_id": "order_01J...",
  "subject": {
    "type": "order",
    "id": "order_01J..."
  },
  "payload": {
    "status": "manual_review_required",
    "reason_code": "POLICY_EXCEPTION",
    "reason_message": "Order exceeds policy limits; manual review required"
  }
}
```

## Integration Responsibilities

**Medusa (`wholesale-global-commerce`)**:
- Sign all outbound commands with HMAC-SHA256
- Include accurate correlation_id for tracing
- Retry transient failures (connection timeout, 5xx)
- Maintain the finance sync outbox
- Emit only after B2B order finance review is approved
- Do not emit if a prior hold already exists for this order

**ERP (`finance-erp`)**:
- Validate HMAC signature before processing
- Check idempotency key; return existing hold if present
- Validate credit limit and payment terms
- Return deterministic responses (always same result for same input)
- Emit response event with matching correlation_id
- Preserve timestamps in UTC with millisecond precision

## Related Contracts

- [`finance-invoice-command-v1.md`](./finance-invoice-command-v1.md) — Invoice creation after credit hold acceptance
- [`finance-account-refresh-command-v1.md`](./finance-account-refresh-command-v1.md) — Credit limit and status refresh
