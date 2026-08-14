import {
  createStep,
  createWorkflow,
  StepResponse,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"

import {
  acquireLockStep,
  beginOrderEditOrderWorkflow,
  completeCartWorkflow,
  createOrderWorkflow,
  releaseLockStep,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows"

import { MedusaError, Modules } from "@medusajs/framework/utils"

import { B2B_ORGANIZATION_MODULE } from "../../modules/b2b-organization"
import B2BOrganizationModuleService from "../../modules/b2b-organization/service"
import {
  B2BOrganizationMemberStatus,
  B2BOrganizationStatus,
} from "../../modules/b2b-organization/types"
import { B2B_PURCHASE_MODULE } from "../../modules/b2b-purchase"
import B2BPurchaseModuleService from "../../modules/b2b-purchase/service"
import {
  B2BPurchaseRequestStatus,
} from "../../modules/b2b-purchase/types"
import { isAtOrAbove } from "../../modules/b2b-purchase/money"

type SubmitPurchaseRequestInput = {
  cart_id: string
  customer_id: string
  organization_id: string
  member_id: string
}

type PreparePurchaseRequestOutput = {
  cart: any
  organization: any
  member: any
  cart_context: any
  request_total: string
  currency_code: string
  policy_snapshot: Record<string, any>
  cart_snapshot: Record<string, any>
  draft_order_id?: string
  order_change_id?: string
}

const preparePurchaseRequestStep = createStep(
  "prepare-b2b-purchase-request",
  async (input: SubmitPurchaseRequestInput, { container }) => {
    const cartModuleService = container.resolve(Modules.CART)
    const b2bOrganizationService =
      container.resolve<B2BOrganizationModuleService>(
        B2B_ORGANIZATION_MODULE
      )

    const cart = await cartModuleService.retrieveCart(input.cart_id)

    if (cart.customer_id !== input.customer_id) {
      throw new MedusaError(
        MedusaError.Types.UNAUTHORIZED,
        "This cart does not belong to the authenticated customer."
      )
    }

    const organizations = await b2bOrganizationService.listB2BOrganizations({
      id: input.organization_id,
      status: B2BOrganizationStatus.ACTIVE,
    })

    const organization = organizations[0]

    if (!organization) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        "Active B2B organization was not found."
      )
    }

    const members = await b2bOrganizationService.listB2BOrganizationMembers({
      id: input.member_id,
      organization_id: input.organization_id,
      customer_id: input.customer_id,
      status: B2BOrganizationMemberStatus.ACTIVE,
    })

    const member = members[0]

    if (!member) {
      throw new MedusaError(
        MedusaError.Types.UNAUTHORIZED,
        "You are not an active member of this organization."
      )
    }

    const contexts = await b2bOrganizationService.listB2BCartContexts({
      cart_id: cart.id,
    })

    const cartContext = contexts[0]

    if (!cartContext || cartContext.organization_id !== organization.id) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "This cart is not associated with the selected organization."
      )
    }

    const currencyCode = cart.region?.currency_code ?? cart.currency_code

    if (!currencyCode) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Cart currency could not be resolved."
      )
    }

    const requestTotal = cart.items.reduce((sum: any, item: any) => {
      const unitPrice = item.unit_price ?? item.original_total ?? 0
      return sum.plus(unitPrice * item.quantity)
    }, 0)

    const policySnapshot = {
      approval_threshold: organization.approval_threshold ?? null,
      approval_currency_code: organization.approval_currency_code ?? currencyCode,
      requires_merchant_quote: organization.requires_merchant_quote ?? false,
      quote_validity_days: organization.quote_validity_days ?? 7,
      approval_policy_version: organization.approval_policy_version ?? 1,
    }

    const cartSnapshot = {
      id: cart.id,
      region_id: cart.region_id,
      sales_channel_id: cart.sales_channel_id,
      currency_code: currencyCode,
      items: cart.items,
      total: cart.total,
      subtotal: cart.subtotal,
    }

    const threshold = organization.approval_threshold

    const policyRequiresGovernance =
      !!threshold &&
      isAtOrAbove(requestTotal.toString(), threshold.toString())

    const requiresMerchantQuote = organization.requires_merchant_quote === true

    const shouldGovern = policyRequiresGovernance || requiresMerchantQuote

    if (!shouldGovern) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "This cart does not require a purchase request."
      )
    }

    const result: PreparePurchaseRequestOutput = {
      cart,
      organization,
      member,
      cart_context: cartContext,
      request_total: requestTotal.toString(),
      currency_code: currencyCode,
      policy_snapshot: policySnapshot,
      cart_snapshot: cartSnapshot,
    }

    return new StepResponse(result)
  }
)

