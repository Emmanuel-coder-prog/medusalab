import { PostFinanceDecision } from "./validators"

describe("Finance decision admin validators", () => {
  it("accepts a valid finance decision payload", () => {
    const payload = {
      decision: "approved_on_account",
      reason_code: "credit_review",
      note: "Approved under on-account terms.",
    }

    expect(PostFinanceDecision.parse(payload)).toMatchObject(payload)
  })

  it("rejects invalid finance decision values", () => {
    expect(() =>
      PostFinanceDecision.parse({
        decision: "not_allowed",
      })
    ).toThrow()
  })
})
