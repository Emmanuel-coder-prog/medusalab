import { defineMiddlewares } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"

export default defineMiddlewares({
  routes: [
    {
      matcher: "/admin/products",
      methods: ["POST"],
      additionalDataValidator: {
        brand_id: z.string().optional(),
      },
    },
  ],
})
