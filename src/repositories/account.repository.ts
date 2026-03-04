import type { AccountModel } from "@/modules/accounts/models/account.model"

const accountSeed: AccountModel[] = [
  {
    id: "usr_001",
    first_name: "Maria",
    last_name: "Santos",
    email: "maria.santos@example.com",
    mobile_number: "+639171112233",
    password_hash: "scrypt:0f2e4b...",
    role_type: "super_admin",
    account_type: "admin",
    status: "approved",
    created_at: new Date("2026-02-12T08:30:00Z"),
    last_login: new Date("2026-03-03T10:20:00Z"),
  },
  {
    id: "usr_002",
    first_name: "Carlo",
    last_name: "Reyes",
    email: "carlo.reyes@example.com",
    mobile_number: "09171234567",
    password_hash: "scrypt:9324aa...",
    role_type: "electrician",
    account_type: "provider",
    status: "approved",
    created_at: new Date("2026-03-01T04:15:00Z"),
    last_login: new Date("2026-03-03T10:10:00Z"),
  },
  {
    id: "usr_003",
    first_name: "Aimee",
    last_name: "Delos Reyes",
    email: "aimee.reyes@example.com",
    mobile_number: "+639221234567",
    password_hash: "scrypt:a1b9cf...",
    role_type: "home_owner",
    account_type: "customer",
    status: "approved",
    created_at: new Date("2026-03-01T13:00:00Z"),
    last_login: new Date("2026-03-03T09:05:00Z"),
  },
  {
    id: "usr_004",
    first_name: "Niko",
    last_name: "Fernandez",
    email: "niko.fernandez@example.com",
    mobile_number: "09984561234",
    password_hash: "scrypt:77d8b2...",
    role_type: "plumber",
    account_type: "provider",
    status: "rejected",
    created_at: new Date("2026-02-27T06:45:00Z"),
  },
  {
    id: "usr_006",
    first_name: "Jessa",
    last_name: "Dela Cruz",
    email: "jessa.delacruz@example.com",
    mobile_number: "+639221113334",
    password_hash: "scrypt:ff1292...",
    role_type: "aircon_technician",
    account_type: "provider",
    status: "approved",
    created_at: new Date("2026-02-21T02:30:00Z"),
  },
  {
    id: "usr_008",
    first_name: "Miguel",
    last_name: "Tan",
    email: "miguel.tan@example.com",
    mobile_number: "+639181112222",
    password_hash: "scrypt:19a8c3...",
    role_type: "carpenter",
    account_type: "provider",
    status: "pending",
    created_at: new Date("2026-03-03T05:55:00Z"),
  },
]

export function getAccounts() {
  return structuredClone(accountSeed)
}

export function getRegisteredProviders() {
  return getAccounts().filter(
    (account) =>
      account.account_type === "provider" && account.status === "approved"
  )
}
