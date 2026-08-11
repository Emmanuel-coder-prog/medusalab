import { MedusaService } from "@medusajs/framework/utils"

import { FulfillmentOutbox } from "./models/fulfillment-outbox"
import {
  CreateHubLoftFulfillmentOutboxInput,
  HubLoftFulfillmentOutboxStatus,
} from "./types"

class HubLoftModuleService extends MedusaService({
  FulfillmentOutbox,
}) {
  async createPendingFulfillmentOutbox(
    input: CreateHubLoftFulfillmentOutboxInput
  ) {
    const deterministicKey = `retail-global:order:${input.order_id}:fulfillment-v1`

    const existing = await this.listFulfillmentOutboxes({
      order_id: input.order_id,
      status: HubLoftFulfillmentOutboxStatus.PENDING,
    })

    if (existing.length > 0) {
      return existing[0]
    }

    return this.createFulfillmentOutboxes({
      id: deterministicKey,
      order_id: input.order_id,
      reservation_id: input.reservation_id,
      delivery_slot_id: input.delivery_slot_id,
      status: HubLoftFulfillmentOutboxStatus.PENDING,
      payload: input.payload,
      attempts: 0,
      last_error: null,
    })
  }
}

export default HubLoftModuleService
