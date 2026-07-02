import type {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

import { DELIVERY_SLOT_MODULE } from "../../../../modules/delivery-slot"
import DeliverySlotModuleService from "../../../../modules/delivery-slot/service"
import { updateDeliverySlotWorkflow } from "../../../../workflows/update-delivery-slot"
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

  const { result } = await updateDeliverySlotWorkflow(req.scope).run({
    input: {
      id,
      ...validatedData,
    },
  })

  const activeReservations =
    await deliverySlotService.countNonExpiredActiveReservationsForSlot(id)

  res.json({
    delivery_slot: {
      ...result,
      active_reservations: activeReservations,
    },
  })
}
