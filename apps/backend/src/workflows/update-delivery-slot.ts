import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"

import { DELIVERY_SLOT_MODULE } from "../modules/delivery-slot"
import DeliverySlotModuleService from "../modules/delivery-slot/service"
import { DeliverySlotStatus } from "../modules/delivery-slot/types"

export type UpdateDeliverySlotWorkflowInput = {
  id: string
  code?: string
  region_id?: string
  stock_location_id?: string | null
  start_at?: string | Date
  end_at?: string | Date
  capacity?: number
  status?: DeliverySlotStatus
}

const updateDeliverySlotStep = createStep(
  "update-delivery-slot",
  async (input: UpdateDeliverySlotWorkflowInput, { container }) => {
    const deliverySlotService =
      container.resolve<DeliverySlotModuleService>(DELIVERY_SLOT_MODULE)

    const updatePayload: Record<string, unknown> = {}

    if (input.code !== undefined) updatePayload.code = input.code
    if (input.region_id !== undefined) updatePayload.region_id = input.region_id
    if (input.stock_location_id !== undefined)
      updatePayload.stock_location_id = input.stock_location_id
    if (input.start_at !== undefined)
      updatePayload.start_at =
        input.start_at instanceof Date ? input.start_at : new Date(input.start_at)
    if (input.end_at !== undefined)
      updatePayload.end_at =
        input.end_at instanceof Date ? input.end_at : new Date(input.end_at)
    if (input.capacity !== undefined) updatePayload.capacity = input.capacity
    if (input.status !== undefined) updatePayload.status = input.status

    const slot = await deliverySlotService.updateDeliverySlots({
      id: input.id,
      ...updatePayload,
    })

    const updatedSlot = Array.isArray(slot) ? slot[0] : slot

    return new StepResponse(updatedSlot)
  }
)

export const updateDeliverySlotWorkflow = createWorkflow(
  "update-delivery-slot",
  (input: UpdateDeliverySlotWorkflowInput) => {
    const slot = updateDeliverySlotStep(input)

    return new WorkflowResponse(slot)
  }
)
