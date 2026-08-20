import {
  B2BOrganizationStatus,
  B2BOrganizationMemberStatus,
  B2BPurchaseRequestStatus,
  B2BPurchaseApprovalDecision,
  B2BFinanceReviewStatus,
  B2BOrderReleaseStatus,
  B2BFinanceAccountStatus,
  B2BFinanceOperatorRole,
  B2BPaymentTermsStatus,
} from "@lib/api/types/b2b"

/**
 * Organization status labels and descriptions
 */
export function getOrganizationStatusLabel(status: B2BOrganizationStatus): string {
  const labels: Record<B2BOrganizationStatus, string> = {
    [B2BOrganizationStatus.PENDING]: "Pending",
    [B2BOrganizationStatus.ACTIVE]: "Active",
    [B2BOrganizationStatus.SUSPENDED]: "Suspended",
    [B2BOrganizationStatus.ARCHIVED]: "Archived",
  }
  return labels[status]
}

export function getOrganizationStatusColor(
  status: B2BOrganizationStatus
): "green" | "yellow" | "red" | "gray" {
  const colors: Record<B2BOrganizationStatus, "green" | "yellow" | "red" | "gray"> = {
    [B2BOrganizationStatus.PENDING]: "yellow",
    [B2BOrganizationStatus.ACTIVE]: "green",
    [B2BOrganizationStatus.SUSPENDED]: "red",
    [B2BOrganizationStatus.ARCHIVED]: "gray",
  }
  return colors[status]
}

/**
 * Organization member status labels
 */
export function getMemberStatusLabel(status: B2BOrganizationMemberStatus): string {
  const labels: Record<B2BOrganizationMemberStatus, string> = {
    [B2BOrganizationMemberStatus.INVITED]: "Invited",
    [B2BOrganizationMemberStatus.ACTIVE]: "Active",
    [B2BOrganizationMemberStatus.SUSPENDED]: "Suspended",
    [B2BOrganizationMemberStatus.REMOVED]: "Removed",
  }
  return labels[status]
}

export function getMemberStatusColor(
  status: B2BOrganizationMemberStatus
): "blue" | "green" | "red" | "gray" {
  const colors: Record<B2BOrganizationMemberStatus, "blue" | "green" | "red" | "gray"> = {
    [B2BOrganizationMemberStatus.INVITED]: "blue",
    [B2BOrganizationMemberStatus.ACTIVE]: "green",
    [B2BOrganizationMemberStatus.SUSPENDED]: "red",
    [B2BOrganizationMemberStatus.REMOVED]: "gray",
  }
  return colors[status]
}

/**
 * Purchase request status labels and descriptions
 */
export function getPurchaseRequestStatusLabel(
  status: B2BPurchaseRequestStatus
): string {
  const labels: Record<B2BPurchaseRequestStatus, string> = {
    [B2BPurchaseRequestStatus.PENDING_INTERNAL_APPROVAL]: "Awaiting Internal Approval",
    [B2BPurchaseRequestStatus.PENDING_MERCHANT_QUOTE]: "Awaiting Merchant Quote",
    [B2BPurchaseRequestStatus.PENDING_BUYER_ACCEPTANCE]: "Awaiting Buyer Acceptance",
    [B2BPurchaseRequestStatus.REJECTED]: "Rejected",
    [B2BPurchaseRequestStatus.CANCELLED]: "Cancelled",
    [B2BPurchaseRequestStatus.EXPIRED]: "Expired",
    [B2BPurchaseRequestStatus.CONVERTED]: "Converted to Order",
  }
  return labels[status]
}

