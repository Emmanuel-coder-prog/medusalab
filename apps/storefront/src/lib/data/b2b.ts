"use server"

import { sdk } from "@lib/config"
import medusaError from "@lib/util/medusa-error"
import { getAuthHeaders, getB2BCartContext, setB2BCartContext } from "./cookies"

import type {
  B2BOrganizationWithRole,
  B2BCartContext,
  B2BPurchaseRequest,
  B2BPurchaseRequestDetailResponse,
  SelectOrganizationPayload,
  SelectOrganizationResponse,
  SubmitPurchaseRequestPayload,
  SubmitPurchaseRequestResponse,
  DecidePurchaseRequestPayload,
  DecidePurchaseRequestResponse,
  FinanceDecisionPayload,
  FinanceDecisionResponse,
  AdminFinanceReviewListResponse,
  AdminFinanceReviewDetailResponse,
  ListB2BAuditEventsResponse,  ListB2BExceptionsResponse,} from "@lib/api/types/b2b"

/**
 * List all B2B organizations for the current authenticated customer
 */
export async function listB2BOrganizations(): Promise<B2BOrganizationWithRole[]> {
  const authHeaders = await getAuthHeaders()

  if (!authHeaders) {
    return []
  }

  return await sdk.client
    .fetch<{ organizations: B2BOrganizationWithRole[] }>(
      `/store/customers/me/b2b/organizations`,
      {
        method: "GET",
        headers: authHeaders,
      }
    )
    .then(({ organizations }) => organizations || [])
    .catch(() => [])
}

export type CreateB2BOrganizationInput = {
  legal_name: string
  display_name: string
  handle: string
  approval_threshold?: number
  approval_currency_code?: string
  requires_merchant_quote?: boolean
  quote_validity_days?: number
}

export async function createB2BOrganization(
  input: CreateB2BOrganizationInput
) {
  const authHeaders = await getAuthHeaders()

  if (!authHeaders) {
    throw new Error("Not authenticated")
  }

  return await sdk.client
    .fetch<{ organization: B2BOrganizationWithRole }>(
      `/store/customers/me/b2b/organizations`,
      {
        method: "POST",
        body: input,
        headers: authHeaders,
      }
    )
    .catch(medusaError)
}

export async function selectOrganizationForCart(
  cartId: string,
  organizationId: string
): Promise<SelectOrganizationResponse> {
  const authHeaders = await getAuthHeaders()

  if (!authHeaders) {
    throw new Error("Not authenticated")
  }

  const payload: SelectOrganizationPayload = {
    organization_id: organizationId,
  }

  return await sdk.client
    .fetch<SelectOrganizationResponse>(
      `/store/customers/me/b2b/carts/${cartId}/organization`,
      {
        method: "POST",
        body: payload,
        headers: authHeaders,
      }
    )
    .catch(medusaError)
}

export async function submitB2BPurchaseRequest(
  cartId: string,
  purchaseOrderNumber?: string
): Promise<SubmitPurchaseRequestResponse> {
  const authHeaders = await getAuthHeaders()

  if (!authHeaders) {
    throw new Error("Not authenticated")
  }

  const payload: SubmitPurchaseRequestPayload = {
    cart_id: cartId,
    purchase_order_number: purchaseOrderNumber,
  }

  return await sdk.client
    .fetch<SubmitPurchaseRequestResponse>(
      `/store/customers/me/b2b/purchase-requests`,
      {
        method: "POST",
        body: payload,
        headers: authHeaders,
      }
    )
    .catch(medusaError)
}

export async function listPurchaseRequestsForApproval(
  organizationId?: string
): Promise<B2BPurchaseRequest[]> {
  const authHeaders = await getAuthHeaders()

  if (!authHeaders) {
    throw new Error("Not authenticated")
  }

  const response = await sdk.client
    .fetch<{ purchase_requests: B2BPurchaseRequest[] }>(
      `/store/customers/me/b2b/purchase-requests`,
      {
        method: "GET",
        headers: authHeaders,
        query: organizationId ? { organization_id: organizationId } : undefined,
      }
    )
    .catch(medusaError)

  return response.purchase_requests || []
}

