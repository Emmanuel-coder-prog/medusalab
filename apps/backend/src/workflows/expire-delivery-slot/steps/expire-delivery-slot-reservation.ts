import {
  createStep,
  StepResponse,
} from "@medusajs/framework/workflows-sdk"

import { DELIVERY_SLOT_MODULE } from "../../../modules/delivery-slot"
import DeliverySlotModuleService from "../../../modules/delivery-slot/service"
import {
  DeliverySlotReservationStatus,
} from "../../../modules/delivery-slot/types"

export type ExpireDeliverySlotReservationStepInput = {
  reservation_id: string
}

export type DeliverySlotReservationExpiryAction =
  | "expired"
  | "confirmed"
  | "reactivated"
  | "not_found"
  | "not_active"
  | "not_yet_expired"

export type DeliverySlotReservationExpiryEvaluation = {
  reservation_id: string
  action: DeliverySlotReservationExpiryAction
  expired: boolean
  reason: string | null
}

export type ExpireReservationOutput = {
  reservation_id: string
  expired: boolean
  reason: string | null
  action: DeliverySlotReservationExpiryAction
}

export type ExpireReservationCompensationData = {
  reservation_id: string
}

export function evaluateDeliverySlotReservationExpiry(
  reservation: {
    id: string
    status: DeliverySlotReservationStatus
    expires_at: Date | string | null
    checkout_expires_at: Date | string | null
    order_id: string | null
  },
  now: Date = new Date()
): DeliverySlotReservationExpiryEvaluation {
  const nowTime = new Date(now)

  if (
    reservation.status === DeliverySlotReservationStatus.ACTIVE &&
    reservation.expires_at &&
    new Date(reservation.expires_at) <= nowTime
  ) {
    return {
      reservation_id: reservation.id,
      action: "expired",
      expired: true,
      reason: null,
    }
  }

  if (
    reservation.status === DeliverySlotReservationStatus.CHECKOUT_PENDING &&
    reservation.checkout_expires_at &&
    new Date(reservation.checkout_expires_at) <= nowTime
  ) {
    if (reservation.order_id) {
      return {
        reservation_id: reservation.id,
        action: "confirmed",
        expired: false,
        reason: "checkout_pending_order_found",
      }
    }

    return {
      reservation_id: reservation.id,
      action: "reactivated",
      expired: false,
      reason: "checkout_pending_released_to_active",
    }
  }

  if (reservation.status === DeliverySlotReservationStatus.ACTIVE) {
    return {
      reservation_id: reservation.id,
      action: "not_yet_expired",
      expired: false,
      reason: "active_not_yet_expired",
    }
  }

  if (reservation.status === DeliverySlotReservationStatus.CHECKOUT_PENDING) {
    return {
      reservation_id: reservation.id,
      action: "not_yet_expired",
      expired: false,
      reason: "checkout_pending_not_yet_expired",
    }
  }

  return {
    reservation_id: reservation.id,
    action: "not_active",
    expired: false,
    reason: "reservation_status_not_repairable",
  }
}

export const expireDeliverySlotReservationStep = createStep(
  "expire-delivery-slot-reservation",
  async ({ reservation_id }: ExpireDeliverySlotReservationStepInput, {
    container,
  }) => {
    const deliverySlotService =
      container.resolve<DeliverySlotModuleService>(DELIVERY_SLOT_MODULE)

    const reservations =
      await deliverySlotService.listDeliverySlotReservations({
        id: reservation_id,
      })

    const reservation = reservations[0]

    if (!reservation) {
      const output: ExpireReservationOutput = {
        reservation_id,
        expired: false,
        reason: "not_found",
        action: "not_found",
      }

      return new StepResponse(output)
    }

    const now = new Date()
    const evaluation = evaluateDeliverySlotReservationExpiry(
      {
        id: reservation.id,
        status: reservation.status,
        expires_at: reservation.expires_at,
        checkout_expires_at: reservation.checkout_expires_at,
        order_id: reservation.order_id ?? null,
      },
      now
    )

    if (evaluation.action === "not_yet_expired" || evaluation.action === "not_active") {
      const output: ExpireReservationOutput = {
        reservation_id: reservation.id,
        expired: false,
        reason: evaluation.reason,
        action: evaluation.action,
      }

      return new StepResponse(output)
    }

    if (evaluation.action === "expired") {
      await deliverySlotService.updateDeliverySlotReservations({
        id: reservation.id,
        status: DeliverySlotReservationStatus.EXPIRED,
        expired_at: now,
      })
    }

    if (evaluation.action === "confirmed") {
      await deliverySlotService.updateDeliverySlotReservations({
        id: reservation.id,
        status: DeliverySlotReservationStatus.CONFIRMED,
        confirmed_at: now,
        checkout_started_at: null,
        checkout_expires_at: null,
      })
    }

    if (evaluation.action === "reactivated") {
      await deliverySlotService.updateDeliverySlotReservations({
        id: reservation.id,
        status: DeliverySlotReservationStatus.ACTIVE,
        checkout_started_at: null,
        checkout_expires_at: null,
      })
    }

    const output: ExpireReservationOutput = {
      reservation_id: reservation.id,
      expired: evaluation.expired,
      reason: evaluation.reason,
      action: evaluation.action,
    }

    return new StepResponse(output, {
      reservation_id: reservation.id,
    })
  },

  async (compensationData, { container }) => {
    if (!compensationData?.reservation_id) {
      return
    }

    const deliverySlotService =
      container.resolve<DeliverySlotModuleService>(DELIVERY_SLOT_MODULE)

    await deliverySlotService.updateDeliverySlotReservations({
      id: compensationData.reservation_id,
      status: DeliverySlotReservationStatus.ACTIVE,
      expired_at: null,
      checkout_started_at: null,
      checkout_expires_at: null,
      confirmed_at: null,
    })
  }
)