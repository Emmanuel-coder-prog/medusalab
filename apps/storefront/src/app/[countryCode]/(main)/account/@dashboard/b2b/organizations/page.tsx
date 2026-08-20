import { listB2BOrganizations } from "@lib/data/b2b"
import OrganizationOverview from "@modules/account/components/organization-overview"
import { notFound } from "next/navigation"

export const metadata = {
  title: "Organizations",
  description: "Manage your B2B organizations",
}

export default async function OrganizationsListPage() {
  const organizations = await listB2BOrganizations().catch(() => null)

  if (!organizations) {
    notFound()
  }

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-2xl-semi mb-2">B2B Organizations</h1>
        <p className="text-base-regular text-ui-fg-base">
          Manage your business organizations and team members.
        </p>
      </div>
      <OrganizationOverview organizations={organizations} />
    </div>
  )
}
