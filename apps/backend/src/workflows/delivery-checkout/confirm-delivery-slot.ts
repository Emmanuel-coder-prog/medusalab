import {
  createStep,
  StepResponse,
} from "@medusajs/framework/workflows-sdk"

import {
  MedusaError,
} from "@medusajs/framework/utils"

import { DELIVERY_SLOT_MODULE } from "../../modules/delivery-slot"
import DeliverySlotModuleService from "../../modules/delivery-slot/service"
import {
  DeliverySlotReservationStatus,
} from "../../modules/delivery-slot/types"
import { HUBLOFT_MODULE } from "../../modules/hubloft"
import HubLoftModuleService from "../../modules/hubloft/service"

type Input = {
  reservation_id: string
  order_id: string
}

export const confirmDeliverySlotStep = createStep(
  "confirm-delivery-slot",
  async ({ reservation_id, order_id }: Input, { container }) => {
    const deliverySlotService =
      container.resolve<DeliverySlotModuleService>(
        DELIVERY_SLOT_MODULE
      )

    const reservation =
      await deliverySlotService.retrieveDeliverySlotReservation(
        reservation_id
      )

    if (
      reservation.status ===
        DeliverySlotReservationStatus.CONFIRMED &&
      reservation.order_id === order_id
    ) {
      return new StepResponse({
        reservation,
        already_confirmed: true,
      })
    }

    if (
      reservation.status !==
      DeliverySlotReservationStatus.CHECKOUT_PENDING
    ) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Delivery reservation cannot be confirmed."
      )
    }

    const now = new Date()

    const confirmed =
      await deliverySlotService.updateDeliverySlotReservations({
        id: reservation.id,
        status: DeliverySlotReservationStatus.CONFIRMED,
        order_id,
        confirmed_at: now,
        checkout_started_at: null,
        checkout_expires_at: null,
      })

    const hubloftService =
      container.resolve<HubLoftModuleService>(HUBLOFT_MODULE)

    await hubloftService.createPendingFulfillmentOutbox({
      order_id: order_id,
      reservation_id: reservation.id,
      delivery_slot_id: reservation.slot_id,
      payload: {
        order_id: order_id,
        reservation_id: reservation.id,
        cart_id: reservation.cart_id,
        slot_id: reservation.slot_id,
        status: "pending",
      },
    })

    return new StepResponse(
      {
        reservation: confirmed,
        already_confirmed: false,
      },
      {
        reservation_id: reservation.id,
      }
    )
  },

  async (compensationData, { container }) => {
    if (!compensationData?.reservation_id) {
      return
    }

    const deliverySlotService =
      container.resolve<DeliverySlotModuleService>(
        DELIVERY_SLOT_MODULE
      )

    await deliverySlotService.updateDeliverySlotReservations({
      id: compensationData.reservation_id,
      status:
        DeliverySlotReservationStatus.CHECKOUT_PENDING,
      order_id: null,
      confirmed_at: null,
    })
  }
)