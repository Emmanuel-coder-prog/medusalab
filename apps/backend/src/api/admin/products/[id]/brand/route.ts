import type {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { linkProductBrandWorkflow } from "../../../../../workflows/link-product-brand"
import { AdminLinkProductBrandSchema } from "./validators"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { id: productId } = req.params
  const validatedBody = AdminLinkProductBrandSchema.parse(req.body)

  await linkProductBrandWorkflow(req.scope).run({
    input: {
      product_id: productId,
      brand_id: validatedBody.brand_id,
    },
  })

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "brand.*"],
    filters: { id: productId },
  })

  res.json({ product: products[0] })
}
