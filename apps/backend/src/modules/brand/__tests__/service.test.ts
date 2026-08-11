import { moduleIntegrationTestRunner } from "@medusajs/test-utils"
import BrandModuleService from "../service"

describe("Brand module service", () => {
  moduleIntegrationTestRunner<BrandModuleService>({
    moduleName: "brand",
    cwd: process.cwd(),
    testSuite: ({ service }) => {
      it("creates and retrieves a brand", async () => {
        const brand = await service.createBrands({
          name: "Test Brand",
          handle: "test-brand",
        })

        expect(brand).toBeDefined()
        expect(brand.name).toBe("Test Brand")
        expect(brand.handle).toBe("test-brand")

        const retrieved = await service.retrieveBrand(brand.id)
        expect(retrieved.id).toBe(brand.id)
      })

      it("updates and deletes a brand", async () => {
        const brand = await service.createBrands({
          name: "Brand To Update",
          handle: "brand-to-update",
        })

        const updated = await service.updateBrands({
          id: brand.id,
          name: "Updated Brand",
        })

        expect(updated.name).toBe("Updated Brand")

        await service.deleteBrands(brand.id)

        await expect(service.retrieveBrand(brand.id)).rejects.toThrow()
      })
    },
  })
})
