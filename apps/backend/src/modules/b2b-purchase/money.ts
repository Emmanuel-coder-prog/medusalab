import BigNumber from "bignumber.js"

export const isAtOrAbove = (
  amount: string | number | BigNumber,
  threshold: string | number | BigNumber
) => {
  return new BigNumber(amount).isGreaterThanOrEqualTo(new BigNumber(threshold))
}
