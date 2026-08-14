import { defineLink } from "@medusajs/framework/utils"
import CustomerModule from "@medusajs/medusa/customer"

import B2BOrganizationModule from "../modules/b2b-organization"

export default defineLink(
  {
    linkable: (B2BOrganizationModule.linkable as any).b2bOrganizationMember,
    field: "customer_id",
  },
  CustomerModule.linkable.customer,
  {
    readOnly: true,
  }
)
