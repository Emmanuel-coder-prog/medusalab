import { model } from "@medusajs/framework/utils"

import { HubLoftFulfillmentOutboxStatus } from "../types"

export const FulfillmentOutbox = model.define("hubloft_fulfillment_outbox", {
  id: model.id().primaryKey(),

  order_id: model.text().index(),
  reservation_id: model.text().index().nullable(),
  delivery_slot_id: model.text().index().nullable(),

  status: model
    .enum(Object.values(HubLoftFulfillmentOutboxStatus))
    .default(HubLoftFulfillmentOutboxStatus.PENDING),

  payload: model.json().nullable(),

  attempts: model.number().default(0),

  last_error: model.text().nullable(),

  sent_at: model.dateTime().nullable(),
  accepted_at: model.dateTime().nullable(),
  failed_at: model.dateTime().nullable(),
  cancelled_at: model.dateTime().nullable(),
})
