import {
  createStep,
  StepResponse,
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"

export const createBrandStep = createStep(
  "create-brand",
  async (
    input: { name: string; handle: string; description?: string; metadata?: Record<string, any> },
    { container }
  ) => {
    const brandModuleService = container.resolve("brand")

    const brand = await brandModuleService.createBrands(input)

    return new StepResponse(brand, brand.id)
  },
  async (id: string, { container }) => {
    // Compensation: Delete the brand if workflow fails
    const brandModuleService = container.resolve("brand")
    await brandModuleService.deleteBrands(id)
  }
)

export type CreateBrandInput = {
  name: string
  handle: string
  description?: string
  metadata?: Record<string, any>
}

export const createBrandWorkflow = createWorkflow(
  "create-brand",
  (input: CreateBrandInput) => {
    const brand = createBrandStep(input)

    return new WorkflowResponse(brand)
  }
)
