export enum HubLoftFulfillmentOutboxStatus {
  PENDING = "pending",
  ACCEPTED = "accepted",
  FAILED = "failed",
  MANUAL_REVIEW = "manual_review",
  CANCELLED = "cancelled",
}

export type CreateHubLoftFulfillmentOutboxInput = {
  order_id: string
  reservation_id: string
  delivery_slot_id: string
  payload: Record<string, unknown>
}
