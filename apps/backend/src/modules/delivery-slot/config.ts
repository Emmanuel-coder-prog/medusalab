const DEFAULT_HOLD_TTL_MS = 15 * 60 * 1000
const DEFAULT_LOCK_TIMEOUT_SECONDS = 2
const DEFAULT_LOCK_TTL_SECONDS = 30

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback
  }

  const parsed = Number.parseInt(value, 10)

  if (Number.isNaN(parsed) || parsed <= 0) {
    return fallback
  }

  return parsed
}

export function getReservationHoldTtlMs(): number {
  return parsePositiveInt(
    process.env.DELIVERY_SLOT_HOLD_TTL_MS,
    DEFAULT_HOLD_TTL_MS
  )
}

export const DELIVERY_SLOT_LOCK_TIMEOUT_SECONDS = parsePositiveInt(
  process.env.DELIVERY_SLOT_LOCK_TIMEOUT_SECONDS,
  DEFAULT_LOCK_TIMEOUT_SECONDS
)

export const DELIVERY_SLOT_LOCK_TTL_SECONDS = parsePositiveInt(
  process.env.DELIVERY_SLOT_LOCK_TTL_SECONDS,
  DEFAULT_LOCK_TTL_SECONDS
)
