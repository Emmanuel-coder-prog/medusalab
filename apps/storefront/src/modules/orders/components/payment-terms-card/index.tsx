"use client"

import { Badge, Text, Heading, Container } from "@modules/common/components/ui"
import {
  getPaymentTermsStatusLabel,
  getPaymentTermsStatusColor,
  getPaymentTermsStatusDescription,
  formatPaymentTermsCode,
  isPaymentOverdue,
} from "@lib/helpers/b2b-status"
import { B2BPaymentTermsStatus, B2BFinanceReviewStatus } from "@lib/api/types/b2b"
import { convertToLocale } from "@lib/util/money"
import { ReactNode } from "react"

type PaymentTermsCardProps = {
  financeStatus: B2BFinanceReviewStatus
  paymentTermsObligation: any
  children?: ReactNode
}

/**
 * Displays payment terms and current payment status
 * Handles both FLOW A (approved on account) and FLOW B (prepayment)
 */
export const PaymentTermsCard = ({
  financeStatus,
  paymentTermsObligation,
  children,
}: PaymentTermsCardProps) => {
  if (!paymentTermsObligation) {
    return null
  }

  const {
    amount_due,
    currency_code,
    payment_terms_code,
    due_at,
    status,
    external_invoice_id,
    opened_at,
  } = paymentTermsObligation

  const statusLabel = getPaymentTermsStatusLabel(
    status as B2BPaymentTermsStatus
  )
  const statusColor = getPaymentTermsStatusColor(
    status as B2BPaymentTermsStatus
  )
  const statusDescription = getPaymentTermsStatusDescription(
    status as B2BPaymentTermsStatus
  )
  const termsCodeFormatted = formatPaymentTermsCode(payment_terms_code)
  const isOverdue = isPaymentOverdue(due_at)

  return (
    <Container className="border border-gray-200 rounded-lg p-6 bg-white">
      <div className="flex items-start justify-between mb-6">
        <div>
          <Heading level="h3" className="text-lg font-semibold mb-2">
            Payment Terms
          </Heading>
          <Badge color={statusColor}>{statusLabel}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Terms Code */}
        <div>
          <Text className="text-sm text-ui-fg-subtle mb-2">Terms</Text>
          <Text className="font-medium">{termsCodeFormatted}</Text>
        </div>

        {/* Amount Due */}
        <div>
          <Text className="text-sm text-ui-fg-subtle mb-2">Amount Due</Text>
          <Text className="font-medium text-lg">
            {convertToLocale({
              amount: amount_due,
              currency_code,
            })}
          </Text>
        </div>

        {/* Due Date */}
        {due_at && (
          <div>
            <Text className="text-sm text-ui-fg-subtle mb-2">Due Date</Text>
            <Text className={`font-medium ${isOverdue ? "text-red-700" : ""}`}>
              {new Date(due_at).toLocaleDateString()}
              {isOverdue && <span className="ml-2 text-red-700">(Overdue)</span>}
            </Text>
          </div>
        )}

        {/* Invoice Reference */}
        {external_invoice_id && (
          <div>
            <Text className="text-sm text-ui-fg-subtle mb-2">Invoice #</Text>
            <Text className="font-mono text-sm">{external_invoice_id}</Text>
          </div>
        )}
      </div>

      {/* Status Description */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
        <Text className="text-sm text-blue-900">{statusDescription}</Text>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-6 text-sm border-t pt-6">
        {opened_at && (
          <div>
            <Text className="text-ui-fg-subtle">Invoice Date</Text>
            <Text className="text-ui-fg-base">
              {new Date(opened_at).toLocaleDateString()}
            </Text>
          </div>
        )}

        {financeStatus === B2BFinanceReviewStatus.PREPAYMENT_REQUIRED && (
          <div>
            <Text className="text-ui-fg-subtle">Payment Type</Text>
            <Text className="font-medium text-orange-700">Prepayment Required</Text>
          </div>
        )}

        {financeStatus === B2BFinanceReviewStatus.APPROVED_ON_ACCOUNT && (
          <div>
            <Text className="text-ui-fg-subtle">Payment Type</Text>
            <Text className="font-medium text-green-700">Account Terms</Text>
          </div>
        )}
      </div>

      {/* Additional Actions */}
      {children && <div className="mt-6 pt-6 border-t">{children}</div>}
    </Container>
  )
}

export default PaymentTermsCard
