"use server"

import { listDeliverySlots as listDeliverySlotsRequest } from "@lib/api/clients/delivery-slot-client"
import {
  getCartDeliverySlotReservation as getCartDeliverySlotReservationRequest,
  reserveDeliverySlotForCart as reserveDeliverySlotForCartRequest,
} from "@lib/api/clients/reservation-client"
import type {
  ListDeliverySlotsParams,
  ReserveDeliverySlotPayload,
} from "@lib/api/types/delivery-slot"
import medusaError from "@lib/util/medusa-error"
import { revalidateTag } from "next/cache"

import { getAuthHeaders, getCacheTag } from "./cookies"

export async function listDeliverySlots(params: ListDeliverySlotsParams) {
  const headers = {
    ...(await getAuthHeaders()),
  }

  try {
    return await listDeliverySlotsRequest(params, headers)
  } catch (error) {
    return medusaError(error)
  }
}

export async function getCartDeliverySlotReservation(cartId: string) {
  const headers = {
    ...(await getAuthHeaders()),
  }

  try {
    return await getCartDeliverySlotReservationRequest(cartId, headers)
  } catch (error) {
    return medusaError(error)
  }
}

export async function reserveDeliverySlotForCart(
  cartId: string,
  payload: ReserveDeliverySlotPayload
) {
  const headers = {
    ...(await getAuthHeaders()),
  }

  try {
    const result = await reserveDeliverySlotForCartRequest(
      cartId,
      payload,
      headers
    )

    const cartCacheTag = await getCacheTag("carts")
    revalidateTag(cartCacheTag)

    return result
  } catch (error) {
    return medusaError(error)
  }
}
