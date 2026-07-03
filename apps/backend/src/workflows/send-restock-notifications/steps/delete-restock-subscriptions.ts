import { InferTypeOf } from "@medusajs/framework/types"
import RestockSubscription from "../../../modules/restock/models/restock-subscription"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import RestockModuleService from "../../../modules/restock/service"
import { RESTOCK_MODULE } from "../../../modules/restock"

type DeleteRestockSubscriptionsStepInput = InferTypeOf<typeof RestockSubscription>[]

export const deleteRestockSubscriptionStep = createStep(
  "delete-restock-subscription",
  async (restockSubscriptions: DeleteRestockSubscriptionsStepInput, { container }) => {
    const restockModuleService: RestockModuleService = container.resolve(RESTOCK_MODULE)

    console.log(
      `[delete-restock-subscriptions] Deleting ${restockSubscriptions.length} subscription(s)`
    )

    await restockModuleService.deleteRestockSubscriptions(
      restockSubscriptions.map((subscription) => subscription.id)
    )

    console.log(
      `[delete-restock-subscriptions] Deleted ${restockSubscriptions.length} subscription(s)`
    )
    
    return new StepResponse(undefined, restockSubscriptions)
  },
  async (restockSubscriptions, { container }) => {
    if (!restockSubscriptions) {
      return
    }
    
    const restockModuleService: RestockModuleService = container.resolve(RESTOCK_MODULE)

    await restockModuleService.createRestockSubscriptions(restockSubscriptions)
  }
)