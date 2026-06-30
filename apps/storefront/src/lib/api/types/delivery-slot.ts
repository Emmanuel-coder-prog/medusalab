export type DeliverySlotStatus = "active" | "disabled"

export type DeliverySlotReservationStatus = "active" | "released" | "expired"

export type StoreDeliverySlot = {
  id: string
  code: string
  region_id: string
  stock_location_id: string | null
  start_at: string
  end_at: string
  capacity: number
  status: DeliverySlotStatus
  available_capacity?: number
  created_at?: string
  updated_at?: string
}

export type StoreDeliverySlotReservation = {
  id: string
  cart_id: string
  customer_id: string
  slot_id: string
  status: DeliverySlotReservationStatus
  expires_at: string
  created_at?: string
  updated_at?: string
  slot?: StoreDeliverySlot
}

export type ListDeliverySlotsParams = {
  region_id: string
  offset?: number
  limit?: number
}

export type ListDeliverySlotsResponse = {
  delivery_slots: StoreDeliverySlot[]
  count: number
  offset: number
  limit: number
}

export type GetCartDeliverySlotReservationResponse = {
  reservation: StoreDeliverySlotReservation | null
}

export type ReserveDeliverySlotPayload = {
  slot_id: string
}

export type ReserveDeliverySlotResponse = {
  reservation: StoreDeliverySlotReservation
  already_reserved: boolean
}
