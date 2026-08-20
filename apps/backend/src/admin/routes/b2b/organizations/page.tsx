import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Badge, Button, Container, Heading, Input, Select, Text, toast } from "@medusajs/ui"
import { defineRouteConfig } from "@medusajs/admin-sdk"
import { useState } from "react"

const statuses = ["pending", "active", "suspended", "archived"]
const roles = ["owner", "buyer", "approver", "finance", "viewer"]

type Organization = {
  id: string
  legal_name: string
  display_name: string
  handle: string
  status: string
  sales_channel_id: string
  approval_threshold?: number | string | null
  approval_currency_code?: string | null
  requires_merchant_quote: boolean
  quote_validity_days: number
}

type Member = { id: string; customer_id: string; role: string; status: string }
type FinanceAccount = { id: string; currency_code: string; status: string; payment_terms_code?: string | null; approved_credit_limit?: number | string | null; requires_manual_review: boolean }

const OrganizationsPage = () => {
  const queryClient = useQueryClient()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [memberCustomerId, setMemberCustomerId] = useState("")
  const [memberRole, setMemberRole] = useState("buyer")
  const [accountCurrency, setAccountCurrency] = useState("usd")
  const organizationsQuery = useQuery({
    queryKey: ["b2b-admin-organizations"],
    queryFn: async () => {
      const response = await fetch("/admin/b2b/organizations")
      if (!response.ok) throw new Error("Unable to load organizations")
      return (await response.json()) as { organizations: Organization[] }
    },
  })
  const detailQuery = useQuery({
    queryKey: ["b2b-admin-organization", selectedId],
    enabled: Boolean(selectedId),
    queryFn: async () => {
      const response = await fetch(`/admin/b2b/organizations/${selectedId}`)
      if (!response.ok) throw new Error("Unable to load organization")
      return (await response.json()) as { organization: Organization; members: Member[] }
    },
  })
  const financeQuery = useQuery({
    queryKey: ["b2b-admin-finance-account", selectedId],
    enabled: Boolean(selectedId),
    queryFn: async () => {
      const response = await fetch(`/admin/b2b/organizations/${selectedId}/finance-account`)
      if (!response.ok) throw new Error("Unable to load finance account")
      return (await response.json()) as { finance_accounts: FinanceAccount[] }
    },
  })

  const updateOrganization = async (patch: Record<string, unknown>) => {
    if (!selectedId) return
    setBusy(true)
    try {
      const response = await fetch(`/admin/b2b/organizations/${selectedId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(patch),
      })
      if (!response.ok) throw new Error("Unable to update organization")
      toast.success("Organization updated")
      await queryClient.invalidateQueries({ queryKey: ["b2b-admin-organizations"] })
      await queryClient.invalidateQueries({ queryKey: ["b2b-admin-organization", selectedId] })
      await queryClient.invalidateQueries({ queryKey: ["b2b-admin-finance-account", selectedId] })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Organization update failed")
    } finally {
      setBusy(false)
    }
  }

  const addMember = async () => {
    if (!selectedId || !memberCustomerId.trim()) return
    setBusy(true)
    try {
      const response = await fetch(`/admin/b2b/organizations/${selectedId}/members`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ customer_id: memberCustomerId.trim(), role: memberRole, status: "active" }),
      })
      if (!response.ok) throw new Error("Unable to add member")
      setMemberCustomerId("")
      toast.success("Member added")
      await queryClient.invalidateQueries({ queryKey: ["b2b-admin-organization", selectedId] })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Member creation failed")
    } finally {
      setBusy(false)
    }
  }

  const updateMember = async (memberId: string, patch: Record<string, string>) => {
    if (!selectedId) return
    setBusy(true)
    try {
      const response = await fetch(`/admin/b2b/organizations/${selectedId}/members/${memberId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(patch),
      })
      if (!response.ok) throw new Error("Unable to update member")
      await queryClient.invalidateQueries({ queryKey: ["b2b-admin-organization", selectedId] })
      toast.success("Member updated")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Member update failed")
    } finally {
      setBusy(false)
    }
  }

  const createFinanceAccount = async () => {
    if (!selectedId || !accountCurrency.trim()) return
    setBusy(true)
    try {
      const response = await fetch(`/admin/b2b/organizations/${selectedId}/finance-account`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ currency_code: accountCurrency.trim().toLowerCase() }),
      })
      if (!response.ok) throw new Error("Unable to create finance account")
      await queryClient.invalidateQueries({ queryKey: ["b2b-admin-finance-account", selectedId] })
      toast.success("Finance account created")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Finance account creation failed")
    } finally {
      setBusy(false)
    }
  }

  const selected = detailQuery.data?.organization
  const members = detailQuery.data?.members ?? []
  const financeAccount = financeQuery.data?.finance_accounts?.[0]

  return (
    <Container className="py-8">
      <Heading>B2B Organizations</Heading>
      <Text className="text-ui-fg-subtle mt-2 mb-6">Configure organization status, approval policy, quote policy, members, and roles.</Text>
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(240px,0.7fr)_minmax(0,1.3fr)] gap-6">
        <div className="rounded-lg border border-ui-border-base divide-y divide-ui-border-base">
          {(organizationsQuery.data?.organizations ?? []).map((organization) => (
            <button key={organization.id} type="button" className={`w-full text-left p-4 ${selectedId === organization.id ? "bg-ui-bg-subtle" : ""}`} onClick={() => setSelectedId(organization.id)}>
              <Text className="font-medium">{organization.display_name}</Text>
              <Text className="text-sm text-ui-fg-subtle mt-1">{organization.handle}</Text>
              <Badge className="mt-2">{organization.status}</Badge>
            </button>
          ))}
          {(organizationsQuery.data?.organizations ?? []).length === 0 && <Text className="p-4 text-ui-fg-subtle">No organizations returned.</Text>}
        </div>
        {!selected ? <Text className="text-ui-fg-subtle">Select an organization to configure it.</Text> : <div className="space-y-6">
          <section className="rounded-lg border border-ui-border-base p-5">
            <Heading level="h2">{selected.display_name}</Heading>
            <Text className="text-ui-fg-subtle mt-1">{selected.legal_name} · {selected.handle}</Text>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
              <label className="text-sm">Status<Select value={selected.status} onValueChange={(value) => updateOrganization({ status: value })}><Select.Trigger className="mt-1" /><Select.Content>{statuses.map((status) => <Select.Item key={status} value={status}>{status}</Select.Item>)}</Select.Content></Select></label>
              <label className="text-sm">Approval currency<Input className="mt-1" defaultValue={selected.approval_currency_code ?? ""} onBlur={(event) => updateOrganization({ approval_currency_code: event.target.value || null })} /></label>
              <label className="text-sm">Approval threshold<Input className="mt-1" type="number" defaultValue={String(selected.approval_threshold ?? "")} onBlur={(event) => updateOrganization({ approval_threshold: event.target.value ? Number(event.target.value) : null })} /></label>
              <label className="text-sm">Quote validity days<Input className="mt-1" type="number" defaultValue={String(selected.quote_validity_days)} onBlur={(event) => updateOrganization({ quote_validity_days: Number(event.target.value) })} /></label>
            </div>
            <div className="flex items-center gap-3 mt-5"><input type="checkbox" defaultChecked={selected.requires_merchant_quote} onChange={(event) => updateOrganization({ requires_merchant_quote: event.target.checked })} /><Text>Require merchant quote</Text><Button size="small" variant="secondary" disabled={busy} onClick={() => updateOrganization({ status: selected.status === "suspended" ? "active" : "suspended" })}>{selected.status === "suspended" ? "Activate" : "Suspend"}</Button></div>
          </section>
          <section className="rounded-lg border border-ui-border-base p-5">
            <Heading level="h2">Members and roles</Heading>
            <div className="flex flex-col md:flex-row gap-2 mt-4"><Input placeholder="Customer ID" value={memberCustomerId} onChange={(event) => setMemberCustomerId(event.target.value)} /><Select value={memberRole} onValueChange={setMemberRole}><Select.Trigger /><Select.Content>{roles.map((role) => <Select.Item key={role} value={role}>{role}</Select.Item>)}</Select.Content></Select><Button disabled={busy || !memberCustomerId.trim()} onClick={addMember}>Add member</Button></div>
            <div className="mt-4 divide-y divide-ui-border-base">{members.map((member) => <div key={member.id} className="flex items-center justify-between gap-3 py-3"><Text>{member.customer_id}</Text><div className="flex items-center gap-2"><Select value={member.role} onValueChange={(value) => updateMember(member.id, { role: value })}><Select.Trigger /><Select.Content>{roles.map((role) => <Select.Item key={role} value={role}>{role}</Select.Item>)}</Select.Content></Select><Select value={member.status} onValueChange={(value) => updateMember(member.id, { status: value })}><Select.Trigger /><Select.Content>{["invited", "active", "suspended", "removed"].map((status) => <Select.Item key={status} value={status}>{status}</Select.Item>)}</Select.Content></Select></div></div>)}</div>
          </section>
          <section className="rounded-lg border border-ui-border-base p-5">
            <Heading level="h2">Payment terms and finance</Heading>
            {financeAccount ? <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <label className="text-sm">Payment terms code<Input className="mt-1" defaultValue={financeAccount.payment_terms_code ?? ""} onBlur={async (event) => { await fetch(`/admin/b2b/organizations/${selectedId}/finance-account`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: financeAccount.id, payment_terms_code: event.target.value || null }) }); await queryClient.invalidateQueries({ queryKey: ["b2b-admin-finance-account", selectedId] }) }} /></label>
              <label className="text-sm">Credit limit<Input className="mt-1" type="number" defaultValue={String(financeAccount.approved_credit_limit ?? "")} onBlur={async (event) => { await fetch(`/admin/b2b/organizations/${selectedId}/finance-account`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: financeAccount.id, approved_credit_limit: event.target.value ? Number(event.target.value) : null }) }); await queryClient.invalidateQueries({ queryKey: ["b2b-admin-finance-account", selectedId] }) }} /></label>
              <Text className="text-sm">Status: {financeAccount.status}</Text>
              <Text className="text-sm">Manual review: {financeAccount.requires_manual_review ? "Required" : "Not required"}</Text>
            </div> : <div className="flex items-end gap-2 mt-3"><label className="text-sm">Currency code<Input className="mt-1" value={accountCurrency} onChange={(event) => setAccountCurrency(event.target.value)} /></label><Button size="small" disabled={busy || !accountCurrency.trim()} onClick={createFinanceAccount}>Create account</Button></div>}
          </section>
        </div>}
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({ label: "B2B Organizations" })
export default OrganizationsPage