export async function retrievePurchaseRequestForApproval(
  purchaseRequestId: string
): Promise<B2BPurchaseRequestDetailResponse> {
  const authHeaders = await getAuthHeaders()

  if (!authHeaders) {
    throw new Error("Not authenticated")
  }

  return await sdk.client
    .fetch<B2BPurchaseRequestDetailResponse>(
      `/store/customers/me/b2b/purchase-requests/${purchaseRequestId}`,
      {
        method: "GET",
        headers: authHeaders,
      }
    )
    .catch(medusaError)
}

export async function decidePurchaseRequest(
  purchaseRequestId: string,
  decision: "approved" | "rejected",
  note?: string
): Promise<DecidePurchaseRequestResponse> {
  const authHeaders = await getAuthHeaders()

  if (!authHeaders) {
    throw new Error("Not authenticated")
  }

  const payload: DecidePurchaseRequestPayload = {
    decision,
    note,
  }

  return await sdk.client
    .fetch<DecidePurchaseRequestResponse>(
      `/store/customers/me/b2b/purchase-requests/${purchaseRequestId}/decision`,
      {
        method: "POST",
        body: payload,
        headers: authHeaders,
      }
    )
    .catch(medusaError)
}

/**
 * Accept a quote for a purchase request (buyer acceptance)
 * Converts PENDING_BUYER_ACCEPTANCE to CONVERTED status and creates the order
 */
export async function acceptQuote(
  purchaseRequestId: string
): Promise<DecidePurchaseRequestResponse> {
  const authHeaders = await getAuthHeaders()

  if (!authHeaders) {
    throw new Error("Not authenticated")
  }

  return await sdk.client
    .fetch<DecidePurchaseRequestResponse>(
      `/store/customers/me/b2b/purchase-requests/${purchaseRequestId}/decision`,
      {
        method: "POST",
        body: { decision: "approved" },
        headers: authHeaders,
      }
    )
    .catch(medusaError)
}

/**
 * Retrieve a quote for the current buyer (requires PENDING_BUYER_ACCEPTANCE status)
 */
export async function retrieveQuoteForBuyer(
  purchaseRequestId: string
): Promise<B2BPurchaseRequestDetailResponse> {
  const authHeaders = await getAuthHeaders()

  if (!authHeaders) {
    throw new Error("Not authenticated")
  }

  return await sdk.client
    .fetch<B2BPurchaseRequestDetailResponse>(
      `/store/customers/me/b2b/purchase-requests/${purchaseRequestId}`,
      {
        method: "GET",
        headers: authHeaders,
      }
    )
    .catch(medusaError)
}

export async function decideFinanceReview(
  financeReviewId: string,
  decision: "approved_on_account" | "prepayment_required" | "rejected" | "manual_review",
  reasonCode?: string,
  note?: string
): Promise<FinanceDecisionResponse> {
  const authHeaders = await getAuthHeaders()

  if (!authHeaders) {
    throw new Error("Not authenticated")
  }

  const payload: FinanceDecisionPayload = {
    decision,
    reason_code: reasonCode,
    note,
  }

  return await sdk.client
    .fetch<FinanceDecisionResponse>(
      `/admin/b2b/finance-reviews/${financeReviewId}/decision`,
      {
        method: "POST",
        body: payload,
        headers: authHeaders,
      }
    )
    .catch(medusaError)
}

export async function listFinanceReviews(): Promise<AdminFinanceReviewListResponse> {
  const authHeaders = await getAuthHeaders()

  if (!authHeaders) {
    throw new Error("Not authenticated")
  }

  return await sdk.client
    .fetch<AdminFinanceReviewListResponse>(`/admin/b2b/finance-reviews`, {
      method: "GET",
      headers: authHeaders,
    })
    .catch(medusaError)
}

