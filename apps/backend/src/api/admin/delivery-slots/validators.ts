import { z } from "@medusajs/framework/zod"

import { DeliverySlotStatus } from "../../../modules/delivery-slot/types"

export const AdminListDeliverySlotsSchema = z.object({
  offset: z.coerce.number().int().min(0).optional(),
  limit: z.coerce.number().int().min(1).optional(),
  status: z.nativeEnum(DeliverySlotStatus).optional(),
})

export const AdminCreateDeliverySlotSchema = z
  .object({
    code: z.string().min(1, "Code is required"),
    region_id: z.string().min(1, "Region is required"),
    stock_location_id: z.string().nullable().optional(),
    start_at: z.string().datetime({ message: "Start time is required" }),
    end_at: z.string().datetime({ message: "End time is required" }),
    capacity: z.coerce.number().int().min(1, "Capacity must be at least 1"),
    status: z.nativeEnum(DeliverySlotStatus).optional(),
  })
  .refine((data) => new Date(data.end_at) > new Date(data.start_at), {
    message: "End time must be after start time",
    path: ["end_at"],
  })

export const AdminUpdateDeliverySlotSchema = z
  .object({
    code: z.string().min(1).optional(),
    region_id: z.string().min(1).optional(),
    stock_location_id: z.string().nullable().optional(),
    start_at: z.string().datetime().optional(),
    end_at: z.string().datetime().optional(),
    capacity: z.coerce.number().int().min(1).optional(),
    status: z.nativeEnum(DeliverySlotStatus).optional(),
  })
  .refine(
    (data) => {
      if (data.start_at && data.end_at) {
        return new Date(data.end_at) > new Date(data.start_at)
      }

      return true
    },
    {
      message: "End time must be after start time",
      path: ["end_at"],
    }
  )

export const AdminListDeliverySlotReservationsSchema = z.object({
  offset: z.coerce.number().int().min(0).optional(),
  limit: z.coerce.number().int().min(1).optional(),
})
