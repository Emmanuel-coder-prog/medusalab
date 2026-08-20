import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Badge, Button, Container, Heading, Input, Text, toast } from "@medusajs/ui"
import { defineRouteConfig } from "@medusajs/admin-sdk"
import { useState } from "react"

type PurchaseRequest = {
  id: string
  reference?: string
  organization_id: string
  customer_id: string
  requested_total?: number | string | null
  currency_code?: string
  status: string
  submitted_at?: string | null
}

const label = (value: string) => value.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())

const PurchaseRequestsPage = () => {
  const queryClient = useQueryClient()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const query = useQuery({
    queryKey: ["b2b-purchase-requests-admin"],
    queryFn: async () => {
      const response = await fetch("/admin/b2b/purchase-requests?take=100")
      if (!response.ok) throw new Error("Unable to load purchase requests")
      return (await response.json()) as { purchase_requests: PurchaseRequest[] }
    },
  })

  const act = async (request: PurchaseRequest, action: "offer" | "reject") => {
    setBusyId(request.id)
    try {
      const response = await fetch(`/admin/b2b/purchase-requests/${request.id}/${action}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(action === "offer" ? { note: notes[request.id] || undefined } : { reason: notes[request.id] || "Rejected by merchant" }),
      })
      if (!response.ok) throw new Error(`Unable to ${action} purchase request`)
      toast.success(action === "offer" ? "Quote offer sent" : "Purchase request rejected")
      await queryClient.invalidateQueries({ queryKey: ["b2b-purchase-requests-admin"] })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Purchase request action failed")
    } finally {
      setBusyId(null)
    }
  }

  const requests = query.data?.purchase_requests ?? []

  return (
    <Container className="py-8">
      <Heading>Purchase Requests</Heading>
      <Text className="text-ui-fg-subtle mt-2 mb-6">Send merchant quotes or reject requests through the existing backend workflows.</Text>
      {query.isError && <Text className="text-ui-fg-error mb-4">Unable to load purchase requests.</Text>}
      <div className="rounded-lg border border-ui-border-base divide-y divide-ui-border-base">
        {requests.length === 0 ? <Text className="p-4 text-ui-fg-subtle">No purchase requests returned.</Text> : requests.map((request) => (
          <div key={request.id} className="p-4">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <Text className="font-medium">{request.reference || request.id}</Text>
                <Text className="text-sm text-ui-fg-subtle mt-1">Organization: {request.organization_id} · Customer: {request.customer_id}</Text>
                <Text className="text-sm mt-2">{request.requested_total ?? "—"} {request.currency_code ?? ""} · Submitted: {request.submitted_at ? new Date(request.submitted_at).toLocaleString() : "—"}</Text>
              </div>
              <Badge>{label(request.status)}</Badge>
            </div>
            <div className="flex flex-col gap-2 md:flex-row md:items-center mt-4">
              <Input placeholder="Quote note or rejection reason" value={notes[request.id] ?? ""} onChange={(event) => setNotes((current) => ({ ...current, [request.id]: event.target.value }))} />
              <Button size="small" disabled={busyId === request.id} onClick={() => act(request, "offer")}>Send Quote</Button>
              <Button size="small" variant="danger" disabled={busyId === request.id} onClick={() => act(request, "reject")}>Reject</Button>
            </div>
          </div>
        ))}
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({ label: "Purchase Requests" })
export default PurchaseRequestsPage
