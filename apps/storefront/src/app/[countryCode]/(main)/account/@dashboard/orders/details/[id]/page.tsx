import { retrieveOrder } from "@lib/data/orders"
import { retrievePaymentTermsObligation, retrieveOrderFinanceReview } from "@lib/data/b2b"
import OrderDetailsTemplate from "@modules/order/templates/order-details-template"
import { PaymentTermsCard } from "@modules/orders/components/payment-terms-card"
import { PrepaymentForm } from "@modules/orders/components/prepayment-form"
import { Container, Heading } from "@modules/common/components/ui"
import { Metadata } from "next"
import { notFound } from "next/navigation"

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const order = await retrieveOrder(params.id).catch(() => null)

  if (!order) {
    notFound()
  }

  return {
    title: `Order #${order.display_id}`,
    description: `View your order`,
  }
}

export default async function OrderDetailPage(props: Props) {
  const params = await props.params
  const order = await retrieveOrder(params.id).catch(() => null)

  if (!order) {
    notFound()
  }

  // Fetch B2B payment and finance data if applicable (Finance Review indicates B2B order)
  const financeReview = await retrieveOrderFinanceReview(params.id)
  const paymentTermsObligation = financeReview
    ? await retrievePaymentTermsObligation(params.id)
    : null

  return (
    <div className="flex flex-col justify-center gap-y-6">
      <OrderDetailsTemplate order={order} />

      {/* Display payment terms if order has finance review (B2B order) */}
      {financeReview && paymentTermsObligation && (
        <Container className="mt-4 border-t pt-6">
          <Heading level="h2" className="mb-6">
            Payment Information
          </Heading>

          <PaymentTermsCard
            financeStatus={financeReview.status}
            paymentTermsObligation={paymentTermsObligation}
          >
            {/* Show prepayment form if prepayment is required and not yet paid */}
            {financeReview.status === "prepayment_required" &&
              (paymentTermsObligation.status === "pending_invoice" ||
                paymentTermsObligation.status === "open" ||
                paymentTermsObligation.status === "partially_paid") && (
                <PrepaymentForm
                  orderId={params.id}
                  paymentTermsObligation={paymentTermsObligation}
                />
              )}
          </PaymentTermsCard>
        </Container>
      )}
    </div>
  )
}