const createPurchaseRequestStep = createStep(
  "create-b2b-purchase-request",
  async (
    input: PreparePurchaseRequestOutput,
    { container }
  ) => {
    const purchaseService =
      container.resolve<B2BPurchaseModuleService>(B2B_PURCHASE_MODULE)

    const reference = `B2B-${Date.now()}`

    const created = await purchaseService.createB2BPurchaseRequests({
      reference,
      organization_id: input.organization.id,
      requester_member_id: input.member.id,
      customer_id: input.cart.customer_id,
      cart_id: input.cart.id,
      draft_order_id: input.draft_order_id ?? null,
      order_change_id: input.order_change_id ?? null,
      status: B2BPurchaseRequestStatus.PENDING_INTERNAL_APPROVAL,
      currency_code: input.currency_code,
      requested_total: input.request_total,
      cart_snapshot: input.cart_snapshot,
      policy_snapshot: input.policy_snapshot,
      submitted_at: new Date(),
      expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    })

    return new StepResponse(created)
  }
)

export const submitPurchaseRequestWorkflow = createWorkflow(
  "submit-b2b-purchase-request",
  (input: SubmitPurchaseRequestInput) => {
    acquireLockStep({
      key: input.cart_id,
      timeout: 30,
      ttl: 120,
    })

    const prepared = preparePurchaseRequestStep(input)

    const { data: cartData } = useQueryGraphStep({
      entity: "cart",
      fields: ["id", "customer_id", "region_id", "sales_channel_id", "currency_code", "items.*"],
      filters: { id: input.cart_id },
      options: { throwIfKeyNotFound: true },
    }).config({ name: "retrieve-cart-for-purchase-request" })

    const createOrderInput = transform(
      { cartData, prepared, input },
      ({ cartData, prepared, input }) => {
        const cart = cartData[0]
        const items = (cart && cart.items) ? cart.items.map((item: any) => ({
          variant_id: item.variant_id,
          quantity: item.quantity,
          title: item.title,
          unit_price: item.unit_price,
          metadata: item.metadata,
        })) : []

        const preparedData = prepared.data

        return {
          email: "",
          region_id: cart?.region_id ?? preparedData?.cart?.region_id,
          items,
          sales_channel_id: cart?.sales_channel_id ?? preparedData?.cart?.sales_channel_id,
          customer_id: input.customer_id,
          currency_code: preparedData.currency_code,
        }
      }
    )

    const { data: draftOrder } = createOrderWorkflow.runAsStep({
      input: createOrderInput,
    })

    const { data: orderChange } = beginOrderEditOrderWorkflow.runAsStep({
      input: {
        order_id: draftOrder.id,
        created_by: input.customer_id,
        description: "B2B purchase request submission",
      },
    })

    const requestInput = transform({ prepared, draftOrder, orderChange }, ({ prepared, draftOrder, orderChange }) => {
      const p = prepared.data
      return {
        cart: p.cart,
        organization: p.organization,
        member: p.member,
        cart_context: p.cart_context,
        request_total: p.request_total,
        currency_code: p.currency_code,
        policy_snapshot: p.policy_snapshot,
        cart_snapshot: p.cart_snapshot,
        draft_order_id: draftOrder.id,
        order_change_id: orderChange.id,
      }
    })

    const request = createPurchaseRequestStep(requestInput)

    releaseLockStep({ key: input.cart_id })

    return new WorkflowResponse({
      purchase_request: request,
      draft_order: draftOrder,
    })
  }
)
