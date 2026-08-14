import { defineLink } from "@medusajs/framework/utils"
import OrderModule from "@medusajs/medusa/order"

import B2BPurchaseModule from "../modules/b2b-purchase"

export default defineLink(
  {
    linkable:
      B2BPurchaseModule.linkable.b2bPurchaseRequest.id,
    field: "order_id",
  },
  {
    linkable: OrderModule.linkable.order,
    alias: "order",
  },
  {
    readOnly: true,
  }
)
