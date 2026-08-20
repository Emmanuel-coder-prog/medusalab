import { sdk } from "@lib/config"

import type {
  B2BPurchaseRequest,
} from "@lib/api/types/b2b"

export type AdminB2BClientHeaders = Record<string, string>

/**
 * List purchase requests awaiting merchant quotes
 * 
 * This endpoint is admin-only and requires admin authentication.
 */
export async function listB2BQuoteQueue(
  status?: string,
  skip?: number,
  take?: number,
  headers: AdminB2BClientHeaders = {}
): Promise<{ purchase_requests: B2BPurchaseRequest[]; total: number }> {
  const params = new URLSearchParams()
  if (status) params.append("status", status)
  if (skip !== undefined) params.append("skip", skip.toString())
  if (take !== undefined) params.append("take", take.toString())

  return sdk.client.fetch<{
    purchase_requests: B2BPurchaseRequest[]
    total: number
  }>(
    `/admin/b2b/purchase-requests${params.size > 0 ? `?${params}` : ""}`,
    {
      method: "GET",
      headers,
    }
  )
}

/**
 * Retrieve a single purchase request details for merchant review
 */
export async function getB2BPurchaseRequestDetail(
  purchaseRequestId: string,
  headers: AdminB2BClientHeaders = {}
): Promise<{ purchase_request: B2BPurchaseRequest }> {
  return sdk.client.fetch<{ purchase_request: B2BPurchaseRequest }>(
    `/admin/b2b/purchase-requests/${purchaseRequestId}`,
    {
      method: "GET",
      headers,
    }
  )
}

/**
 * Send a quote offer to the buyer
 * 
 * Transitions the purchase request from PENDING_MERCHANT_QUOTE to PENDING_BUYER_ACCEPTANCE.
 * The merchant must have already edited the draft order using Medusa's native mechanisms.
 */
export async function sendB2BQuoteOffer(
  purchaseRequestId: string,
  payload: { note?: string } = {},
  headers: AdminB2BClientHeaders = {}
): Promise<{ purchase_request: B2BPurchaseRequest }> {
  return sdk.client.fetch<{ purchase_request: B2BPurchaseRequest }>(
    `/admin/b2b/purchase-requests/${purchaseRequestId}/offer`,
    {
      method: "POST",
      body: payload,
      headers,
    }
  )
}

/**
 * Reject a purchase request (cancel quotation)
 */
export async function rejectB2BPurchaseRequest(
  purchaseRequestId: string,
  payload: { reason: string },
  headers: AdminB2BClientHeaders = {}
): Promise<{ purchase_request: B2BPurchaseRequest }> {
  return sdk.client.fetch<{ purchase_request: B2BPurchaseRequest }>(
    `/admin/b2b/purchase-requests/${purchaseRequestId}/reject`,
    {
      method: "POST",
      body: payload,
      headers,
    }
  )
}
