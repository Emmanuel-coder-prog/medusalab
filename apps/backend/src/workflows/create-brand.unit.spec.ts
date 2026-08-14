import { createBrandWorkflow } from "./create-brand"

describe("createBrand workflow", () => {
  it("exposes a workflow factory that accepts brand input", () => {
    const workflow = createBrandWorkflow({} as any)

    expect(workflow).toBeDefined()
    expect(typeof workflow.run).toBe("function")
  })
})