export function getPurchaseRequestStatusColor(
  status: B2BPurchaseRequestStatus
): "yellow" | "blue" | "orange" | "red" | "green" | "gray" {
  const colors: Record<B2BPurchaseRequestStatus, "yellow" | "blue" | "orange" | "red" | "green" | "gray"> = {
    [B2BPurchaseRequestStatus.PENDING_INTERNAL_APPROVAL]: "yellow",
    [B2BPurchaseRequestStatus.PENDING_MERCHANT_QUOTE]: "blue",
    [B2BPurchaseRequestStatus.PENDING_BUYER_ACCEPTANCE]: "orange",
    [B2BPurchaseRequestStatus.REJECTED]: "red",
    [B2BPurchaseRequestStatus.CANCELLED]: "gray",
    [B2BPurchaseRequestStatus.EXPIRED]: "gray",
    [B2BPurchaseRequestStatus.CONVERTED]: "green",
  }
  return colors[status]
}

export function getPurchaseRequestStatusDescription(
  status: B2BPurchaseRequestStatus
): string {
  const descriptions: Record<B2BPurchaseRequestStatus, string> = {
    [B2BPurchaseRequestStatus.PENDING_INTERNAL_APPROVAL]:
      "Waiting for approval from your organization",
    [B2BPurchaseRequestStatus.PENDING_MERCHANT_QUOTE]:
      "Merchant is preparing a quote",
    [B2BPurchaseRequestStatus.PENDING_BUYER_ACCEPTANCE]:
      "Waiting for you to accept the terms",
    [B2BPurchaseRequestStatus.REJECTED]:
      "This request was rejected",
    [B2BPurchaseRequestStatus.CANCELLED]:
      "This request was cancelled",
    [B2BPurchaseRequestStatus.EXPIRED]:
      "This request has expired",
    [B2BPurchaseRequestStatus.CONVERTED]:
      "Converted to an order",
  }
  return descriptions[status]
}

/**
 * Purchase approval decision labels
 */
export function getApprovalDecisionLabel(decision: B2BPurchaseApprovalDecision): string {
  const labels: Record<B2BPurchaseApprovalDecision, string> = {
    [B2BPurchaseApprovalDecision.APPROVED]: "Approved",
    [B2BPurchaseApprovalDecision.REJECTED]: "Rejected",
  }
  return labels[decision]
}

/**
 * Finance review status labels
 */
export function getFinanceReviewStatusLabel(status: B2BFinanceReviewStatus): string {
  const labels: Record<B2BFinanceReviewStatus, string> = {
    [B2BFinanceReviewStatus.PENDING]: "Pending Review",
    [B2BFinanceReviewStatus.APPROVED_ON_ACCOUNT]: "Approved on Account",
    [B2BFinanceReviewStatus.PREPAYMENT_REQUIRED]: "Prepayment Required",
    [B2BFinanceReviewStatus.REJECTED]: "Rejected",
    [B2BFinanceReviewStatus.MANUAL_REVIEW]: "Manual Review Required",
    [B2BFinanceReviewStatus.CANCELLED]: "Cancelled",
  }
  return labels[status]
}

export function getFinanceReviewStatusColor(
  status: B2BFinanceReviewStatus
): "yellow" | "green" | "orange" | "red" | "purple" | "gray" {
  const colors: Record<B2BFinanceReviewStatus, "yellow" | "green" | "orange" | "red" | "purple" | "gray"> = {
    [B2BFinanceReviewStatus.PENDING]: "yellow",
    [B2BFinanceReviewStatus.APPROVED_ON_ACCOUNT]: "green",
    [B2BFinanceReviewStatus.PREPAYMENT_REQUIRED]: "orange",
    [B2BFinanceReviewStatus.REJECTED]: "red",
    [B2BFinanceReviewStatus.MANUAL_REVIEW]: "purple",
    [B2BFinanceReviewStatus.CANCELLED]: "gray",
  }
  return colors[status]
}

/**
 * Order release status labels
 */
export function getOrderReleaseStatusLabel(status: B2BOrderReleaseStatus): string {
  const labels: Record<B2BOrderReleaseStatus, string> = {
    [B2BOrderReleaseStatus.FINANCE_PENDING]: "Finance Review Pending",
    [B2BOrderReleaseStatus.PREPAYMENT_REQUIRED]: "Prepayment Required",
    [B2BOrderReleaseStatus.ELIGIBLE_FOR_RELEASE]: "Ready for Warehouse Release",
    [B2BOrderReleaseStatus.RELEASED]: "Released to Warehouse",
    [B2BOrderReleaseStatus.BLOCKED]: "Release Blocked",
    [B2BOrderReleaseStatus.CANCELLED]: "Cancelled",
  }
  return labels[status]
}

