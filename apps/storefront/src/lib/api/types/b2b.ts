/**
 * B2B Organization Types
 */

export enum B2BOrganizationStatus {
  PENDING = "pending",
  ACTIVE = "active",
  SUSPENDED = "suspended",
  ARCHIVED = "archived",
}

export enum B2BOrganizationMemberStatus {
  INVITED = "invited",
  ACTIVE = "active",
  SUSPENDED = "suspended",
  REMOVED = "removed",
}

export enum B2BOrganizationRole {
  OWNER = "owner",
  BUYER = "buyer",
  APPROVER = "approver",
  FINANCE = "finance",
  VIEWER = "viewer",
}

export type B2BOrganization = {
  id: string
  display_name: string
  handle: string
  sales_channel_id: string
  status: B2BOrganizationStatus
  created_at?: string
  updated_at?: string
}

export type B2BOrganizationMember = {
  id: string
  organization_id: string
  customer_id: string
  role: B2BOrganizationRole
  status: B2BOrganizationMemberStatus
  created_at?: string
  updated_at?: string
}

export type B2BOrganizationWithRole = B2BOrganization & {
  role: B2BOrganizationRole
}

export type ListOrganizationsResponse = {
  organizations: B2BOrganizationWithRole[]
}

/**
 * B2B Cart Context Types
 */

export type B2BCartContext = {
  id: string
  cart_id: string
  organization_id: string
  customer_id: string
  member_id: string
  created_at?: string
  updated_at?: string
}

export type SelectOrganizationPayload = {
  organization_id: string
}

export type SelectOrganizationResponse = {
  context: B2BCartContext
  action: "selected" | "already_selected"
}

/**
 * B2B Purchase Request Types
 */

export enum B2BPurchaseRequestStatus {
  PENDING_INTERNAL_APPROVAL = "pending_internal_approval",
  PENDING_MERCHANT_QUOTE = "pending_merchant_quote",
  PENDING_BUYER_ACCEPTANCE = "pending_buyer_acceptance",
  REJECTED = "rejected",
  CANCELLED = "cancelled",
  EXPIRED = "expired",
  CONVERTED = "converted",
}

export enum B2BPurchaseApprovalDecision {
  APPROVED = "approved",
  REJECTED = "rejected",
}

export type B2BPurchaseRequest = {
  id: string
  reference?: string
  organization_id: string
  customer_id: string
  cart_id: string
  draft_order_id?: string
  order_change_id?: string
  order_id?: string
  request_member_id?: string
  requested_total?: string | number | null
  currency_code?: string
  purchase_order_number?: string | null
  status: B2BPurchaseRequestStatus
  submitted_at?: string
  expires_at?: string | null
  quoted_at?: string | null
  approved_at?: string | null
  accepted_at?: string | null
  rejected_at?: string | null
  cancelled_at?: string | null
  cart_snapshot?: Record<string, any>
  policy_snapshot?: Record<string, any>
  created_at?: string
  updated_at?: string
}

export type B2BPurchaseApproval = {
  id: string
  purchase_request_id: string
  approver_member_id?: string
  approver_customer_id?: string
  decision: B2BPurchaseApprovalDecision
  note?: string | null
  decided_at?: string
  created_at?: string
  updated_at?: string
}

export type B2BPurchaseRequestDetailResponse = {
  purchase_request: B2BPurchaseRequest
  approval_history: B2BPurchaseApproval[]
}

export type SubmitPurchaseRequestPayload = {
  cart_id: string
  purchase_order_number?: string
}

export type SubmitPurchaseRequestResponse = {
  purchase_request: B2BPurchaseRequest
  draft_order_id: string
}

export type DecidePurchaseRequestPayload = {
  decision: "approved" | "rejected"
  note?: string
}

export type DecidePurchaseRequestResponse = {
  purchase_request: B2BPurchaseRequest
  approval: B2BPurchaseApproval
}

/**
 * B2B Finance Types
 */

export enum B2BFinanceReviewStatus {
  PENDING = "pending",
  APPROVED_ON_ACCOUNT = "approved_on_account",
  PREPAYMENT_REQUIRED = "prepayment_required",
  REJECTED = "rejected",
  MANUAL_REVIEW = "manual_review",
  CANCELLED = "cancelled",
}

export enum B2BOrderReleaseStatus {
  FINANCE_PENDING = "finance_pending",
  PREPAYMENT_REQUIRED = "prepayment_required",
  ELIGIBLE_FOR_RELEASE = "eligible_for_release",
  RELEASED = "released",
  BLOCKED = "blocked",
  CANCELLED = "cancelled",
}

export enum B2BFinanceOperatorRole {
  VIEWER = "viewer",
  APPROVER = "approver",
  RELEASE_OVERRIDE = "release_override",
}

export enum B2BPaymentTermsStatus {
  PENDING_INVOICE = "pending_invoice",
  OPEN = "open",
  PARTIALLY_PAID = "partially_paid",
  PAID = "paid",
  OVERDUE = "overdue",
  VOID = "void",
}

export enum B2BFinanceAccountStatus {
  PENDING = "pending",
  ACTIVE = "active",
  SUSPENDED = "suspended",
  EXPIRED = "expired",
}

