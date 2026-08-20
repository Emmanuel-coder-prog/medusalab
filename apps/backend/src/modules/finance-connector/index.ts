import { Module } from "@medusajs/framework/utils"
import FinanceConnectorModuleService from "./service"

export const FINANCE_CONNECTOR_MODULE = "financeConnector"

export default Module(FINANCE_CONNECTOR_MODULE, {
  service: FinanceConnectorModuleService,
})
