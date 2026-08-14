import { defineLink } from "@medusajs/framework/utils"
import CartModule from "@medusajs/medusa/cart"

import B2BOrganizationModule from "../modules/b2b-organization"

export default defineLink(
  {
    linkable: (B2BOrganizationModule.linkable as any).b2bCartContext,
    field: "cart_id",
  },
  CartModule.linkable.cart,
  {
    readOnly: true,
  }
)
