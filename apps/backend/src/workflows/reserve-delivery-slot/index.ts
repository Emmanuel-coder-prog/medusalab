import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"

import {
  acquireLockStep,
  releaseLockStep,
} from "@medusajs/medusa/core-flows"

import {
  DELIVERY_SLOT_LOCK_TIMEOUT_SECONDS,
  DELIVERY_SLOT_LOCK_TTL_SECONDS,
} from "../../modules/delivery-slot/config"

import {
  reserveDeliverySlotStep,
  type ReserveDeliverySlotStepInput,
} from "./steps/reserve-delivery-slot"

export const reserveDeliverySlotWorkflow = createWorkflow(
  "reserve-delivery-slot",
  (input: ReserveDeliverySlotStepInput) => {
    const cartLockKey = transform({ input }, ({ input }) => {
      return `cart:${input.cart_id}`
    })

    const slotLockKey = transform({ input }, ({ input }) => {
      return `delivery-slot:${input.slot_id}`
    })

    acquireLockStep({
      key: cartLockKey,
      timeout: DELIVERY_SLOT_LOCK_TIMEOUT_SECONDS,
      ttl: DELIVERY_SLOT_LOCK_TTL_SECONDS,
    }).config({ name: "acquire-cart-lock" })

    acquireLockStep({
      key: slotLockKey,
      timeout: DELIVERY_SLOT_LOCK_TIMEOUT_SECONDS,
      ttl: DELIVERY_SLOT_LOCK_TTL_SECONDS,
    }).config({ name: "acquire-slot-lock" })

    const result = reserveDeliverySlotStep(input)

    releaseLockStep({
      key: slotLockKey,
    }).config({ name: "release-slot-lock" })

    releaseLockStep({
      key: cartLockKey,
    }).config({ name: "release-cart-lock" })

    return new WorkflowResponse(result)
  }
)
