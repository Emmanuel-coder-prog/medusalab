import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils"
import { BRAND_MODULE } from "../modules/brand"

type LinkProductBrandInput = {
  product_id: string
  brand_id: string
}

type LinkProductBrandCompensation = {
  dismissedLink?: Record<string, Record<string, string>>
  createdLink?: Record<string, Record<string, string>>
}

const linkProductBrandStep = createStep(
  "link-product-brand",
  async (input: LinkProductBrandInput, { container }) => {
    const link = container.resolve(ContainerRegistrationKeys.LINK)
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const brandModuleService = container.resolve(BRAND_MODULE)

    await brandModuleService.retrieveBrand(input.brand_id)

    const { data: products } = await query.graph({
      entity: "product",
      fields: ["id", "brand.id"],
      filters: { id: input.product_id },
    })

    const existingBrandId = (products[0] as { brand?: { id: string } })?.brand
      ?.id

    if (existingBrandId === input.brand_id) {
      return new StepResponse({ linked: true, unchanged: true }, {})
    }

    let dismissedLink: Record<string, Record<string, string>> | undefined

    if (existingBrandId) {
      dismissedLink = {
        [Modules.PRODUCT]: { product_id: input.product_id },
        [BRAND_MODULE]: { brand_id: existingBrandId },
      }
      await link.dismiss(dismissedLink)
    }

    const createdLink = {
      [Modules.PRODUCT]: { product_id: input.product_id },
      [BRAND_MODULE]: { brand_id: input.brand_id },
    }

    await link.create(createdLink)

    return new StepResponse(
      { linked: true },
      { dismissedLink, createdLink }
    )
  },
  async (compensationData: LinkProductBrandCompensation, { container }) => {
    const link = container.resolve(ContainerRegistrationKeys.LINK)

    if (compensationData?.createdLink) {
      await link.dismiss(compensationData.createdLink)
    }

    if (compensationData?.dismissedLink) {
      await link.create(compensationData.dismissedLink)
    }
  }
)

export const linkProductBrandWorkflow = createWorkflow(
  "link-product-brand",
  (input: LinkProductBrandInput) => {
    const result = linkProductBrandStep(input)

    return new WorkflowResponse(result)
  }
)
