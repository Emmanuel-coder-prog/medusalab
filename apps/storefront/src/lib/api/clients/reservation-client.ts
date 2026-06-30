import { sdk } from "@lib/config"

import type {
  GetCartDeliverySlotReservationResponse,
  ReserveDeliverySlotPayload,
  ReserveDeliverySlotResponse,
} from "../types/delivery-slot"

export type ReservationClientHeaders = Record<string, string>

type FetchErrorLike = {
  status?: number
  message?: string
}

function isNotFoundError(error: unknown): boolean {
  const fetchError = error as FetchErrorLike

  return fetchError.status === 404
}

function isUnauthorizedError(error: unknown): boolean {
  const fetchError = error as FetchErrorLike

  return fetchError.status === 401 || fetchError.status === 403
}

export async function getCartDeliverySlotReservation(
  cartId: string,
  headers: ReservationClientHeaders = {}
): Promise<GetCartDeliverySlotReservationResponse> {
  try {
    return await sdk.client.fetch<GetCartDeliverySlotReservationResponse>(
      `/store/customers/me/carts/${cartId}/delivery-slot`,
      {
        method: "GET",
        headers,
      }
    )
  } catch (error) {
    if (isNotFoundError(error) || isUnauthorizedError(error)) {
      return { reservation: null }
    }

    throw error
  }
}

export async function reserveDeliverySlotForCart(
  cartId: string,
  payload: ReserveDeliverySlotPayload,
  headers: ReservationClientHeaders = {}
): Promise<ReserveDeliverySlotResponse> {
  return sdk.client.fetch<ReserveDeliverySlotResponse>(
    `/store/customers/me/carts/${cartId}/delivery-slot`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: payload,
    }
  )
}
