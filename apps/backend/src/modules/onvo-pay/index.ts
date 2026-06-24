import { ModuleProvider, Modules } from "@medusajs/framework/utils"
import OnvoPayPatchedService from "./service"

export default ModuleProvider(Modules.PAYMENT, {
  services: [OnvoPayPatchedService],
})
