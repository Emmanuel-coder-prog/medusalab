import BrandModuleService from "../service"
import Brand from "../models/brand"

describe("Brand module service unit tests", () => {
  it("exports the Brand module service class", () => {
    expect(BrandModuleService).toBeDefined()
    expect(typeof BrandModuleService).toBe("function")
  })

  it("defines the brand model as a usable Medusa model", () => {
    const modelName = Brand?.name ?? (Brand as any)?.options?.name

    expect(modelName).toBeDefined()
    expect(typeof Brand).toBe("object")
  })

  it("keeps the module name stable for registration", () => {
    expect(Brand?.name ?? (Brand as any)?.options?.name).toBe("Brand")
  })
})
