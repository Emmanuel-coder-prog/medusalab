import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"

import {
  acquireLockStep,
  completeCartWorkflow,
  releaseLockStep,
} from "@medusajs/medusa/core-flows"

import {
  getCartDeliveryReservationStep,
} from "./get-cart-delivery-reservation"

import {
  claimDeliverySlotForCheckoutStep,
} from "./steps/claim-delivery-slot-for-checkout"

import {
  confirmDeliverySlotStep,
} from "./confirm-delivery-slot"

type Input = {
  cart_id: string
}

export const completeCartWithDeliverySlotWorkflow =
  createWorkflow(
    "complete-cart-with-delivery-slot",
    (input: Input) => {
      // Must match Medusa completeCartWorkflow cart lock key.
      acquireLockStep({
        key: input.cart_id,
        timeout: 30,
        ttl: 120,
      }).config({ name: "acquire-cart-lock" })

      const reservation =
        (getCartDeliveryReservationStep as any)({
          cart_id: input.cart_id,
        });

      const slotLockKey = transform(
        { reservation },
        ({ reservation }) =>
          `delivery-slot:${reservation.slot_id}`
      );

      acquireLockStep({
        key: slotLockKey,
        timeout: 30,
        ttl: 120,
      }).config({ name: "acquire-slot-lock" });

      (claimDeliverySlotForCheckoutStep as any)({
        cart_id: input.cart_id,
        reservation_id: reservation.reservation_id,
      })

      const { id: order_id } =
        (completeCartWorkflow.runAsStep as any)({
          input: {
            id: input.cart_id,
          },
        })

      const confirmedReservation =
        (confirmDeliverySlotStep as any)({
          reservation_id: reservation.reservation_id,
          order_id,
        });

      releaseLockStep({
        key: slotLockKey,
      }).config({ name: "release-slot-lock" })

      releaseLockStep({
        key: input.cart_id,
      }).config({ name: "release-cart-lock" })

      return new WorkflowResponse({
        order_id,
        delivery_reservation: confirmedReservation,
      })
    }
  )