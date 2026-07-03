import { promiseAll, Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { InferTypeOf, ProductVariantDTO } from "@medusajs/framework/types"
import RestockSubscription from "../../../modules/restock/models/restock-subscription"

type SendRestockNotificationStepInput = (InferTypeOf<typeof RestockSubscription> & {
  product_variant?: ProductVariantDTO
})[]

type RestockNotificationData = {
  productTitle: string
  variantTitle: string
  productImage: string
  formattedPrice: string
  currencyCode: string
  productHandle: string
  productUrl: string
}

function formatPrice(variant: ProductVariantDTO | undefined): string {
  if (!variant) {
    return "Unavailable"
  }

  const amount =
    // @ts-expect-error Some runtime variant shapes include `calculated_price`
    variant.calculated_price ??
    // @ts-expect-error Some runtime variant shapes include `original_price`
    variant.original_price ??
    // @ts-expect-error Fallback to first price record when available
    variant.prices?.[0]?.amount

  const currency =
    // @ts-expect-error Some runtime variant shapes include `currency_code`
    variant.currency_code ??
    // @ts-expect-error Fallback currency from price record
    variant.prices?.[0]?.currency_code

  if (amount == null) {
    return "Unavailable"
  }

  const numericAmount = typeof amount === "string" ? parseFloat(amount) : amount
  if (Number.isNaN(numericAmount)) {
    return "Unavailable"
  }

  if (!currency) {
    return numericAmount.toFixed(2)
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
  }).format(numericAmount)
}

export const sendRestockNotificationStep = createStep(
  "send-restock-notification",
  async (input: SendRestockNotificationStepInput, { container }) => {
    const notificationModuleService = container.resolve(Modules.NOTIFICATION)

    console.log(
      `[send-restock-notification] Restocked variants found: ${input.length}`
    )

    const notificationData = input.map((subscription) => {
      const variant = subscription.product_variant
      const runtimeVariant = variant as Record<string, any> | undefined

      const productTitle =
        runtimeVariant?.product?.title ??
        runtimeVariant?.product_title ??
        "Product"

      const variantTitle = runtimeVariant?.title ?? "Variant"
      const productImage =
        runtimeVariant?.thumbnail ??
        runtimeVariant?.product?.thumbnail ??
        ""
      const currencyCode =
        runtimeVariant?.currency_code ??
        runtimeVariant?.prices?.[0]?.currency_code ??
        ""
      const productHandle =
        runtimeVariant?.product?.handle ??
        runtimeVariant?.product_handle ??
        ""
      const storefrontUrl = process.env.STOREFRONT_URL?.replace(/\/+$/, "") ?? ""
      const productUrl = storefrontUrl && productHandle ? `${storefrontUrl}/products/${productHandle}` : ""

      return {
        to: subscription.email,
        channel: "email",
        template: "variant-restock",
        data: {
          productTitle,
          variantTitle,
          productImage,
          formattedPrice: formatPrice(variant),
          currencyCode,
          productHandle,
          productUrl,
        } as RestockNotificationData,
      }
    })

    console.log(`[send-restock-notification] Emails queued: ${notificationData.length}`)

    try {
      const result = await notificationModuleService.createNotifications(notificationData)
      console.log(
        `[send-restock-notification] Emails sent successfully: ${notificationData.length}`
      )
      return new StepResponse(result)
    } catch (error) {
      console.error("[send-restock-notification] Failed deliveries", error)
      throw error
    }
  }
)