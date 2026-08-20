"use client"

import { useState } from "react"
import { Button, Heading, Text, Input } from "@modules/common/components/ui"
import { convertToLocale } from "@lib/util/money"
import {
  getPurchaseRequestStatusLabel,
  getPurchaseRequestStatusColor,
  getPurchaseRequestStatusDescription,
} from "@lib/helpers/b2b-status"
import { sendB2BQuoteOffer, rejectB2BPurchaseRequest } from "@lib/data/b2b-admin"
import type { B2BPurchaseRequest } from "@lib/api/types/b2b"

const statusColorClasses: Record<string, string> = {
  yellow: "bg-yellow-100 text-yellow-800",
  blue: "bg-blue-100 text-blue-800",
  orange: "bg-orange-100 text-orange-800",
  red: "bg-red-100 text-red-800",
  green: "bg-green-100 text-green-800",
  gray: "bg-gray-100 text-gray-800",
}

interface PurchaseRequestDetailProps {
  purchaseRequest: B2BPurchaseRequest
}

export default function PurchaseRequestDetail({
  purchaseRequest,
}: PurchaseRequestDetailProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const [isRejecting, setIsRejecting] = useState(false)

  const status = getPurchaseRequestStatusLabel(purchaseRequest.status)
  const color = getPurchaseRequestStatusColor(purchaseRequest.status)
  const description = getPurchaseRequestStatusDescription(
    purchaseRequest.status
  )

  const cartSnapshot = (purchaseRequest.cart_snapshot ||
    {}) as Record<string, any>
  const policySnapshot = (purchaseRequest.policy_snapshot ||
    {}) as Record<string, any>

  const handleSendOffer = async () => {
    setIsSubmitting(true)
    setError(null)

    try {
      await sendB2BQuoteOffer(purchaseRequest.id, {})
      // In a real app, you'd refetch or navigate
      alert("Quote offer sent successfully!")
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to send quote offer"
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRejectClick = () => {
    setShowRejectModal(true)
    setRejectReason("")
  }

  const handleRejectConfirm = async () => {
    if (!rejectReason.trim()) {
      setError("Please provide a rejection reason")
      return
    }

    setIsRejecting(true)
    setError(null)

    try {
      await rejectB2BPurchaseRequest(purchaseRequest.id, {
        reason: rejectReason,
      })
      // In a real app, you'd refetch or navigate
      alert("Quote request rejected successfully!")
      setShowRejectModal(false)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to reject quote request"
      )
    } finally {
      setIsRejecting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start gap-4">
        <div>
          <Heading level="h1" className="mb-2">
            {purchaseRequest.reference || purchaseRequest.id}
          </Heading>
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${
                statusColorClasses[color]
              }`}
            >
              {status}
            </span>
            <Text className="text-ui-fg-muted">{description}</Text>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border border-gray-200 rounded-lg p-6">
          <Heading level="h3" className="mb-4 text-lg">
            Request Details
          </Heading>

          <div className="space-y-4">
            <div>
              <Text className="text-ui-fg-muted text-sm mb-1">
                Customer ID
              </Text>
              <Text className="font-mono">{purchaseRequest.customer_id}</Text>
            </div>

            <div>
              <Text className="text-ui-fg-muted text-sm mb-1">
                Organization ID
              </Text>
              <Text className="font-mono">
                {purchaseRequest.organization_id}
              </Text>
            </div>

            <div>
              <Text className="text-ui-fg-muted text-sm mb-1">
                Purchase Order Number
              </Text>
              <Text>
                {purchaseRequest.purchase_order_number || "—"}
              </Text>
            </div>

            <div>
              <Text className="text-ui-fg-muted text-sm mb-1">
                Submitted
              </Text>
              <Text>
                {purchaseRequest.submitted_at
                  ? new Date(purchaseRequest.submitted_at).toLocaleString()
                  : "—"}
              </Text>
            </div>

            {purchaseRequest.expires_at && (
              <div>
                <Text className="text-ui-fg-muted text-sm mb-1">
                  Expires
                </Text>
                <Text
                  className={
                    new Date(purchaseRequest.expires_at) < new Date()
                      ? "text-red-600 font-semibold"
                      : ""
                  }
                >
                  {new Date(purchaseRequest.expires_at).toLocaleString()}
                </Text>
              </div>
            )}
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-6">
          <Heading level="h3" className="mb-4 text-lg">
            Requested Total
          </Heading>

          <div className="space-y-4">
            <div>
              <Text className="text-ui-fg-muted text-sm mb-2">Amount</Text>
              <Text className="text-2xl font-bold">
                {convertToLocale({
                  amount: Number(purchaseRequest.requested_total ?? 0),
                  currency_code: purchaseRequest.currency_code ?? "USD",
                })}
              </Text>
            </div>

            <div>
              <Text className="text-ui-fg-muted text-sm mb-1">Currency</Text>
              <Text>{purchaseRequest.currency_code ?? "USD"}</Text>
            </div>

            {purchaseRequest.draft_order_id && (
              <div>
                <Text className="text-ui-fg-muted text-sm mb-1">
                  Draft Order ID
                </Text>
                <Text className="font-mono text-xs break-all">
                  {purchaseRequest.draft_order_id}
                </Text>
                <Text className="text-xs text-ui-fg-muted mt-2">
                  Use this ID to edit the draft order in Medusa admin
                </Text>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cart Snapshot */}
      {cartSnapshot.items && Array.isArray(cartSnapshot.items) && (
        <div className="border border-gray-200 rounded-lg p-6">
          <Heading level="h3" className="mb-4 text-lg">
            Cart Items
          </Heading>

          <div className="space-y-3">
            {cartSnapshot.items.map((item: any, idx: number) => (
              <div
                key={idx}
                className="flex justify-between items-start border-b border-gray-100 pb-3 last:border-0"
              >
                <div className="flex-1">
                  <Text className="font-medium">{item.title}</Text>
                  <Text className="text-sm text-ui-fg-muted">
                    Qty: {item.quantity}
                  </Text>
                </div>
                <Text className="font-semibold">
                  {convertToLocale({
                    amount: Number(item.total ?? 0) / 100,
                    currency_code: purchaseRequest.currency_code ?? "USD",
                  })}
                </Text>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Policy Snapshot */}
      {Object.keys(policySnapshot).length > 0 && (
        <div className="border border-gray-200 rounded-lg p-6">
          <Heading level="h3" className="mb-4 text-lg">
            Approval Policy
          </Heading>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <Text className="text-ui-fg-muted">Approval Threshold</Text>
              <Text>
                {policySnapshot.approval_threshold
                  ? convertToLocale({
                      amount: Number(
                        policySnapshot.approval_threshold
                      ),
                      currency_code:
                        policySnapshot.approval_currency_code ?? "USD",
                    })
                  : "None"}
              </Text>
            </div>

            <div className="flex justify-between">
              <Text className="text-ui-fg-muted">Requires Merchant Quote</Text>
              <Text>
                {policySnapshot.requires_merchant_quote === true
                  ? "Yes"
                  : "No"}
              </Text>
            </div>

            <div className="flex justify-between">
              <Text className="text-ui-fg-muted">Quote Validity (days)</Text>
              <Text>{policySnapshot.quote_validity_days ?? "7"}</Text>
            </div>

            <div className="flex justify-between">
              <Text className="text-ui-fg-muted">Policy Version</Text>
              <Text>{policySnapshot.policy_version ?? "1"}</Text>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-6 border-t border-gray-200">
        <Button
          variant="primary"
          onClick={handleSendOffer}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Sending..." : "Send Offer"}
        </Button>

        <Button
          variant="secondary"
          onClick={handleRejectClick}
          disabled={isRejecting}
        >
          Reject Quote
        </Button>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4 p-6">
            <Heading level="h3" className="mb-4">
              Reject Quote Request
            </Heading>

            <div className="space-y-4 mb-6">
              <div>
                <Text className="text-sm font-medium mb-2">Reason</Text>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Why are you rejecting this quote?"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => setShowRejectModal(false)}
                className="flex-1"
                disabled={isRejecting}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleRejectConfirm}
                className="flex-1"
                disabled={isRejecting}
              >
                {isRejecting ? "Rejecting..." : "Confirm Rejection"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
