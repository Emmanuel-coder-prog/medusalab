import type {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { createBrandWorkflow } from "../../../workflows/create-brand"
import {
  AdminCreateBrandSchema,
  AdminListBrandSchema,
} from "./validators"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const brandModuleService = req.scope.resolve("brand")

  const offset = parseInt(req.query.offset as string) || 0
  const limit = parseInt(req.query.limit as string) || 20

  const [brands, count] = await brandModuleService.listAndCountBrands(
    {},
    { skip: offset, take: limit }
  )

  res.json({
    brands,
    count,
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
