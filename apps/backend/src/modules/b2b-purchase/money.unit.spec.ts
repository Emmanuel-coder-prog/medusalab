import { isAtOrAbove } from "./money"

describe("b2b purchase money helpers", () => {
  it("compares decimal amounts exactly", () => {
    expect(isAtOrAbove("0.10", "0.10")).toBe(true)
    expect(isAtOrAbove("0.30", "0.10")).toBe(true)
    expect(isAtOrAbove("0.29", "0.30")).toBe(false)
    expect(isAtOrAbove("10.00", "9.99")).toBe(true)
  })
})
