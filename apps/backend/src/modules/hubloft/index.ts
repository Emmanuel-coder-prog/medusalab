import { Module } from "@medusajs/framework/utils"
import HubLoftModuleService from "./service"

export const HUBLOFT_MODULE = "hubloft"

export default Module(HUBLOFT_MODULE, {
  service: HubLoftModuleService,
})
