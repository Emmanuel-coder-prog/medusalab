import { listB2BOrganizations, listPurchaseRequestsForApproval } from "@lib/data/b2b"
import { canApprovePurchaseRequest } from "@lib/helpers/b2b-permissions"
import { getPurchaseRequestStatusColor, getPurchaseRequestStatusLabel } from "@lib/helpers/b2b-status"
import { notFound } from "next/navigation"
import { Container, Heading, Text, Button } from "@modules/common/components/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const metadata = {
  title: "Purchase Requests",
  description: "Review purchase requests requiring approval",
}

export default async function ApprovalQueuePage() {
  const organizations = await listB2BOrganizations().catch(() => [])

  if (!organizations.length) {
    notFound()
  }

  const organizationsWithApprovalAccess = organizations.filter((organization) =>
    canApprovePurchaseRequest({
      id: organization.id,
      organization_id: organization.id,
      customer_id: "",
      role: organization.role,
      status: "active",
    } as any)
  )

  if (!organizationsWithApprovalAccess.length) {
    return (
      <Container className="py-12" data-testid="b2b-approval-empty">
        <Heading level="h1">Purchase requests</Heading>
        <Text className="mt-3 text-ui-fg-muted">
          You do not currently have approval authority in any organization.
        </Text>
      </Container>
    )
  }

  const requests = await listPurchaseRequestsForApproval().catch(() => [])

  return (
    <Container className="py-12" data-testid="b2b-approval-queue">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <Heading level="h1">Purchase requests</Heading>
          <Text className="text-ui-fg-muted mt-2">
            Review purchase requests that need internal approval.
          </Text>
        </div>
        <LocalizedClientLink href="/account/b2b/organizations">
          <Button variant="secondary">Organizations</Button>
        </LocalizedClientLink>
      </div>

      {requests.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-200 p-8 text-center">
          <Text className="text-ui-fg-muted">
            No purchase requests are currently waiting for approval.
          </Text>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => {
            const color = getPurchaseRequestStatusColor(request.status)
            const statusClasses: Record<string, string> = {
              yellow: "bg-yellow-100 text-yellow-800",
              blue: "bg-blue-100 text-blue-800",
              orange: "bg-orange-100 text-orange-800",
              red: "bg-red-100 text-red-800",
              green: "bg-green-100 text-green-800",
              gray: "bg-gray-100 text-gray-800",
            }

            return (
              <div key={request.id} className="rounded-lg border border-gray-200 p-4" data-testid="approval-request-item">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <Text className="text-xs uppercase tracking-wide text-ui-fg-muted">
                      {request.reference || request.id}
                    </Text>
                    <Heading level="h3" className="mt-1">
                      {request.organization_id}
                    </Heading>
                  </div>
                  <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusClasses[color]}`}>
                    {getPurchaseRequestStatusLabel(request.status)}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
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

                <div className="mt-4 flex justify-end">
                  <LocalizedClientLink href={`/account/b2b/approvals/${request.id}`}>
                    <Button variant="secondary">Review request</Button>
                  </LocalizedClientLink>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Container>
  )
}
