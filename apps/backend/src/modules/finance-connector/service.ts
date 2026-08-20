import { MedusaService } from "@medusajs/framework/utils"
import { FinanceSyncOutbox } from "./models/finance-sync-outbox"
import { FinanceEventReceipt } from "./models/finance-event-receipt"

class FinanceConnectorModuleService extends MedusaService({
  FinanceSyncOutbox,
  FinanceEventReceipt,
}) {}

export default FinanceConnectorModuleService
