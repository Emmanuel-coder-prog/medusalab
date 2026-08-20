import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import { B2B_AUDIT_MODULE } from "../../../../modules/b2b-audit"
import B2BAuditModuleService from "../../../../modules/b2b-audit/service"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const auditService = req.scope.resolve<B2BAuditModuleService>(
    B2B_AUDIT_MODULE
  )

  const {
    entity_type,
    entity_id,
    organization_id,
    action,
    actor_type,
    take = 20,
    skip = 0,
  } = req.query as Record<string, string | undefined>

  const filters: Record<string, unknown> = {}
  if (entity_type) filters.entity_type = entity_type
  if (entity_id) filters.entity_id = entity_id
  if (organization_id) filters.organization_id = organization_id
  if (action) filters.action = action
  if (actor_type) filters.actor_type = actor_type

  const events = await auditService.listB2BAuditEvents(filters, {
    order: { occurred_at: "DESC" },
    skip: Number(skip),
    take: Number(take),
  })

  return res.json({
    audit_events: events,
    count: events?.length ?? 0,
    total: events?.length ?? 0,
  })
}
