"use client"

import { Button } from "@modules/common/components/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import OrganizationCard from "../organization-card"
import type { B2BOrganizationWithRole } from "@lib/api/types/b2b"

type OrganizationOverviewProps = {
  organizations: B2BOrganizationWithRole[]
}

const OrganizationOverview = ({ organizations }: OrganizationOverviewProps) => {
  if (organizations && organizations.length > 0) {
    return (
      <div className="flex flex-col gap-y-4 w-full" data-testid="organizations-list">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-large-semi">Organizations</h2>
          <LocalizedClientLink href="/account/b2b/organizations/create">
            <Button data-testid="create-organization-button">
              Create Organization
            </Button>
          </LocalizedClientLink>
        </div>
        {organizations.map((org) => (
          <OrganizationCard key={org.id} organization={org} />
        ))}
      </div>
    )
  }

  return (
    <div
      className="w-full flex flex-col items-center gap-y-4"
      data-testid="no-organizations-container"
    >
      <h2 className="text-large-semi">No Organizations Yet</h2>
      <p className="text-base-regular">
        You haven't joined or created any B2B organizations yet.
      </p>
      <div className="mt-4">
        <LocalizedClientLink href="/account/b2b/organizations/create" passHref>
          <Button data-testid="create-org-button">
            Create Your First Organization
          </Button>
        </LocalizedClientLink>
      </div>
    </div>
  )
}

export default OrganizationOverview
