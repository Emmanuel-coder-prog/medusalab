import { MedusaError, Modules } from "@medusajs/framework/utils"
import {
  createStep,
  StepResponse,
} from "@medusajs/framework/workflows-sdk"

import { DELIVERY_SLOT_MODULE } from "../../../modules/delivery-slot"
import DeliverySlotModuleService from "../../../modules/delivery-slot/service"

export type ReserveDeliverySlotStepInput = {
  cart_id: string
  customer_id: string
  slot_id: string
}

export const reserveDeliverySlotStep = createStep(
  "reserve-delivery-slot",
  async (
    { cart_id, customer_id, slot_id }: ReserveDeliverySlotStepInput,
    { container }
  ) => {
    const cartModuleService = container.resolve(Modules.CART)
    const deliverySlotService =
      container.resolve<DeliverySlotModuleService>(DELIVERY_SLOT_MODULE)

    const cart = await cartModuleService.retrieveCart(cart_id)

    if (cart.customer_id !== customer_id) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "This cart does not belong to the authenticated customer."
      )
    }

    if (!cart.region_id) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "The cart must have a region before selecting a delivery slot."
      )
    }

    const result = await deliverySlotService.reserveDeliverySlotForCart({
      cart_id,
      customer_id,
      slot_id,
      region_id: cart.region_id,
    })

    return new StepResponse(
      result,
      result.already_reserved
        ? undefined
        : {
            reservation_id: result.reservation.id as string,
          }
    )
  },

  async (compensationData, { container }) => {
    if (!compensationData?.reservation_id) {
      return
    }

    const deliverySlotService =
      container.resolve<DeliverySlotModuleService>(DELIVERY_SLOT_MODULE)

    await deliverySlotService.rollbackReservation(
      compensationData.reservation_id
    )
  }
)
