"use client"

import { Button } from "@modules/common/components/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import type { B2BOrganizationWithRole } from "@lib/api/types/b2b"
import { getRoleLabel } from "@lib/helpers/b2b-permissions"
import { getOrganizationStatusLabel, getOrganizationStatusColor } from "@lib/helpers/b2b-status"

type OrganizationCardProps = {
  organization: B2BOrganizationWithRole
}

const OrganizationCard = ({ organization }: OrganizationCardProps) => {
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
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow" data-testid="organization-card">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="text-large-semi" data-testid="org-display-name">
            {organization.display_name}
          </h3>
          <p className="text-small-regular text-ui-fg-muted mt-1" data-testid="org-handle">
            @{organization.handle}
          </p>
        </div>
        <LocalizedClientLink
          href={`/account/b2b/organizations/${organization.handle}`}
        >
          <Button variant="secondary" className="text-small-regular" data-testid="view-org-button">
            View
          </Button>
        </LocalizedClientLink>
      </div>

      <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
        <span
          className={`text-small-regular px-2 py-1 rounded ${
            statusColorClasses[statusColor]
          }`}
          data-testid="org-status-badge"
        >
          {statusLabel}
        </span>
        <span
          className={`text-small-regular px-2 py-1 rounded ${
            roleColorClasses[organization.role.toLowerCase()]
          }`}
          data-testid="user-role-badge"
        >
          Your role: {roleLabel}
        </span>
      </div>
    </div>
  )
}

export default OrganizationCard
