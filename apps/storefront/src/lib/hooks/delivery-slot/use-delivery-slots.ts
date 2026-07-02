"use client"

import { useQuery } from "@tanstack/react-query"

import { listDeliverySlots } from "@lib/data/delivery-slots"
import type { ListDeliverySlotsParams } from "@lib/api/types/delivery-slot"

import { deliverySlotQueryKeys } from "./query-keys"

type UseDeliverySlotsOptions = {
  enabled?: boolean
}

export function useDeliverySlots(
  params: ListDeliverySlotsParams | undefined,
  options: UseDeliverySlotsOptions = {}
) {
  const regionId = params?.region_id
  const offset = params?.offset
  const limit = params?.limit
  const enabled = options.enabled ?? true

  return useQuery({
    queryKey: deliverySlotQueryKeys.list(regionId ?? "", offset, limit),
    queryFn: () => {
      if (!params?.region_id) {
        throw new Error("region_id is required to list delivery slots")
      }

      return listDeliverySlots(params)
    },
    enabled: enabled && Boolean(regionId),
  })
}
