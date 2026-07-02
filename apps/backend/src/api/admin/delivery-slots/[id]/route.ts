import type {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

import { DELIVERY_SLOT_MODULE } from "../../../../modules/delivery-slot"
import DeliverySlotModuleService from "../../../../modules/delivery-slot/service"
import { AdminUpdateDeliverySlotSchema } from "./validators"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const deliverySlotService =
    req.scope.resolve<DeliverySlotModuleService>(DELIVERY_SLOT_MODULE)

  const slot = await deliverySlotService.retrieveDeliverySlot(id)
  const activeReservations =
    await deliverySlotService.countNonExpiredActiveReservationsForSlot(id)

  res.json({
    delivery_slot: {
      ...slot,
      active_reservations: activeReservations,
    },
  })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const validatedData = AdminUpdateDeliverySlotSchema.parse(req.body)

  if (Object.keys(validatedData).length === 0) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "At least one field must be provided to update a delivery slot."
    )
  }

  const deliverySlotService =
    req.scope.resolve<DeliverySlotModuleService>(DELIVERY_SLOT_MODULE)

  const updatePayload: Record<string, unknown> = { ...validatedData }

  if (validatedData.start_at) {
    updatePayload.start_at = new Date(validatedData.start_at)
  }

  if (validatedData.end_at) {
    updatePayload.end_at = new Date(validatedData.end_at)
  }

  const slot = await deliverySlotService.updateDeliverySlots({
    id,
    ...updatePayload,
  })

  const updatedSlot = Array.isArray(slot) ? slot[0] : slot
  const activeReservations =
    await deliverySlotService.countNonExpiredActiveReservationsForSlot(id)

  res.json({
    delivery_slot: {
      ...updatedSlot,
      active_reservations: activeReservations,
    },
  })
}