export type B2BFinanceAccount = {
  id: string
  organization_id: string
  status: B2BFinanceAccountStatus
  credit_limit?: number
  credit_used?: number
  created_at?: string
  updated_at?: string
}

export type B2BOrderFinanceReview = {
  id: string
  order_id: string
  purchase_request_id?: string | null
  organization_id: string
  finance_account_id?: string | null
  currency_code: string
  order_total: string | number
  status: B2BFinanceReviewStatus
  payment_terms_code?: string | null
  external_credit_hold_id?: string | null
  external_invoice_id?: string | null
  decision_by_admin_user_id?: string | null
  decision_reason_code?: string | null
  decision_note?: string | null
  decision_snapshot?: Record<string, any> | null
  reviewed_at?: string | null
  valid_until?: string | null
  created_at?: string
  updated_at?: string
}

export type B2BOrderRelease = {
  id: string
  order_id: string
  organization_id: string
  status: B2BOrderReleaseStatus
  finance_review_id: string
  release_idempotency_key?: string
  released_by_admin_user_id?: string | null
  released_at?: string | null
  blocked_at?: string | null
  blocked_reason_code?: string | null
  blocked_reason_note?: string | null
  created_at?: string
  updated_at?: string
}

export type B2BFinanceOperator = {
  id: string
  user_id: string
  role: B2BFinanceOperatorRole
  created_at?: string
  updated_at?: string
}

export enum B2BAuditActorType {
  CUSTOMER = "customer",
  ADMIN = "admin",
  SERVICE = "service",
  EXTERNAL_SYSTEM = "external_system",
}

export enum B2BAuditOutcome {
  SUCCESS = "success",
  DENIED = "denied",
  FAILURE = "failure",
}

export type B2BAuditEvent = {
  id: string
  event_id: string
  action: string
  outcome: B2BAuditOutcome
  entity_type: string
  entity_id: string
  organization_id?: string | null
  actor_type: B2BAuditActorType
  actor_id?: string | null
  actor_display?: string | null
  correlation_id?: string | null
  causation_id?: string | null
  reason_code?: string | null
  note?: string | null
  metadata?: Record<string, any> | null
  occurred_at?: string | null
  created_at?: string
  updated_at?: string
}

export type ListB2BAuditEventsResponse = {
  audit_events: B2BAuditEvent[]
  count: number
  total: number
}

/**
 * B2B Exception/Reconciliation Types
 */

export enum B2BExceptionType {
  FINANCE_PENDING_TOO_LONG = "finance_pending_too_long",
  FINANCE_REVIEW_EXPIRED = "finance_review_expired",
  OVERDUE_PAYMENT_OBLIGATION = "overdue_payment_obligation",
  BLOCKED_ORDER_RELEASE = "blocked_order_release",
  RELEASE_NOT_DISPATCHED = "release_not_dispatched",
  WAREHOUSE_DISPATCH_FAILED = "warehouse_dispatch_failed",
}

export enum B2BExceptionSeverity {
  WARNING = "warning",
  CRITICAL = "critical",
}

export type B2BException = {
  type: B2BExceptionType
  severity: B2BExceptionSeverity
  order_id?: string
  order_display_id?: string
  organization_id?: string
  customer_email?: string
  status?: string
  reason?: string
  note?: string
  reference: string
  available_actions: string[]
  created_at?: string
  failed_at?: string
  due_at?: string
  days_pending?: number
  days_overdue?: number
  days_eligible?: number
  amount?: number
  currency?: string
  attempts?: number
  last_error?: string
  [key: string]: any
}

export type ListB2BExceptionsResponse = {
  exceptions: B2BException[]
  total: number
  summary: {
    critical: number
    warning: number
  }
}

export type B2BPaymentTermsObligation = {
  id: string
  order_id: string
  organization_id: string
  net_days: number
  invoice_date?: string
  due_date?: string
  status: "pending_invoice" | "open" | "partially_paid" | "paid" | "overdue" | "void"
  amount_due?: number
  amount_paid?: number
  created_at?: string
  updated_at?: string
}

export type FinanceDecisionPayload = {
  decision: "approved_on_account" | "prepayment_required" | "rejected" | "manual_review"
  reason_code?: string
  note?: string
}

export type FinanceDecisionResponse = {
  review: B2BOrderFinanceReview
  release?: B2BOrderRelease
  obligation?: B2BPaymentTermsObligation
  event_name?: string
}

export type AdminFinanceReviewListResponse = {
  finance_reviews: Array<{
    review: B2BOrderFinanceReview
    order?: Record<string, any>
    organization?: Record<string, any>
    customer?: Record<string, any>
    finance_account?: Record<string, any>
    release?: B2BOrderRelease
  }>
  total: number
  count?: number
}

export type AdminFinanceReviewDetailResponse = {
  finance_review: {
    review: B2BOrderFinanceReview
    order?: Record<string, any>
    organization?: Record<string, any>
    customer?: Record<string, any>
    finance_account?: Record<string, any>
    release?: B2BOrderRelease
    payment_terms_obligation?: B2BPaymentTermsObligation
  }
}
