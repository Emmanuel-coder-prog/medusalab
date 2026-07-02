import { sdk } from "@lib/config"

import type {
  ListDeliverySlotsParams,
  ListDeliverySlotsResponse,
} from "../types/delivery-slot"

export type DeliverySlotClientHeaders = Record<string, string>

export async function listDeliverySlots(
  params: ListDeliverySlotsParams,
  headers: DeliverySlotClientHeaders = {}
): Promise<ListDeliverySlotsResponse> {
  const { region_id, offset = 0, limit = 20 } = params

  return sdk.client.fetch<ListDeliverySlotsResponse>(`/store/delivery-slots`, {
    method: "GET",
    query: {
      region_id,
      offset,
      limit,
    },
    headers,
  })
}
