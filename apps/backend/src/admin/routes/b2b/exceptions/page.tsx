import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Badge, Button, Container, Heading, Text, toast } from "@medusajs/ui"
import { defineRouteConfig } from "@medusajs/admin-sdk"
import { useState } from "react"

type ExceptionRecord = {
  type: string
  severity: string
  reference: string
  order_display_id?: string | number
  organization_id?: string
  status?: string
  reason?: string
  note?: string
  available_actions?: string[]
}

const label = (value?: string) => value ? value.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "—"

const ExceptionsPage = () => {
  const queryClient = useQueryClient()
  const [busyId, setBusyId] = useState<string | null>(null)
  const query = useQuery({
    queryKey: ["b2b-exceptions-admin"],
    queryFn: async () => {
      const response = await fetch("/admin/b2b/exceptions")
      if (!response.ok) throw new Error("Unable to load exceptions")
      return (await response.json()) as { exceptions: ExceptionRecord[]; total: number; summary: { critical: number; warning: number } }
    },
  })
  const data = query.data

  const recover = async (entityId: string, action: string) => {
    setBusyId(entityId)
    try {
      const response = await fetch("/admin/b2b/recovery", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ entity_id: entityId, action }),
      })
      if (!response.ok) throw new Error("Recovery action failed")
      toast.success("Recovery action recorded")
      await queryClient.invalidateQueries({ queryKey: ["b2b-exceptions-admin"] })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Recovery action failed")
    } finally {
      setBusyId(null)
    }
  }

  return (
    <Container className="py-8">
      <Heading>Exceptions & Reconciliation</Heading>
      <Text className="text-ui-fg-subtle mt-2 mb-6">Backend-generated operational exceptions. Recovery controls are shown only when supported by an existing endpoint.</Text>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="rounded-lg border border-ui-border-base p-4"><Text className="text-ui-fg-subtle">Total</Text><Text className="text-2xl font-semibold mt-2">{data?.total ?? "…"}</Text></div>
        <div className="rounded-lg border border-ui-border-base p-4"><Text className="text-ui-fg-subtle">Critical</Text><Text className="text-2xl font-semibold mt-2">{data?.summary.critical ?? "…"}</Text></div>
        <div className="rounded-lg border border-ui-border-base p-4"><Text className="text-ui-fg-subtle">Warnings</Text><Text className="text-2xl font-semibold mt-2">{data?.summary.warning ?? "…"}</Text></div>
      </div>
      {query.isError && <Text className="text-ui-fg-error mb-4">Unable to load exceptions.</Text>}
      <div className="rounded-lg border border-ui-border-base divide-y divide-ui-border-base">
        {(data?.exceptions ?? []).length === 0 ? <Text className="p-4 text-ui-fg-subtle">No exceptions returned.</Text> : data?.exceptions.map((exception) => (
          <div key={exception.reference} className="p-4">
            <div className="flex items-start justify-between gap-3"><div><Text className="font-medium">{label(exception.type)}</Text><Text className="text-sm text-ui-fg-subtle mt-1">Order: {exception.order_display_id ?? "—"} · Organization: {exception.organization_id ?? "—"}</Text></div><Badge>{label(exception.severity)}</Badge></div>
            <Text className="text-sm mt-3">Status: {label(exception.status)}</Text>
            {(exception.reason || exception.note) && <Text className="text-sm text-ui-fg-subtle mt-1">{exception.reason ?? exception.note}</Text>}
            <Text className="text-xs text-ui-fg-subtle mt-3">Available actions: {exception.available_actions?.join(", ") || "None"}.</Text>
            <div className="flex flex-wrap gap-2 mt-3">
              {exception.type === "warehouse_dispatch_failed" && <Button size="small" disabled={busyId === exception.reference} onClick={() => recover(exception.reference, "retry_fulfillment")}>Retry handoff</Button>}
              {exception.type === "release_not_dispatched" && <Button size="small" disabled={busyId === exception.reference} onClick={() => recover(exception.reference, "requeue_fulfillment")}>Requeue handoff</Button>}
              {exception.type === "blocked_order_release" && <Button size="small" disabled={busyId === exception.reference} onClick={() => recover(exception.reference, "override_release")}>Override release</Button>}
              {(exception.type === "finance_review_expired" || exception.type === "finance_pending_too_long") && <Button size="small" disabled={busyId === exception.reference} onClick={() => recover(exception.reference, "escalate_finance")}>Escalate finance</Button>}
              <Button size="small" variant="secondary" disabled={busyId === exception.reference} onClick={() => recover(exception.reference, "acknowledge_exception")}>Acknowledge</Button>
              <Button size="small" variant="secondary" disabled={busyId === exception.reference} onClick={() => recover(exception.reference, "snooze_exception")}>Snooze 24h</Button>
            </div>
          </div>
        ))}
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({ label: "B2B Exceptions" })
export default ExceptionsPage
