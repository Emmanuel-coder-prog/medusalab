"use client"

import { useState } from "react"
import { acceptQuote } from "@lib/data/b2b"
import { Button, Text } from "@modules/common/components/ui"

type Props = {
  purchaseRequestId: string
}

export default function QuoteAcceptanceActions({ purchaseRequestId }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleAccept = async () => {
    setIsSubmitting(true)
    setError(null)

    try {
      const result = await acceptQuote(purchaseRequestId)
      
      if (result.purchase_request?.status === "converted") {
        setSuccess(true)
      } else {
        setError("Unexpected response. Please refresh and try again.")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to accept quote. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="rounded border border-green-300 bg-green-50 p-3">
        <Text className="font-medium text-green-900">Quote accepted successfully!</Text>
        <Text className="mt-2 text-sm text-green-800">
          Please refresh the page to see your order details.
        </Text>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded border border-red-200 bg-red-50 p-3">
          <Text className="text-sm text-red-800">{error}</Text>
        </div>
      )}
      <Button
        variant="primary"
        onClick={handleAccept}
        disabled={isSubmitting}
        isLoading={isSubmitting}
        className="w-full"
      >
        {isSubmitting ? "Accepting Quote..." : "Accept Quote"}
      </Button>
    </div>
  )
}
