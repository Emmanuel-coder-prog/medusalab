"use client"

import { useMemo, useState } from "react"
import { Button, Heading, Input, Text } from "@modules/common/components/ui"
import { convertToLocale } from "@lib/util/money"
import { submitB2BPurchaseRequest } from "@lib/data/b2b"
import { useB2BCartContext } from "@lib/hooks/use-b2b-cart-context"
import {
  getPurchaseRequestStatusColor,
  getPurchaseRequestStatusDescription,
  getPurchaseRequestStatusLabel,
} from "@lib/helpers/b2b-status"
import { B2BOrganizationWithRole, B2BPurchaseRequestStatus } from "@lib/api/types/b2b"

const statusColorClasses: Record<string, string> = {
  yellow: "bg-yellow-100 text-yellow-800",
  blue: "bg-blue-100 text-blue-800",
  orange: "bg-orange-100 text-orange-800",
  red: "bg-red-100 text-red-800",
  green: "bg-green-100 text-green-800",
  gray: "bg-gray-100 text-gray-800",
}

type B2BPurchaseRequestCardProps = {
  cart: any
  organization: B2BOrganizationWithRole
}

export default function B2BPurchaseRequestCard({
  cart,
  organization,
}: B2BPurchaseRequestCardProps) {
  const [purchaseOrderNumber, setPurchaseOrderNumber] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submittedRequest, setSubmittedRequest] = useState<any | null>(null)
  const { selectedOrganization } = useB2BCartContext()

  const isGovernedPurchase = useMemo(() => {
    if (!selectedOrganization) {
      return false
    }

    return Boolean(
      organization.id === selectedOrganization.id &&
        cart?.total != null &&
        cart?.currency_code
    )
  }, [cart, organization.id, selectedOrganization])

  const submitRequest = async () => {
    if (!cart?.id) {
      setError("This cart is not ready for a purchase request.")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const result = await submitB2BPurchaseRequest(
        cart.id,
        purchaseOrderNumber.trim() || undefined
      )

      setSubmittedRequest(result?.purchase_request ?? null)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to submit your purchase request."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submittedRequest) {
    const status = submittedRequest.status as B2BPurchaseRequestStatus
    const color = getPurchaseRequestStatusColor(status)
    const label = getPurchaseRequestStatusLabel(status)
    const description = getPurchaseRequestStatusDescription(status)

    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3" data-testid="b2b-purchase-request-confirmation">
        <div className="flex items-center justify-between gap-3">
          <Heading level="h3" className="text-lg">
            Purchase request submitted
          </Heading>
          <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusColorClasses[color]}`}>
            {label}
          </span>
        </div>

        <Text className="text-sm text-ui-fg-subtle">{description}</Text>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <Text className="text-ui-fg-muted">Organization</Text>
            <Text>{organization.display_name}</Text>
          </div>
          <div>
            <Text className="text-ui-fg-muted">Requested total</Text>
            <Text>{convertToLocale({ amount: Number(cart.total ?? 0), currency_code: cart.currency_code ?? "USD" })}</Text>
          </div>
          {submittedRequest.purchase_order_number ? (
            <div className="col-span-2">
              <Text className="text-ui-fg-muted">Purchase order number</Text>
              <Text>{submittedRequest.purchase_order_number}</Text>
            </div>
          ) : null}
          {submittedRequest.expires_at ? (
            <div className="col-span-2">
              <Text className="text-ui-fg-muted">Expires</Text>
              <Text>{new Date(submittedRequest.expires_at).toLocaleDateString()}</Text>
            </div>
          ) : null}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-4" data-testid="b2b-purchase-request-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Text className="text-sm font-medium text-blue-800">Governed B2B purchase</Text>
          <Heading level="h3" className="text-lg text-blue-950">
            Submit purchase request
          </Heading>
        </div>
        <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
          {organization.display_name}
        </span>
      </div>

      <Text className="text-sm text-blue-900">
        This cart is governed by your selected organization and must be submitted as a purchase request instead of direct checkout.
      </Text>

      <div className="space-y-2">
        <Text className="text-sm text-ui-fg-muted">Requested total</Text>
        <Text className="text-lg font-semibold">
          {convertToLocale({ amount: Number(cart.total ?? 0), currency_code: cart.currency_code ?? "USD" })}
        </Text>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-ui-fg-base" htmlFor="purchase-order-number">
          Purchase order number (optional)
        </label>
        <Input
          id="purchase-order-number"
          value={purchaseOrderNumber}
          onChange={(event) => setPurchaseOrderNumber(event.target.value)}
          placeholder="PO-12345"
          className="w-full"
        />
      </div>

      {error ? (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      <Button
        className="w-full h-10"
        onClick={submitRequest}
        disabled={isSubmitting || !isGovernedPurchase}
      >
        {isSubmitting ? "Submitting..." : "Submit purchase request"}
      </Button>
    </div>
  )
}
