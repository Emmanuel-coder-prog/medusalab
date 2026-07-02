import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { z } from "@medusajs/framework/zod"

import { DELIVERY_SLOT_MODULE } from "../../../../../../../modules/delivery-slot"
import { reserveDeliverySlotWorkflow } from "../../../../../../../workflows/reserve-delivery-slot"
import { PostSelectDeliverySlot } from "./validators"

type PostSelectDeliverySlotBody = z.infer<typeof PostSelectDeliverySlot>

export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  if (!req.auth_context?.actor_id) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Unauthorized")
  }

  const cartModuleService = req.scope.resolve(Modules.CART)
  const deliverySlotService = req.scope.resolve(DELIVERY_SLOT_MODULE)

  const cart = await cartModuleService.retrieveCart(req.params.id)

  if (cart.customer_id !== req.auth_context.actor_id) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "This cart does not belong to the authenticated customer."
    )
  }

  const reservations = await deliverySlotService.listNonExpiredActiveReservationsForCart(
    req.params.id
  )

  res.status(200).json({ reservation: reservations[0] ?? null })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<PostSelectDeliverySlotBody>,
  res: MedusaResponse
) => {
  if (!req.auth_context?.actor_id) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Unauthorized")
  }

  const { result } = await reserveDeliverySlotWorkflow(req.scope).run({
    input: {
      cart_id: req.params.id,
      customer_id: req.auth_context.actor_id,
      slot_id: req.validatedBody.slot_id,
    },
  })

  res.status(200).json(result)
}