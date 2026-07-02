import type {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { DELIVERY_SLOT_MODULE } from "../../../modules/delivery-slot"
import DeliverySlotModuleService from "../../../modules/delivery-slot/service"
import { createDeliverySlotWorkflow } from "../../../workflows/create-delivery-slot"
import {
  AdminCreateDeliverySlotSchema,
  AdminListDeliverySlotsSchema,
} from "./validators"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const validatedQuery = AdminListDeliverySlotsSchema.parse(req.query)
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const deliverySlotService =
    req.scope.resolve<DeliverySlotModuleService>(DELIVERY_SLOT_MODULE)

  const offset = validatedQuery.offset ?? 0
  const limit = validatedQuery.limit ?? 20

  const { data: delivery_slots, metadata } = await query.graph({
    entity: "delivery_slot",
    fields: [
      "id",
      "code",
      "region_id",
      "stock_location_id",
      "start_at",
      "end_at",
      "capacity",
      "status",
      "created_at",
      "updated_at",
    ],
    filters: validatedQuery.status
      ? {
          status: validatedQuery.status,
        }
      : undefined,
    pagination: {
      skip: offset,
      take: limit,
    },
  })

  const deliverySlotsWithUtilization = await Promise.all(
    delivery_slots.map(async (slot) => ({
      ...slot,
      active_reservations:
        await deliverySlotService.countNonExpiredActiveReservationsForSlot(
          slot.id
        ),
    }))
  )

  res.json({
    delivery_slots: deliverySlotsWithUtilization,
    count: metadata?.count ?? delivery_slots.length,
    offset,
    limit,
  })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const validatedData = AdminCreateDeliverySlotSchema.parse(req.body)

  const { result } = await createDeliverySlotWorkflow(req.scope).run({
    input: validatedData,
  })

  res.json({ delivery_slot: result })
}
