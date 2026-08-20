import { listB2BExceptions } from "@lib/data/b2b"
import { Container, Heading, Button, Text } from "@modules/common/components/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ExceptionsList from "@modules/admin/components/exceptions-list"

export const metadata = {
  title: "B2B Exceptions & Reconciliation",
  description: "Operational exceptions and recovery actions for B2B orders",
}

export default async function B2BExceptionsPage() {
  const data = await listB2BExceptions().catch(() => ({
    exceptions: [],
    total: 0,
    summary: { critical: 0, warning: 0 },
  }))

  const { exceptions, total, summary } = data

  return (
    <Container className="py-12" data-testid="b2b-exceptions-page">
      <div className="mb-8 flex items-center justify-between gap-3">
        <div>
          <Heading level="h1">Exceptions & Reconciliation</Heading>
          <Text className="mt-2 text-ui-fg-muted">
            Operational issues requiring attention: pending reviews, expired deadlines, blocked orders, failed dispatch.
          </Text>
        </div>
      </div>

      {/* Summary cards */}
      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <Text className="text-xs text-ui-fg-muted">Total exceptions</Text>
          <Text className="mt-1 text-3xl font-bold">{total}</Text>
        </div>

        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <Text className="text-xs text-red-700">Critical issues</Text>
          <Text className="mt-1 text-3xl font-bold text-red-900">{summary.critical}</Text>
        </div>

        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <Text className="text-xs text-yellow-700">Warnings</Text>
          <Text className="mt-1 text-3xl font-bold text-yellow-900">{summary.warning}</Text>
        </div>
      </div>

      {/* Exception list */}
      <ExceptionsList exceptions={exceptions} total={total} />
    </Container>
  )
}
