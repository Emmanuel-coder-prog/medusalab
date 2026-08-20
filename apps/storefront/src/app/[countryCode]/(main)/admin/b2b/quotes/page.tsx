import { listB2BQuoteQueue } from "@lib/data/b2b-admin"
import { notFound } from "next/navigation"
import { Heading, Container } from "@modules/common/components/ui"
import PurchaseRequestQueue from "@modules/admin/components/purchase-request-queue"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Button } from "@modules/common/components/ui"

export const metadata = {
  title: "Quote Queue",
  description: "Review and manage B2B purchase requests requiring quotes",
}

export default async function QuoteQueuePage() {
  try {
    const data = await listB2BQuoteQueue()

    return (
      <Container className="py-12">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <Heading level="h1" className="mb-2">
              Purchase requests
            </Heading>
            <p className="text-ui-fg-muted">
              Review and manage B2B purchase requests awaiting merchant quotation.
            </p>
          </div>
        </div>

        <PurchaseRequestQueue
          purchaseRequests={data.purchase_requests || []}
          total={data.total || 0}
        />
      </Container>
    )
  } catch (error) {
    console.error("Error loading quote queue:", error)
    return notFound()
  }
}
