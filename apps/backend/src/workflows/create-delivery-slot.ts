import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"

import { DELIVERY_SLOT_MODULE } from "../modules/delivery-slot"
import DeliverySlotModuleService from "../modules/delivery-slot/service"
import { DeliverySlotStatus } from "../modules/delivery-slot/types"

export type CreateDeliverySlotWorkflowInput = {
  code: string
  region_id: string
  stock_location_id?: string | null
  start_at: string | Date
  end_at: string | Date
  capacity: number
  status?: DeliverySlotStatus
}

const createDeliverySlotStep = createStep(
  "create-delivery-slot",
  async (input: CreateDeliverySlotWorkflowInput, { container }) => {
    const deliverySlotService =
      container.resolve<DeliverySlotModuleService>(DELIVERY_SLOT_MODULE)

    const slot = await deliverySlotService.createDeliverySlots({
      code: input.code,
      region_id: input.region_id,
      stock_location_id: input.stock_location_id ?? null,
      start_at:
        input.start_at instanceof Date
          ? input.start_at
          : new Date(input.start_at),
      end_at:
        input.end_at instanceof Date ? input.end_at : new Date(input.end_at),
      capacity: input.capacity,
      status: input.status ?? DeliverySlotStatus.ACTIVE,
    })

    const createdSlot = Array.isArray(slot) ? slot[0] : slot

    return new StepResponse(createdSlot)
  }
)

export const createDeliverySlotWorkflow = createWorkflow(
  "create-delivery-slot",
  (input: CreateDeliverySlotWorkflowInput) => {
    const slot = createDeliverySlotStep(input)

    return new WorkflowResponse(slot)
  }
)
