import type {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createBrandWorkflow } from "../../../workflows/create-brand"
import {
  AdminCreateBrandSchema,
  AdminListBrandSchema,
} from "./validators"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const validatedQuery = AdminListBrandSchema.parse(req.query)
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const offset = validatedQuery.offset ?? 0
  const limit = validatedQuery.limit ?? 20

  const { data: brands, metadata } = await query.graph({
    entity: "brand",
    fields: [
      "id",
      "name",
      "description",
      "handle",
      "metadata",
      "created_at",
      "updated_at",
    ],
    pagination: { skip: offset, take: limit },
  })

  res.json({
    brands,
    count: metadata?.count ?? brands.length,
    offset,
    limit,
  })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const validatedData = AdminCreateBrandSchema.parse(req.body)

  const { result } = await createBrandWorkflow(req.scope).run({
    input: validatedData,
  })

  res.json({ brand: result })
}
