import { sdk } from "@lib/config"
import medusaError from "@lib/util/medusa-error"
import type {
  CreateRestockSubscriptionRequest,
  CreateRestockSubscriptionResponse,
  RestockSubscriptionClientHeaders,
} from "./types"

export async function createRestockSubscription(
  payload: CreateRestockSubscriptionRequest,
  headers: RestockSubscriptionClientHeaders = {}
): Promise<CreateRestockSubscriptionResponse> {
  try {
    // Use Medusa SDK client so requests honor the configured `baseUrl`, publishable key
    // and any middleware (like locale headers) applied in `sdk.client.fetch`.
    const res = await sdk.client.fetch<CreateRestockSubscriptionResponse>(
      "/store/restock-subscriptions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: payload,
        credentials: "include",
      }
    )

    return res
  } catch (error) {
    medusaError(error)
  }
}
