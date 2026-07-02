import type { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

import { DELIVERY_SLOT_MODULE } from "../modules/delivery-slot"
import DeliverySlotModuleService from "../modules/delivery-slot/service"
import { DeliverySlotStatus } from "../modules/delivery-slot/types"

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback
  }

  const parsed = Number.parseInt(value, 10)

  if (Number.isNaN(parsed) || parsed <= 0) {
    return fallback
  }

  return parsed
}

function buildDefaultSlotWindow(daysAhead: number) {
  const startAt = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000)
  startAt.setHours(10, 0, 0, 0)

  const endAt = new Date(startAt.getTime() + 2 * 60 * 60 * 1000)

  return { startAt, endAt }
}

export default async function seedDeliverySlots({
  container,
}: ExecArgs) {
  const deliverySlotService =
    container.resolve<DeliverySlotModuleService>(DELIVERY_SLOT_MODULE)

  const regionService = container.resolve(Modules.REGION)
  const stockLocationService = container.resolve(Modules.STOCK_LOCATION)

  const configuredRegionId =
    process.env.DELIVERY_SLOT_SEED_REGION_ID ?? process.env.LAB_REGION_ID

  const regions = configuredRegionId
    ? [{ id: configuredRegionId }]
    : await regionService.listRegions({}, { take: 1 })

  const regionId = regions[0]?.id

  if (!regionId) {
    throw new Error(
      "No region found. Seed a store first or set DELIVERY_SLOT_SEED_REGION_ID."
    )
  }

  const configuredStockLocationId =
    process.env.DELIVERY_SLOT_SEED_STOCK_LOCATION_ID ??
    process.env.LAB_STOCK_LOCATION_ID

  let stockLocationId = configuredStockLocationId ?? null

  if (!stockLocationId) {
    const stockLocations = await stockLocationService.listStockLocations(
      {},
      { take: 1 }
    )
    stockLocationId = stockLocations[0]?.id ?? null
  }

  const code =
    process.env.DELIVERY_SLOT_SEED_CODE ??
    `${regionId}-default-${new Date().toISOString().slice(0, 10)}`

  const capacity = parsePositiveInt(
    process.env.DELIVERY_SLOT_SEED_CAPACITY,
    10
  )

  const daysAhead = parsePositiveInt(
    process.env.DELIVERY_SLOT_SEED_DAYS_AHEAD,
    1
  )

  const existing = await deliverySlotService.listDeliverySlots({
    code,
  })

  if (existing.length > 0) {
    console.log(`Delivery slot already exists: ${code}`)
    return
  }

  const { startAt, endAt } = buildDefaultSlotWindow(daysAhead)

  const slot = await deliverySlotService.createDeliverySlots({
    code,
    region_id: regionId,
    stock_location_id: stockLocationId,
    start_at: startAt,
    end_at: endAt,
    capacity,
    status: DeliverySlotStatus.ACTIVE,
  })

  console.log("Created delivery slot:")
  console.table([
    {
      id: slot.id,
      code: slot.code,
      region_id: slot.region_id,
      stock_location_id: slot.stock_location_id,
      start_at: slot.start_at,
      end_at: slot.end_at,
      capacity: slot.capacity,
    },
  ])
}
