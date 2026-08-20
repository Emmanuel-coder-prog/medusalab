import { listB2BOrganizations } from "@lib/data/b2b"
import { notFound } from "next/navigation"
import { Metadata } from "next"
import { Container, Heading, Text } from "@modules/common/components/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Button } from "@modules/common/components/ui"

type Props = {
  params: Promise<{ handle: string }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const organizations = await listB2BOrganizations().catch(() => null)

  if (!organizations) {
    return { title: "Settings Not Found" }
  }

  const organization = organizations.find((org) => org.handle === params.handle)

  if (!organization) {
    return { title: "Settings Not Found" }
  }

  return {
    title: `Settings - ${organization.display_name}`,
    description: `Manage settings for ${organization.display_name}`,
  }
}

export default async function OrganizationSettingsPage(props: Props) {
  const params = await props.params
  const organizations = await listB2BOrganizations().catch(() => null)

  if (!organizations) {
    notFound()
  }

  const organization = organizations.find((org) => org.handle === params.handle)

  if (!organization) {
    notFound()
  }

  return (
    <Container className="py-12" data-testid="organization-settings">
      <LocalizedClientLink
        href={`/account/b2b/organizations/${organization.handle}`}
        className="flex items-center gap-2 text-small-regular mb-4"
      >
        <span>←</span>
        <span>Back to Organization</span>
      </LocalizedClientLink>

      <Heading level="h2" className="mb-2">
        Settings
      </Heading>
      <Text className="text-ui-fg-muted mb-8">
        Configure settings for {organization.display_name}.
      </Text>

      <div className="border border-gray-200 rounded-lg p-6 text-center">
        <Text className="text-ui-fg-muted mb-4">
          Organization settings coming soon.
        </Text>
        <LocalizedClientLink href={`/account/b2b/organizations/${organization.handle}`}>
          <Button variant="secondary">Back to Organization</Button>
        </LocalizedClientLink>
      </div>
    </Container>
  )
}
