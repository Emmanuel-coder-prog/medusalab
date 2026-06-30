import type {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { AdminListDeliverySlotReservationsSchema } from "../validators"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const validatedQuery = AdminListDeliverySlotReservationsSchema.parse(req.query)
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const offset = validatedQuery.offset ?? 0
  const limit = validatedQuery.limit ?? 20

  const { data: reservations, metadata } = await query.graph({
    entity: "delivery_slot_reservation",
    fields: [
      "id",
      "cart_id",
      "customer_id",
      "status",
      "expires_at",
      "slot_id",
      "created_at",
      "updated_at",
    ],
    filters: {
      slot_id: id,
    },
    pagination: {
      skip: offset,
      take: limit,
    },
  })

  res.json({
    reservations,
    count: metadata?.count ?? reservations.length,
    offset,
    limit,
  })
}
