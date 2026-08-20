import { getB2BPurchaseRequestDetail } from "@lib/data/b2b-admin"
import { notFound } from "next/navigation"
import { Heading, Container } from "@modules/common/components/ui"
import PurchaseRequestDetail from "@modules/admin/components/purchase-request-detail"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Button } from "@modules/common/components/ui"

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata(props: Props) {
  const params = await props.params

  try {
    const data = await getB2BPurchaseRequestDetail(params.id)
    return {
      title: `Quote: ${data.purchase_request.reference || params.id}`,
    }
  } catch {
    return { title: "Quote Not Found" }
  }
}

export default async function QuoteDetailPage(props: Props) {
  const params = await props.params

  try {
    const data = await getB2BPurchaseRequestDetail(params.id)

    if (!data.purchase_request) {
      return notFound()
    }

    return (
      <Container className="py-12">
        <div className="mb-8 flex items-center gap-3">
          <LocalizedClientLink href="/admin/b2b/quotes">
            <Button variant="secondary">← Back to Queue</Button>
          </LocalizedClientLink>
        </div>

        <PurchaseRequestDetail
          purchaseRequest={data.purchase_request}
        />
      </Container>
    )
  } catch (error) {
    console.error("Error loading quote detail:", error)
    return notFound()
  }
}