export function getOrderReleaseStatusColor(
  status: B2BOrderReleaseStatus
): "yellow" | "green" | "orange" | "red" | "gray" {
  const colors: Record<B2BOrderReleaseStatus, "yellow" | "green" | "orange" | "red" | "gray"> = {
    [B2BOrderReleaseStatus.FINANCE_PENDING]: "yellow",
    [B2BOrderReleaseStatus.PREPAYMENT_REQUIRED]: "orange",
    [B2BOrderReleaseStatus.ELIGIBLE_FOR_RELEASE]: "green",
    [B2BOrderReleaseStatus.RELEASED]: "green",
    [B2BOrderReleaseStatus.BLOCKED]: "red",
    [B2BOrderReleaseStatus.CANCELLED]: "gray",
  }
  return colors[status]
}

export function getOrderReleaseStatusDescription(
  status: B2BOrderReleaseStatus
): string {
  const descriptions: Record<B2BOrderReleaseStatus, string> = {
    [B2BOrderReleaseStatus.FINANCE_PENDING]: "Finance review is still pending and the order cannot move to warehouse release.",
    [B2BOrderReleaseStatus.PREPAYMENT_REQUIRED]: "Prepayment condition must be met before the order is eligible for warehouse release.",
    [B2BOrderReleaseStatus.ELIGIBLE_FOR_RELEASE]: "Finance has cleared the order; backend release processing may create the HubLoft handoff once the warehouse workflow permits it.",
    [B2BOrderReleaseStatus.RELEASED]: "Warehouse release has been recorded by the backend and it is no longer eligible for direct browser-side release actions.",
    [B2BOrderReleaseStatus.BLOCKED]: "Release is blocked by finance or compliance criteria. Review the reason before further action.",
    [B2BOrderReleaseStatus.CANCELLED]: "The order has been cancelled and warehouse release is no longer allowed.",
  }

  return descriptions[status]
}

export function getBlockedReasonLabel(code?: string | null): string {
  if (!code) {
    return "No blocked reason recorded"
  }

  const labels: Record<string, string> = {
    finance_rejected: "Finance rejected",
    prepayment_required: "Prepayment required",
    credit_limit_exceeded: "Credit limit exceeded",
    compliance_hold: "Compliance hold",
    manual_review: "Manual review required",
  }

  return labels[code] ?? code.replace(/_/g, " ")
}

/**
 * Finance account status labels
 */
export function getFinanceAccountStatusLabel(status: B2BFinanceAccountStatus): string {
  const labels: Record<B2BFinanceAccountStatus, string> = {
    [B2BFinanceAccountStatus.PENDING]: "Pending",
    [B2BFinanceAccountStatus.ACTIVE]: "Active",
    [B2BFinanceAccountStatus.SUSPENDED]: "Suspended",
    [B2BFinanceAccountStatus.EXPIRED]: "Expired",
  }
  return labels[status]
}

/**
 * Finance operator role labels
 */
export function getFinanceOperatorRoleLabel(role: B2BFinanceOperatorRole): string {
  const labels: Record<B2BFinanceOperatorRole, string> = {
    [B2BFinanceOperatorRole.VIEWER]: "Viewer",
    [B2BFinanceOperatorRole.APPROVER]: "Approver",
    [B2BFinanceOperatorRole.RELEASE_OVERRIDE]: "Release Override",
  }
  return labels[role]
}

/**
 * Check if a purchase request is in a terminal state (no further actions possible)
 */
export function isPurchaseRequestTerminal(status: B2BPurchaseRequestStatus): boolean {
  return [
    B2BPurchaseRequestStatus.REJECTED,
    B2BPurchaseRequestStatus.CANCELLED,
    B2BPurchaseRequestStatus.EXPIRED,
    B2BPurchaseRequestStatus.CONVERTED,
  ].includes(status)
}

