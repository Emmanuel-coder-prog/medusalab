import { AdminCreateBrandSchema, AdminListBrandSchema } from "./validators"

describe("Brand admin validators", () => {
  it("accepts a valid brand payload", () => {
    const payload = {
      name: "Valid Brand",
      handle: "valid-brand",
      description: "Example",
    }

    expect(AdminCreateBrandSchema.parse(payload)).toMatchObject(payload)
  })

  it("rejects missing required fields", () => {
    expect(() => AdminCreateBrandSchema.parse({ name: "" })).toThrow()
    expect(() => AdminCreateBrandSchema.parse({ handle: "" })).toThrow()
  })

  it("parses list query options", () => {
    expect(AdminListBrandSchema.parse({ offset: "1", limit: "5" })).toMatchObject({
      offset: 1,
      limit: 5,
    })
  })
})
