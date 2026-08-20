"use client"

import { useState } from "react"
import { Button, Text, Heading } from "@modules/common/components/ui"
import { convertToLocale } from "@lib/util/money"
import { B2BPaymentTermsStatus } from "@lib/api/types/b2b"

type PrepaymentFormProps = {
  orderId: string
  paymentTermsObligation: any
  onPaymentSuccess?: () => void
}

/**
 * Prepayment form for FLOW B
 * Allows buyer to pay immediately when prepayment is required
 * Uses Medusa's payment collection flow
 */
export const PrepaymentForm = ({
  orderId,
  paymentTermsObligation,
  onPaymentSuccess,
}: PrepaymentFormProps) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!paymentTermsObligation) {
    return null
  }

  const { amount_due, currency_code, status } = paymentTermsObligation

  // Only show prepayment form for open invoices that haven't been fully paid
  if (
    status !== B2BPaymentTermsStatus.PENDING_INVOICE &&
    status !== B2BPaymentTermsStatus.OPEN &&
    status !== B2BPaymentTermsStatus.PARTIALLY_PAID
  ) {
    return null
  }

  const handlePayNow = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Redirect to payment collection flow
      // In a real implementation, this would:
      // 1. Call an endpoint to initialize payment collection session
      // 2. Redirect to payment provider (Stripe, etc.)
      // 3. Handle payment confirmation webhook
      
      // For now, we'll navigate to the order's payment collection flow
      window.location.href = `/order/${orderId}/pay`
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to initiate payment"
      )
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
      <Heading level="h3" className="text-lg font-semibold mb-2">
        Prepayment Required
      </Heading>
      <Text className="text-sm text-ui-fg-muted mb-4">
        This order requires prepayment before it can be fulfilled.
      </Text>

      <div className="bg-white rounded-md p-4 mb-4">
        <div className="flex justify-between items-center">
          <Text className="font-medium">Amount to Pay</Text>
          <Text className="text-xl font-bold">
            {convertToLocale({
              amount: amount_due,
              currency_code,
            })}
          </Text>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
          <Text className="text-sm text-red-700">{error}</Text>
        </div>
      )}

      <Button
        onClick={handlePayNow}
        disabled={isLoading}
        className="w-full"
        data-testid="prepayment-pay-button"
      >
        {isLoading ? "Processing..." : "Pay Now"}
      </Button>

      <Text className="text-xs text-ui-fg-subtle mt-4 text-center">
        Your order will be eligible for warehouse release once payment is confirmed.
      </Text>
    </div>
  )
}

export default PrepaymentForm
