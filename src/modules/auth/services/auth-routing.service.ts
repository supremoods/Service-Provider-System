import type { AccountType } from "@/modules/accounts/models/account.model"

export function getDesignatedModuleRoute(accountType?: AccountType) {
  if (accountType === "admin") {
    return "/admin/registrations"
  }

  return "/customer/providers"
}
