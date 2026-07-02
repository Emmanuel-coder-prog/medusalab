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


export type ExpireReservationOutput = {
  reservation_id: string
  expired: boolean
  reason: "not_found" | "not_active" | "not_yet_expired" | null
}

export type ExpireReservationCompensationData = {
  reservation_id: string
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

    // The reservation may have been removed or changed after the job found it.
    if (!reservation) {
      const output: ExpireReservationOutput = {
        reservation_id,
        expired: false,
        reason: "not_found",
      }

      return new StepResponse(output)
    }

    if (reservation.status !== DeliverySlotReservationStatus.ACTIVE) {
      const output: ExpireReservationOutput = {
        reservation_id,
        expired: false,
        reason: "not_active",
      }

      return new StepResponse(output)
    }

    const now = new Date()

    if (new Date(reservation.expires_at) > now) {
      const output: ExpireReservationOutput = {
        reservation_id,
        expired: false,
        reason: "not_yet_expired",
      }

      return new StepResponse(output)
    }

    await deliverySlotService.updateDeliverySlotReservations({
      id: reservation.id,
      status: DeliverySlotReservationStatus.EXPIRED,
      expired_at: now,
    })

    const output: ExpireReservationOutput = {
      reservation_id: reservation.id,
      expired: true,
      reason: null,
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

    // In this lab, compensation restores the hold only if a later workflow
    // step fails before the workflow completes.
    await deliverySlotService.updateDeliverySlotReservations({
      id: compensationData.reservation_id,
      status: DeliverySlotReservationStatus.ACTIVE,
      expired_at: null,
    })
  }
)