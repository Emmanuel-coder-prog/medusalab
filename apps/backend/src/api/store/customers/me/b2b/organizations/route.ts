import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { z } from "@medusajs/framework/zod"

import { B2B_ORGANIZATION_MODULE } from "../../../../../../modules/b2b-organization"

import B2BOrganizationModuleService from "../../../../../../modules/b2b-organization/service"

import {
  B2BOrganizationMemberStatus,
  B2BOrganizationStatus,
  B2BOrganizationRole,
} from "../../../../../../modules/b2b-organization/types"

import {
  PostB2BOrganization,
} from "./validators"

type CreateOrgBody = z.infer<typeof PostB2BOrganization>

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const service =
    req.scope.resolve<B2BOrganizationModuleService>(
      B2B_ORGANIZATION_MODULE
    )

  const customerId = req.auth_context.actor_id

  const memberships =
    await service.listB2BOrganizationMembers({
      customer_id: customerId,
      status: B2BOrganizationMemberStatus.ACTIVE,
    })

  const organizationIds = memberships.map(
    (membership) => membership.organization_id
  )

  if (organizationIds.length === 0) {
    return res.json({
      organizations: [],
    })
  }

  const organizations =
    await service.listB2BOrganizations({
      id: organizationIds,
      status: B2BOrganizationStatus.ACTIVE,
    })

  const roleByOrganization = new Map(
    memberships.map((membership) => [
      membership.organization_id,
      membership.role,
    ])
  )

  return res.json({
    organizations: organizations.map((organization) => ({
      id: organization.id,
      display_name: organization.display_name,
      handle: organization.handle,
      sales_channel_id: organization.sales_channel_id,
      role: roleByOrganization.get(organization.id),
    })),
  })
}

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const customerId = req.auth_context?.actor_id

  if (!customerId) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "Customer authentication is required."
    )
  }

  let validatedData: CreateOrgBody

  try {
    validatedData = PostB2BOrganization.parse(req.body)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join(', ')
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        errorMessages
      )
    }
    throw error
  }

  const service = req.scope.resolve<B2BOrganizationModuleService>(
    B2B_ORGANIZATION_MODULE
  )

  // Check if handle is already taken
  const existingOrg = await service.listB2BOrganizations({
    handle: validatedData.handle,
  })

  if (existingOrg.length > 0) {
    throw new MedusaError(
      MedusaError.Types.CONFLICT,
      `Organization with handle "${validatedData.handle}" already exists.`
    )
  }

  // Get sales channel from context (using first active one or derive from request)
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const customer = await query.graph({
    entity: "customer",
    fields: ["id", "email"],
    filters: { id: customerId },
  })

  const currentCustomer = customer?.data?.[0]
  if (!currentCustomer) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "Unable to retrieve customer information."
    )
  }

  // Get sales channel from request context
  const salesChannelId = req.publishable_key_context?.sales_channel_ids?.[0]
  if (!salesChannelId) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Sales channel information is required."
    )
  }

  // Create the organization
  const payload: Record<string, any> = {
    legal_name: validatedData.legal_name,
    display_name: validatedData.display_name,
    handle: validatedData.handle,
    status: B2BOrganizationStatus.ACTIVE,
    sales_channel_id: salesChannelId,
  }

  if (validatedData.approval_threshold) {
    payload.approval_threshold = validatedData.approval_threshold
  }
  if (validatedData.approval_currency_code) {
    payload.approval_currency_code = validatedData.approval_currency_code
  }
  if (validatedData.requires_merchant_quote) {
    payload.requires_merchant_quote = validatedData.requires_merchant_quote
  }
  if (validatedData.quote_validity_days) {
    payload.quote_validity_days = validatedData.quote_validity_days
  }

  const organization = await service.createB2BOrganizations(payload)

  // Create the member entry with OWNER role for the creating customer
  const memberPayload = {
    customer_id: customerId,
    organization_id: organization.id,
    role: B2BOrganizationRole.OWNER,
    status: B2BOrganizationMemberStatus.ACTIVE,
  }

  await service.createB2BOrganizationMembers(memberPayload)

  return res.json({
    organization: {
      id: organization.id,
      legal_name: organization.legal_name,
      display_name: organization.display_name,
      handle: organization.handle,
      sales_channel_id: organization.sales_channel_id,
      approval_threshold: organization.approval_threshold,
      approval_currency_code: organization.approval_currency_code,
      requires_merchant_quote: organization.requires_merchant_quote,
      quote_validity_days: organization.quote_validity_days,
      status: organization.status,
      role: B2BOrganizationRole.OWNER,
    },
  })
}
