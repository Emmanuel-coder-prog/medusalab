import {
  evaluateDeliverySlotReservationExpiry,
  type DeliverySlotReservationExpiryEvaluation,
} from "../../../workflows/expire-delivery-slot/steps/expire-delivery-slot-reservation"
import { DeliverySlotReservationStatus } from "../types"

describe("delivery-slot stalled checkout repair", () => {
  it("expires ACTIVE reservations once the hold has elapsed", () => {
    const now = new Date("2026-08-11T12:00:00.000Z")
    const result = evaluateDeliverySlotReservationExpiry(
      {
        id: "res_1",
        status: DeliverySlotReservationStatus.ACTIVE,
        expires_at: new Date("2026-08-11T11:59:00.000Z"),
        order_id: null,
        checkout_expires_at: null,
      },
      now
    )

    expect(result).toMatchObject<DeliverySlotReservationExpiryEvaluation>({
      reservation_id: "res_1",
      action: "expired",
      expired: true,
      reason: null,
    })
  })

  it("restores a stalled CHECKOUT_PENDING reservation when no order exists", () => {
    const now = new Date("2026-08-11T12:00:00.000Z")
    const result = evaluateDeliverySlotReservationExpiry(
      {
        id: "res_2",
        status: DeliverySlotReservationStatus.CHECKOUT_PENDING,
        expires_at: new Date("2026-08-11T12:30:00.000Z"),
        order_id: null,
        checkout_expires_at: new Date("2026-08-11T11:59:00.000Z"),
      },
      now
    )

    expect(result).toMatchObject<DeliverySlotReservationExpiryEvaluation>({
      reservation_id: "res_2",
      action: "reactivated",
      expired: false,
      reason: "checkout_pending_released_to_active",
    })
  })

  it("confirms a stalled CHECKOUT_PENDING reservation when an order exists", () => {
    const now = new Date("2026-08-11T12:00:00.000Z")
    const result = evaluateDeliverySlotReservationExpiry(
      {
        id: "res_3",
        status: DeliverySlotReservationStatus.CHECKOUT_PENDING,
        expires_at: new Date("2026-08-11T12:30:00.000Z"),
        order_id: "ord_123",
        checkout_expires_at: new Date("2026-08-11T11:59:00.000Z"),
      },
      now
    )

    expect(result).toMatchObject<DeliverySlotReservationExpiryEvaluation>({
      reservation_id: "res_3",
      action: "confirmed",
      expired: false,
      reason: "checkout_pending_order_found",
    })
  })
})
