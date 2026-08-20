"use server"

import { sdk } from "@lib/config"
import medusaError from "@lib/util/medusa-error"

import type {
  B2BPurchaseRequest,
} from "@lib/api/types/b2b"

/**
 * Admin-side data fetching for B2B purchase request quote operations
 * These functions should only be called in server components or server actions
 * with proper admin authentication
 */

/**
 * List purchase requests awaiting merchant quotes
 */
export async function listB2BQuoteQueue(
  status?: string,
  skip?: number,
  take?: number
): Promise<{ purchase_requests: B2BPurchaseRequest[]; total: number }> {
  const params = new URLSearchParams()
  if (status) params.append("status", status)
  if (skip !== undefined) params.append("skip", skip.toString())
  if (take !== undefined) params.append("take", take.toString())

  return await sdk.client
    .fetch<{
      purchase_requests: B2BPurchaseRequest[]
      total: number
    }>(
      `/admin/b2b/purchase-requests${params.size > 0 ? `?${params}` : ""}`,
      {
        method: "GET",
      }
    )
    .catch(medusaError)
}

/**
 * Retrieve a single purchase request for merchant review
 */
export async function getB2BPurchaseRequestDetail(
  purchaseRequestId: string
): Promise<{ purchase_request: B2BPurchaseRequest }> {
  return await sdk.client
    .fetch<{ purchase_request: B2BPurchaseRequest }>(
      `/admin/b2b/purchase-requests/${purchaseRequestId}`,
      {
        method: "GET",
      }
    )
    .catch(medusaError)
}

/**
 * Send a quote offer to the buyer
 */
export async function sendB2BQuoteOffer(
  purchaseRequestId: string,
  payload: { note?: string } = {}
): Promise<{ purchase_request: B2BPurchaseRequest }> {
  return await sdk.client
    .fetch<{ purchase_request: B2BPurchaseRequest }>(
      `/admin/b2b/purchase-requests/${purchaseRequestId}/offer`,
      {
        method: "POST",
        body: payload,
      }
    )
    .catch(medusaError)
}

/**
 * Reject a purchase request
 */
export async function rejectB2BPurchaseRequest(
  purchaseRequestId: string,
  payload: { reason: string }
): Promise<{ purchase_request: B2BPurchaseRequest }> {
  return await sdk.client
    .fetch<{ purchase_request: B2BPurchaseRequest }>(
      `/admin/b2b/purchase-requests/${purchaseRequestId}/reject`,
      {
        method: "POST",
        body: payload,
      }
    )
    .catch(medusaError)
}
