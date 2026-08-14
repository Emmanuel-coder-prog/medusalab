import { defineLink } from "@medusajs/framework/utils"
import OrderModule from "@medusajs/medusa/order"

import B2BPurchaseModule from "../modules/b2b-purchase"

export default defineLink(
  {
    linkable:
      (B2BPurchaseModule.linkable as any).b2bPurchaseRequest.id,
    field: "draft_order_id",
  },
  {
    linkable: OrderModule.linkable.order,
    alias: "draft_order",
  },
  {
    readOnly: true,
  }
)
