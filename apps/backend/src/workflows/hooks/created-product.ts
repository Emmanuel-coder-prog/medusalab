import { createProductsWorkflow } from "@medusajs/medusa/core-flows"
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils"
import {
  createStep,
  StepResponse,
} from "@medusajs/framework/workflows-sdk"
import { BRAND_MODULE } from "../../modules/brand"

const createProductBrandLinksStep = createStep(
  "create-product-brand-links",
  async (input: { products: Array<{ id: string }>; brandId: string }, { container }) => {
    const brandModuleService = container.resolve(BRAND_MODULE)
    const link = container.resolve(ContainerRegistrationKeys.LINK)
    const brand = await brandModuleService.retrieveBrand(input.brandId)

    const linkPayloads = await Promise.all(
      input.products.map(async (product) => {
        const linkPayload = {
          [Modules.PRODUCT]: { product_id: product.id },
          [BRAND_MODULE]: { brand_id: brand.id },
        }

        await link.create(linkPayload)

        return linkPayload
      })
    )

    return new StepResponse(linkPayloads, linkPayloads)
  },
  async (linkPayloads: Array<Record<string, Record<string, string>>>, { container }) => {
    const link = container.resolve(ContainerRegistrationKeys.LINK)

    await Promise.all(
      linkPayloads.map((linkPayload) => link.dismiss(linkPayload))
    )
  }
)

createProductsWorkflow.hooks.productsCreated(
  (async (
    input: { products: Array<{ id: string }>; additional_data?: { brand_id?: string } },
    { container }: { container: any }
  ) => {
    const brandId = input.additional_data?.brand_id

    if (!brandId) {
      return
    }

    return createProductBrandLinksStep({
      products: input.products,
      brandId,
    })
  }) as any
)

