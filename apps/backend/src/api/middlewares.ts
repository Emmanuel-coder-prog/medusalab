import {
  authenticate,
  defineMiddlewares,
  validateAndTransformBody,
} from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import {
  AdminCreateDeliverySlotSchema,
  AdminUpdateDeliverySlotSchema,
} from "./admin/delivery-slots/validators"
import { PostSelectDeliverySlot } from "./store/customers/me/carts/[id]/delivery-slot/validators"



export default defineMiddlewares({
  routes: [
    {
      matcher: "/admin/products",
      methods: ["POST"],
      additionalDataValidator: {
        brand_id: z.string().optional(),
      },
    },
    
    {
      matcher: "/store/customers/me/carts/:id/delivery-slot",
      methods: ["GET"],
      middlewares: [authenticate("*", "bearer", { allowUnauthenticated: true })],
    },
    {
      matcher: "/store/customers/me/carts/:id/delivery-slot",
      methods: ["POST"],
      middlewares: [
        authenticate("*", "bearer", { allowUnauthenticated: true }),
        validateAndTransformBody(PostSelectDeliverySlot),
      ],
    },
    {
      matcher: "/admin/delivery-slots",
      methods: ["POST"],
      middlewares: [validateAndTransformBody(AdminCreateDeliverySlotSchema)],
    },
    {
      matcher: "/admin/delivery-slots/:id",
      methods: ["POST"],
      middlewares: [validateAndTransformBody(AdminUpdateDeliverySlotSchema)],
    },

  ],
})
