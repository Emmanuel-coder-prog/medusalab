"use client"

import { Badge, Text } from "@modules/common/components/ui"
import {
  getPaymentTermsStatusLabel,
  getPaymentTermsStatusColor,
  isPaymentOverdue,
} from "@lib/helpers/b2b-status"
import { B2BPaymentTermsStatus, B2BFinanceReviewStatus } from "@lib/api/types/b2b"

type PaymentStatusSummaryProps = {
  financeStatus?: B2BFinanceReviewStatus
  paymentTermsObligation?: any
  compact?: boolean
}

/**
 * Quick payment status summary for use in lists and sidebars
 * Shows payment state without full details
 */
export const PaymentStatusSummary = ({
  financeStatus,
  paymentTermsObligation,
  compact = false,
}: PaymentStatusSummaryProps) => {
  if (!financeStatus) {
    return null
  }

  // FLOW B: Prepayment Required
  if (financeStatus === B2BFinanceReviewStatus.PREPAYMENT_REQUIRED) {
    return (
      <div className={compact ? "flex items-center gap-2" : ""}>
        <Badge color="orange">Prepayment Required</Badge>
        {!compact && (
          <Text className="text-xs text-ui-fg-subtle mt-1">
            Payment must be completed before fulfillment
          </Text>
        )}
      </div>
    )
  }

  // FLOW A: Approved on Account
  if (financeStatus === B2BFinanceReviewStatus.APPROVED_ON_ACCOUNT) {
    if (!paymentTermsObligation) {
      return (
        <div className={compact ? "flex items-center gap-2" : ""}>
          <Badge color="green">Account Terms</Badge>
          {!compact && (
            <Text className="text-xs text-ui-fg-subtle mt-1">
              Invoice and payment terms have been applied
            </Text>
          )}
        </div>
      )
    }

    const { status, due_at } = paymentTermsObligation
    const statusLabel = getPaymentTermsStatusLabel(
      status as B2BPaymentTermsStatus
    )
    const statusColor = getPaymentTermsStatusColor(
      status as B2BPaymentTermsStatus
    )
    const isOverdue = isPaymentOverdue(due_at)

    return (
      <div className={compact ? "flex items-center gap-2" : ""}>
        <Badge color={isOverdue ? "red" : statusColor}>
          {isOverdue ? "Overdue" : statusLabel}
        </Badge>
        {!compact && due_at && (
          <Text className={`text-xs mt-1 ${isOverdue ? "text-red-700 font-medium" : "text-ui-fg-subtle"}`}>
            Due: {new Date(due_at).toLocaleDateString()}
          </Text>
        )}
      </div>
    )
  }

  // Other finance statuses
  if (financeStatus === B2BFinanceReviewStatus.PENDING) {
    return (
      <Badge color="blue">Awaiting Finance Review</Badge>
    )
  }

  if (financeStatus === B2BFinanceReviewStatus.REJECTED) {
    return (
      <Badge color="red">Finance Rejected</Badge>
    )
  }

  if (financeStatus === B2BFinanceReviewStatus.MANUAL_REVIEW) {
    return (
      <Badge color="orange">Manual Review Required</Badge>
    )
  }

  return null
}

export default PaymentStatusSummary
