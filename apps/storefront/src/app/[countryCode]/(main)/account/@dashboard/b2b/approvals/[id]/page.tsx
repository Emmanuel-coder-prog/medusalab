"use client"

import { useEffect, useMemo, useState } from "react"
import { Button, Container, Heading, Input, Text } from "@modules/common/components/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { decidePurchaseRequest, retrievePurchaseRequestForApproval } from "@lib/data/b2b"
import {
  B2BPurchaseApprovalDecision,
  B2BPurchaseRequest,
  B2BPurchaseRequestStatus,
} from "@lib/api/types/b2b"
import {
  getApprovalDecisionLabel,
  getPurchaseRequestStatusColor,
  getPurchaseRequestStatusLabel,
} from "@lib/helpers/b2b-status"

const statusColorClasses: Record<string, string> = {
  yellow: "bg-yellow-100 text-yellow-800",
  blue: "bg-blue-100 text-blue-800",
  orange: "bg-orange-100 text-orange-800",
  red: "bg-red-100 text-red-800",
  green: "bg-green-100 text-green-800",
  gray: "bg-gray-100 text-gray-800",
}

type Props = {
  params: Promise<{ id: string }>
}

export default function ApprovalDetailPage({ params }: Props) {
  const [request, setRequest] = useState<B2BPurchaseRequest | null>(null)
  const [history, setHistory] = useState<any[]>([])
  const [note, setNote] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [decision, setDecision] = useState<"approved" | "rejected" | null>(null)

  useEffect(() => {
    let active = true

    const load = async () => {
      const { id } = await params
      try {
        setIsLoading(true)
        setError(null)
        const details = await retrievePurchaseRequestForApproval(id)
        if (!active) return
        setRequest(details.purchase_request)
        setHistory(details.approval_history || [])
      } catch (err) {
        if (!active) return
        setError(err instanceof Error ? err.message : "Unable to load purchase request.")
      } finally {
        if (active) setIsLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [params])

  const statusBadge = useMemo(() => {
    if (!request) return null
    const color = getPurchaseRequestStatusColor(request.status)
    return (
      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusColorClasses[color]}`}>
        {getPurchaseRequestStatusLabel(request.status)}
      </span>
    )
  }, [request])

  const handleDecision = async (selectedDecision: "approved" | "rejected") => {
    if (!request) return

    setDecision(selectedDecision)
    setIsSubmitting(true)
    setError(null)

    try {
      await decidePurchaseRequest(request.id, selectedDecision, note.trim() || undefined)
      const details = await retrievePurchaseRequestForApproval(request.id)
      setRequest(details.purchase_request)
      setHistory(details.approval_history || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update purchase request.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <Container className="py-12" data-testid="b2b-approval-loading">
        <Heading level="h1">Loading purchase request…</Heading>
      </Container>
    )
  }

  if (error || !request) {
    return (
      <Container className="py-12" data-testid="b2b-approval-error">
        <LocalizedClientLink href="/account/b2b/approvals">
          <Button variant="secondary" className="mb-4">← Back to approvals</Button>
        </LocalizedClientLink>
        <Heading level="h1">Unable to load request</Heading>
        <Text className="mt-3 text-ui-fg-muted">{error || "Purchase request not found."}</Text>
      </Container>
    )
  }

  const nextStatusLabel =
    request.status === B2BPurchaseRequestStatus.PENDING_INTERNAL_APPROVAL
      ? request.policy_snapshot?.requires_merchant_quote === true
        ? "PENDING MERCHANT QUOTE"
        : "PENDING BUYER ACCEPTANCE"
      : request.status === B2BPurchaseRequestStatus.REJECTED
        ? "REJECTED"
        : request.status

  return (
    <Container className="py-12" data-testid="b2b-approval-detail">
      <LocalizedClientLink href="/account/b2b/approvals" className="mb-4 inline-flex">
        <Button variant="secondary">← Back to approvals</Button>
      </LocalizedClientLink>

      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Text className="text-xs uppercase tracking-wide text-ui-fg-muted">Purchase request</Text>
          <Heading level="h1" className="mt-1">{request.reference || request.id}</Heading>
        </div>
        {statusBadge}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-6">
          <div className="rounded-lg border border-gray-200 p-5">
            <Heading level="h3" className="mb-4">Request details</Heading>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Text className="text-ui-fg-muted text-sm">Status flow</Text>
                <Text className="mt-1 font-medium">PENDING APPROVAL → {nextStatusLabel}</Text>
              </div>
              <div>
                <Text className="text-ui-fg-muted text-sm">Requested total</Text>
                <Text className="mt-1">{String(request.requested_total ?? "-")}</Text>
              </div>
              <div>
                <Text className="text-ui-fg-muted text-sm">Currency</Text>
                <Text className="mt-1">{request.currency_code || "-"}</Text>
              </div>
              <div>
                <Text className="text-ui-fg-muted text-sm">Submitted</Text>
                <Text className="mt-1">{request.submitted_at ? new Date(request.submitted_at).toLocaleString() : "-"}</Text>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 p-5">
            <Heading level="h3" className="mb-4">Approval decision</Heading>
            <label className="mb-2 block text-sm font-medium">Optional approval note</label>
            <Input
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Add a brief note for the decision"
              className="mb-4"
            />

            {error ? (
              <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                {error}
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <Button
                variant="primary"
                onClick={() => handleDecision("approved")}
                disabled={isSubmitting || request.status !== B2BPurchaseRequestStatus.PENDING_INTERNAL_APPROVAL}
                isLoading={isSubmitting && decision === "approved"}
              >
                Approve
              </Button>
              <Button
                variant="secondary"
                onClick={() => handleDecision("rejected")}
                disabled={isSubmitting || request.status !== B2BPurchaseRequestStatus.PENDING_INTERNAL_APPROVAL}
                isLoading={isSubmitting && decision === "rejected"}
              >
                Reject
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 p-5">
          <Heading level="h3" className="mb-4">Approval history</Heading>
          {history.length === 0 ? (
            <Text className="text-ui-fg-muted">No prior approval decisions yet.</Text>
          ) : (
            <div className="space-y-3">
              {history.map((entry) => (
                <div key={entry.id} className="rounded border border-gray-200 bg-gray-50 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <Text className="font-medium">{getApprovalDecisionLabel(entry.decision as any)}</Text>
                    <Text className="text-xs text-ui-fg-muted">
                      {entry.decided_at ? new Date(entry.decided_at).toLocaleString() : "-"}
                    </Text>
                  </div>
                  {entry.note ? <Text className="mt-2 text-sm text-ui-fg-muted">{entry.note}</Text> : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Container>
  )
}
