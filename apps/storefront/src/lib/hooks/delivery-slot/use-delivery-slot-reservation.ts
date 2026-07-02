"use client"

import { useQuery } from "@tanstack/react-query"

import { getCartDeliverySlotReservation } from "@lib/data/delivery-slots"

import { deliverySlotReservationQueryKeys } from "./query-keys"

type UseDeliverySlotReservationOptions = {
  enabled?: boolean
}

export function useDeliverySlotReservation(
  cartId: string | undefined,
  options: UseDeliverySlotReservationOptions = {}
) {
  const enabled = options.enabled ?? true

  return useQuery({
    queryKey: deliverySlotReservationQueryKeys.cart(cartId ?? ""),
    queryFn: () => {
      if (!cartId) {
        throw new Error("cartId is required to fetch a delivery slot reservation")
      }

      return getCartDeliverySlotReservation(cartId)
    },
    enabled: enabled && Boolean(cartId),
  })
}
