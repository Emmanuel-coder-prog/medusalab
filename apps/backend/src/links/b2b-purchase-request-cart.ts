import { defineLink } from "@medusajs/framework/utils"
import CartModule from "@medusajs/medusa/cart"

import B2BPurchaseModule from "../modules/b2b-purchase"

export default defineLink(
  {
    linkable:
      (B2BPurchaseModule.linkable as any).b2bPurchaseRequest.id,
    field: "cart_id",
  },
  CartModule.linkable.cart,
  {
    readOnly: true,
  }
)
