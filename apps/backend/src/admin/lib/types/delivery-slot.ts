export type DeliverySlotStatus = "active" | "disabled"

export type DeliverySlotReservationStatus = "active" | "released" | "expired"

export type DeliverySlot = {
  id: string
  code: string
  region_id: string
  stock_location_id: string | null
  start_at: string
  end_at: string
  capacity: number
  status: DeliverySlotStatus
  active_reservations?: number
  created_at?: string | null
  updated_at?: string | null
}

export type DeliverySlotReservation = {
  id: string
  cart_id: string
  customer_id: string
  status: DeliverySlotReservationStatus
  expires_at: string
  slot_id: string
  created_at?: string | null
  updated_at?: string | null
}

export type DeliverySlotListResponse = {
  delivery_slots: DeliverySlot[]
  count: number
  offset: number
  limit: number
}

export type DeliverySlotResponse = {
  delivery_slot: DeliverySlot
}

export type DeliverySlotReservationListResponse = {
  reservations: DeliverySlotReservation[]
  count: number
  offset: number
  limit: number
}

export type DeliverySlotFormValues = {
  code: string
  region_id: string
  stock_location_id: string
  start_at: string
  end_at: string
  capacity: string
  status: DeliverySlotStatus
}

export type RegionOption = {
  id: string
  name: string
}

export type StockLocationOption = {
  id: string
  name: string
}

export const emptyDeliverySlotForm = (): DeliverySlotFormValues => ({
  code: "",
  region_id: "",
  stock_location_id: "",
  start_at: "",
  end_at: "",
  capacity: "10",
  status: "active",
})

export const formatDateTime = (value?: string | null) => {
  if (!value) {
    return "—"
  }

  const parsedDate = new Date(value)

  if (Number.isNaN(parsedDate.getTime())) {
    return "—"
  }

  return parsedDate.toLocaleString()
}

export const formatDate = (value?: string | null) => {
  if (!value) {
    return "—"
  }

  const parsedDate = new Date(value)

  if (Number.isNaN(parsedDate.getTime())) {
    return "—"
  }

  return parsedDate.toLocaleDateString()
}

export const toDateTimeLocalValue = (value?: string | null) => {
  if (!value) {
    return ""
  }

  const parsedDate = new Date(value)

  if (Number.isNaN(parsedDate.getTime())) {
    return ""
  }

  const offset = parsedDate.getTimezoneOffset()
  const localDate = new Date(parsedDate.getTime() - offset * 60 * 1000)

  return localDate.toISOString().slice(0, 16)
}

export const fromDateTimeLocalValue = (value: string) => {
  return new Date(value).toISOString()
}

export const deliverySlotToFormValues = (slot: DeliverySlot): DeliverySlotFormValues => ({
  code: slot.code,
  region_id: slot.region_id,
  stock_location_id: slot.stock_location_id ?? "",
  start_at: toDateTimeLocalValue(slot.start_at),
  end_at: toDateTimeLocalValue(slot.end_at),
  capacity: String(slot.capacity),
  status: slot.status,
})

export const isDeliverySlotFormValid = (form: DeliverySlotFormValues) => {
  return (
    form.code.trim() &&
    form.region_id &&
    form.start_at &&
    form.end_at &&
    Number.parseInt(form.capacity, 10) > 0
  )
}

export const buildDeliverySlotPayload = (form: DeliverySlotFormValues) => ({
  code: form.code.trim(),
  region_id: form.region_id,
  stock_location_id: form.stock_location_id || null,
  start_at: fromDateTimeLocalValue(form.start_at),
  end_at: fromDateTimeLocalValue(form.end_at),
  capacity: Number.parseInt(form.capacity, 10),
  status: form.status,
})