export async function retrieveFinanceReview(
  financeReviewId: string
): Promise<AdminFinanceReviewDetailResponse> {
  const authHeaders = await getAuthHeaders()

  if (!authHeaders) {
    throw new Error("Not authenticated")
  }

  return await sdk.client
    .fetch<AdminFinanceReviewDetailResponse>(
      `/admin/b2b/finance-reviews/${financeReviewId}`,
      {
        method: "GET",
        headers: authHeaders,
      }
    )
    .catch(medusaError)
}

export async function listB2BAuditEvents(
  params?: {
    entity_type?: string
    entity_id?: string
    organization_id?: string
    action?: string
    actor_type?: string
    take?: number
    skip?: number
  }
): Promise<ListB2BAuditEventsResponse> {
  const authHeaders = await getAuthHeaders()

  if (!authHeaders) {
    throw new Error("Not authenticated")
  }

  const query = new URLSearchParams()

  if (params?.entity_type) query.set("entity_type", params.entity_type)
  if (params?.entity_id) query.set("entity_id", params.entity_id)
  if (params?.organization_id) query.set("organization_id", params.organization_id)
  if (params?.action) query.set("action", params.action)
  if (params?.actor_type) query.set("actor_type", params.actor_type)
  if (params?.take !== undefined) query.set("take", String(params.take))
  if (params?.skip !== undefined) query.set("skip", String(params.skip))

  return await sdk.client
    .fetch<ListB2BAuditEventsResponse>(
      `/admin/b2b/activity${query.size > 0 ? `?${query.toString()}` : ""}`,
      {
        method: "GET",
        headers: authHeaders,
      }
    )
    .catch(medusaError)
}

export async function getB2BCartContextFromCookie() {
  return await getB2BCartContext()
}

export async function saveB2BCartContext(cartId: string, organizationId: string) {
  return await setB2BCartContext(cartId, organizationId)
}

/**
 * Retrieve payment terms obligation for an order
 * Used for both FLOW A (approved on account) and FLOW B (prepayment)
 */
export async function retrievePaymentTermsObligation(orderId: string): Promise<any> {
  const authHeaders = await getAuthHeaders()

  if (!authHeaders) {
    return null
  }

  return await sdk.client
    .fetch<{ payment_terms_obligation: any }>(
      `/store/orders/${orderId}/payment-terms`,
      {
        method: "GET",
        headers: authHeaders,
      }
    )
    .then(({ payment_terms_obligation }) => payment_terms_obligation)
    .catch(() => null)
}

/**
 * Retrieve finance review for an order
 * Needed to determine if order is prepayment_required or approved_on_account
 */
export async function retrieveOrderFinanceReview(orderId: string): Promise<any> {
  const authHeaders = await getAuthHeaders()

  if (!authHeaders) {
    return null
  }

  return await sdk.client
    .fetch<{ finance_review: any }>(
      `/store/orders/${orderId}/finance-review`,
      {
        method: "GET",
        headers: authHeaders,
      }
    )
    .then(({ finance_review }) => finance_review)
    .catch(() => null)
}

/**
 * List B2B operational exceptions and reconciliation items
 * Aggregated view of exceptions across:
 * - Finance reviews pending too long
 * - Expired finance reviews
 * - Overdue payment obligations
 * - Eligible releases not dispatched
 * - Blocked orders
 * - Failed warehouse handoffs
 */
export async function listB2BExceptions(): Promise<ListB2BExceptionsResponse> {
  const authHeaders = await getAuthHeaders()

  if (!authHeaders) {
    throw new Error("Not authenticated")
  }

  return await sdk.client
    .fetch<ListB2BExceptionsResponse>(`/admin/b2b/exceptions`, {
      method: "GET",
      headers: authHeaders,
    })
    .catch(medusaError)
}

