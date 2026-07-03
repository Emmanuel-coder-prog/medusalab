"use client"

import { useMutation } from "@tanstack/react-query"
import { createRestockSubscription } from "@lib/restock/client"
import type {
  CreateRestockSubscriptionRequest,
  CreateRestockSubscriptionResponse,
} from "@lib/restock/types"

export function useSubscribeToRestock() {
  return useMutation<
    CreateRestockSubscriptionResponse,
    Error,
    CreateRestockSubscriptionRequest
  >({
    mutationFn: (payload) => createRestockSubscription(payload),
  })
}
