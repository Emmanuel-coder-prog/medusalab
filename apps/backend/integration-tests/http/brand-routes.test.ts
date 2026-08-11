import { medusaIntegrationTestRunner } from "@medusajs/test-utils"

describe("Brand admin routes", () => {
  medusaIntegrationTestRunner({
    cwd: process.cwd(),
    testSuite: ({ api }) => {
      it("creates a brand through the admin API", async () => {
        const response = await api.post("/admin/brands", {
          body: {
            name: "API Brand",
            handle: "api-brand",
          },
          headers: {
            authorization: "Bearer test",
          },
        })

        expect(response.status).toBe(200)
        expect(response.body.brand).toMatchObject({
          name: "API Brand",
          handle: "api-brand",
        })
      })
    },
  })
})
