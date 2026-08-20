import { listB2BOrganizations } from "@lib/data/b2b"
import { notFound } from "next/navigation"
import { Metadata } from "next"
import { Container, Heading, Text } from "@modules/common/components/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Button } from "@modules/common/components/ui"
import { getRoleLabel } from "@lib/helpers/b2b-permissions"
import {
  getOrganizationStatusLabel,
  getOrganizationStatusColor,
} from "@lib/helpers/b2b-status"

type Props = {
  params: Promise<{ handle: string }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const organizations = await listB2BOrganizations().catch(() => null)

  if (!organizations) {
    return { title: "Organization Not Found" }
  }

  const organization = organizations.find((org) => org.handle === params.handle)

  if (!organization) {
    return { title: "Organization Not Found" }
  }

  return {
    title: organization.display_name,
    description: `View details for ${organization.display_name}`,
  }
}

export default async function OrganizationDetailPage(props: Props) {
  const params = await props.params
  const organizations = await listB2BOrganizations().catch(() => null)

  if (!organizations) {
    notFound()
  }

  const organization = organizations.find((org) => org.handle === params.handle)

  if (!organization) {
    notFound()
  }

  const statusLabel = getOrganizationStatusLabel(organization.status)
  const statusColor = getOrganizationStatusColor(organization.status)
  const roleLabel = getRoleLabel(organization.role)

  // Color mapping for badges
  const statusColorClasses: Record<string, string> = {
    green: "bg-green-100 text-green-800",
    yellow: "bg-yellow-100 text-yellow-800",
    red: "bg-red-100 text-red-800",
    gray: "bg-gray-100 text-gray-800",
  }

  const roleColorClasses: Record<string, string> = {
    owner: "bg-blue-100 text-blue-800",
    buyer: "bg-purple-100 text-purple-800",
    approver: "bg-orange-100 text-orange-800",
    finance: "bg-indigo-100 text-indigo-800",
    viewer: "bg-gray-100 text-gray-800",
  }

  return (
    <Container className="py-12" data-testid="organization-detail">
      {/* Header */}
      <div className="mb-8 flex justify-between items-start">
        <div className="flex-1">
          <LocalizedClientLink href="/account/b2b/organizations" className="flex items-center gap-2 text-small-regular mb-4">
            <span>←</span>
            <span>Back to Organizations</span>
          </LocalizedClientLink>
          <Heading level="h1" className="mb-2" data-testid="org-detail-name">
            {organization.display_name}
          </Heading>
        </div>
      </div>

      {/* Organization Info Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        {/* Basic Information */}
        <div className="border border-gray-200 rounded-lg p-6" data-testid="org-basic-info">
          <Heading level="h3" className="mb-4">Organization Information</Heading>
          
          <div className="space-y-4">
            <div>
              <Text className="text-ui-fg-muted text-small-regular mb-1">Organization Handle</Text>
              <Text className="text-base-regular" data-testid="org-handle">
                @{organization.handle}
              </Text>
            </div>

            <div>
              <Text className="text-ui-fg-muted text-small-regular mb-1">Status</Text>
              <span
                className={`inline-block text-small-regular px-3 py-1 rounded ${
                  statusColorClasses[statusColor]
                }`}
                data-testid="org-status"
              >
                {statusLabel}
              </span>
            </div>

            <div>
              <Text className="text-ui-fg-muted text-small-regular mb-1">Sales Channel ID</Text>
              <Text className="text-base-regular text-ui-fg-base font-mono text-xs" data-testid="org-sales-channel">
                {organization.sales_channel_id}
              </Text>
            </div>
          </div>
        </div>

        {/* Your Role & Permissions */}
        <div className="border border-gray-200 rounded-lg p-6" data-testid="org-role-info">
          <Heading level="h3" className="mb-4">Your Role</Heading>
          
          <div className="space-y-4">
            <div>
              <Text className="text-ui-fg-muted text-small-regular mb-2">Role</Text>
              <span
                className={`inline-block text-small-regular px-3 py-1 rounded ${
                  roleColorClasses[organization.role.toLowerCase()]
                }`}
                data-testid="user-role"
              >
                {roleLabel}
              </span>
            </div>

            <div className="pt-2">
              <Text className="text-small-regular text-ui-fg-muted">
                This organization is{" "}
                {organization.status === "active" ? "active" : "not yet active"}
                .
              </Text>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="border-t border-gray-200 pt-6 flex flex-wrap gap-3">
        {/* Members link */}
        <LocalizedClientLink href={`/account/b2b/organizations/${organization.handle}/members`}>
          <Button variant="secondary" data-testid="view-members-button">
            View Members
          </Button>
        </LocalizedClientLink>

        {/* Settings link - shown for OWNER role */}
        {organization.role === "owner" && (
          <LocalizedClientLink href={`/account/b2b/organizations/${organization.handle}/settings`}>
            <Button variant="secondary" data-testid="org-settings-button">
              Organization Settings
            </Button>
          </LocalizedClientLink>
        )}

        {/* Back to list */}
        <LocalizedClientLink href="/account/b2b/organizations" className="ml-auto">
          <Button variant="secondary" data-testid="back-to-list-button">
            Back to Organizations
          </Button>
        </LocalizedClientLink>
      </div>
    </Container>
  )
}
