import type {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { DELIVERY_SLOT_MODULE } from "../../../modules/delivery-slot"
import DeliverySlotModuleService from "../../../modules/delivery-slot/service"
import { DeliverySlotStatus } from "../../../modules/delivery-slot/types"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const deliverySlotService =
    req.scope.resolve<DeliverySlotModuleService>(DELIVERY_SLOT_MODULE)

  const regionId = req.query.region_id as string | undefined
  const offset = Number(req.query.offset ?? 0)
  const limit = Number(req.query.limit ?? 20)

  const now = new Date()

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
    filters: {
      ...(regionId ? { region_id: regionId } : {}),
      status: DeliverySlotStatus.ACTIVE,
      start_at: {
        $gt: now,
      },
    },
    pagination: {
      skip: Number.isFinite(offset) ? offset : 0,
      take: Number.isFinite(limit) ? limit : 20,
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
    count: metadata?.count ?? deliverySlotsWithUtilization.length,
    offset,
    limit,
  })
}