/**
 * Check if an order can be released to warehouse
 */
export function isOrderReadyForRelease(status: B2BOrderReleaseStatus): boolean {
  return status === B2BOrderReleaseStatus.ELIGIBLE_FOR_RELEASE
}

/**
 * Check if finance review is completed
 */
export function isFinanceReviewCompleted(status: B2BFinanceReviewStatus): boolean {
  return [
    B2BFinanceReviewStatus.APPROVED_ON_ACCOUNT,
    B2BFinanceReviewStatus.PREPAYMENT_REQUIRED,
    B2BFinanceReviewStatus.REJECTED,
    B2BFinanceReviewStatus.CANCELLED,
  ].includes(status)
}

/**
 * Payment terms status labels
 */
export function getPaymentTermsStatusLabel(status: B2BPaymentTermsStatus): string {
  const labels: Record<B2BPaymentTermsStatus, string> = {
    [B2BPaymentTermsStatus.PENDING_INVOICE]: "Pending Invoice",
    [B2BPaymentTermsStatus.OPEN]: "Invoice Open",
    [B2BPaymentTermsStatus.PARTIALLY_PAID]: "Partially Paid",
    [B2BPaymentTermsStatus.PAID]: "Paid",
    [B2BPaymentTermsStatus.OVERDUE]: "Overdue",
    [B2BPaymentTermsStatus.VOID]: "Void",
  }
  return labels[status]
}

export function getPaymentTermsStatusColor(
  status: B2BPaymentTermsStatus
): "green" | "red" | "blue" | "orange" | "grey" | "purple" {
  const colors: Record<B2BPaymentTermsStatus, "green" | "red" | "blue" | "orange" | "grey" | "purple"> = {
    [B2BPaymentTermsStatus.PENDING_INVOICE]: "blue",
    [B2BPaymentTermsStatus.OPEN]: "orange",
    [B2BPaymentTermsStatus.PARTIALLY_PAID]: "purple",
    [B2BPaymentTermsStatus.PAID]: "green",
    [B2BPaymentTermsStatus.OVERDUE]: "red",
    [B2BPaymentTermsStatus.VOID]: "grey",
  }
  return colors[status]
}

export function getPaymentTermsStatusDescription(status: B2BPaymentTermsStatus): string {
  const descriptions: Record<B2BPaymentTermsStatus, string> = {
    [B2BPaymentTermsStatus.PENDING_INVOICE]: "Waiting for invoice to be generated",
    [B2BPaymentTermsStatus.OPEN]: "Invoice issued, payment due on the specified date",
    [B2BPaymentTermsStatus.PARTIALLY_PAID]: "Partial payment received, balance due",
    [B2BPaymentTermsStatus.PAID]: "Invoice fully paid",
    [B2BPaymentTermsStatus.OVERDUE]: "Payment is overdue, please contact your account manager",
    [B2BPaymentTermsStatus.VOID]: "Invoice is void, no payment required",
  }
  return descriptions[status]
}

/**
 * Check if payment terms obligation requires immediate payment
 */
export function requiresImmediatePayment(
  financeStatus: B2BFinanceReviewStatus
): boolean {
  return financeStatus === B2BFinanceReviewStatus.PREPAYMENT_REQUIRED
}

/**
 * Check if payment is overdue
 */
export function isPaymentOverdue(dueDate: Date | string | null): boolean {
  if (!dueDate) return false
  const due = new Date(dueDate)
  return due < new Date()
}

/**
 * Format payment terms code with readable label
 * e.g., "Net30" -> "Net 30 days"
 */
export function formatPaymentTermsCode(code: string): string {
  if (!code) return "Upon Invoice"

  const match = code.match(/^([A-Za-z]+)(\d+)$/)
  if (!match) return code

  const [, term, days] = match
  const termLabel = term.charAt(0).toUpperCase() + term.slice(1).toLowerCase()
  return `${termLabel} ${days} days`
}
