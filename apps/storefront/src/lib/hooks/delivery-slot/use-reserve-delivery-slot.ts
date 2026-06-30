"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

import { reserveDeliverySlotForCart } from "@lib/data/delivery-slots"
import type { ReserveDeliverySlotPayload } from "@lib/api/types/delivery-slot"

import {
  deliverySlotQueryKeys,
  deliverySlotReservationQueryKeys,
} from "./query-keys"

type ReserveDeliverySlotVariables = {
  cartId: string
  payload: ReserveDeliverySlotPayload
}

export function useReserveDeliverySlot() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ cartId, payload }: ReserveDeliverySlotVariables) =>
      reserveDeliverySlotForCart(cartId, payload),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: deliverySlotReservationQueryKeys.cart(variables.cartId),
      })
      await queryClient.invalidateQueries({
        queryKey: deliverySlotQueryKeys.lists(),
      })
    },
  })
}
