import { sdk } from "@lib/config"

import type {
  B2BOrganizationWithRole,
  ListOrganizationsResponse,
  SelectOrganizationPayload,
  SubmitPurchaseRequestPayload,
  SubmitPurchaseRequestResponse,
  DecidePurchaseRequestPayload,
  DecidePurchaseRequestResponse,
  FinanceDecisionPayload,
  FinanceDecisionResponse,
} from "../types/b2b"

export type B2BClientHeaders = Record<string, string>

/**
 * List all B2B organizations for the current customer
 */
export async function listB2BOrganizations(
  headers: B2BClientHeaders = {}
): Promise<B2BOrganizationWithRole[]> {
  const response = await sdk.client.fetch<ListOrganizationsResponse>(
    `/store/customers/me/b2b/organizations`,
    {
      method: "GET",
      headers,
    }
  )

  return response.organizations || []
}

/**
 * Select an organization for a cart (immutable after selection)
 */
export async function selectOrganizationForCart(
  cartId: string,
  payload: SelectOrganizationPayload,
  headers: B2BClientHeaders = {}
): Promise<any> {
  return sdk.client.fetch(`/store/customers/me/b2b/carts/${cartId}/organization`, {
    method: "POST",
    body: payload,
    headers,
  })
}

/**
 * Submit a purchase request for a cart
 */
export async function submitB2BPurchaseRequest(
  payload: SubmitPurchaseRequestPayload,
  headers: B2BClientHeaders = {}
): Promise<SubmitPurchaseRequestResponse> {
  return sdk.client.fetch<SubmitPurchaseRequestResponse>(
    `/store/customers/me/b2b/purchase-requests`,
    {
      method: "POST",
      body: payload,
      headers,
    }
  )
}

/**
 * Approve or reject a purchase request (for APPROVER role)
 */
export async function decidePurchaseRequest(
  purchaseRequestId: string,
  payload: DecidePurchaseRequestPayload,
  headers: B2BClientHeaders = {}
): Promise<DecidePurchaseRequestResponse> {
  return sdk.client.fetch<DecidePurchaseRequestResponse>(
    `/store/customers/me/b2b/purchase-requests/${purchaseRequestId}/decision`,
    {
      method: "POST",
      body: payload,
      headers,
    }
  )
}

/**
 * Make a finance decision on an order (admin/finance operator only)
 */
export async function decideFinanceReview(
  financeReviewId: string,
  payload: FinanceDecisionPayload,
  headers: B2BClientHeaders = {}
): Promise<FinanceDecisionResponse> {
  return sdk.client.fetch<FinanceDecisionResponse>(
    `/admin/b2b/finance-reviews/${financeReviewId}/decision`,
    {
      method: "POST",
      body: payload,
      headers,
    }
  )
}
