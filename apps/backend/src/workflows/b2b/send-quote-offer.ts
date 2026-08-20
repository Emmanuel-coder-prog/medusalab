import { MedusaError } from "@medusajs/framework/utils"
import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"

import {
  acquireLockStep,
  releaseLockStep,
} from "@medusajs/medusa/core-flows"
import { transform } from "@medusajs/framework/workflows-sdk"

import B2BPurchaseModuleService from
  "../../modules/b2b-purchase/service"

import {
  B2BPurchaseRequestStatus,
} from "../../modules/b2b-purchase/types"

const B2B_PURCHASE_MODULE = "b2bPurchase"

type Input = {
  purchase_request_id: string
  admin_user_id: string
  note?: string
}

const sendB2BQuoteOfferStep = createStep(
  "send-b2b-quote-offer",
  async (input: Input, { container }) => {
    const purchaseService =
      container.resolve<B2BPurchaseModuleService>(
        B2B_PURCHASE_MODULE
      )

    const request =
      await purchaseService.retrieveB2BPurchaseRequest(
        input.purchase_request_id
      )

    if (!request) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        "Purchase request not found."
      )
    }

    if (
      request.status !==
      B2BPurchaseRequestStatus.PENDING_MERCHANT_QUOTE
    ) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "This purchase request is not awaiting a merchant quote."
      )
    }

    const now = new Date()

    // Update purchase request to indicate merchant has quoted
    // Status moves to PENDING_BUYER_ACCEPTANCE (buyer must accept/reject the draft order changes)
    const updated =
      await purchaseService.updateB2BPurchaseRequests({
        id: request.id,
        status: B2BPurchaseRequestStatus.PENDING_BUYER_ACCEPTANCE,
        quoted_at: now,
      })

    return new StepResponse(updated)
  }
)

/**
 * Workflow for merchant sending a quote offer
 *
 * This moves the purchase request from PENDING_MERCHANT_QUOTE to PENDING_BUYER_ACCEPTANCE.
 * The merchant has already edited the draft order using Medusa's native mechanisms.
 * This workflow just updates the status to indicate the offer has been sent.
 *
 * The buyer then sees the updated draft order and can accept or reject the offer.
 */
export const sendB2BQuoteOfferWorkflow =
  createWorkflow(
    "send-b2b-quote-offer",
    (input: Input) => {
      const lockKey = transform(
        { input },
        ({ input }) => `b2b-purchase-request:${input.purchase_request_id}`
      )

      acquireLockStep({
        key: lockKey,
        timeout: 10,
        ttl: 60,
      })

      const request =
        (sendB2BQuoteOfferStep as any)(input)

      releaseLockStep({
        key: lockKey,
      })

      return new WorkflowResponse({
        purchase_request: request,
      })
    }
  )
