export type AccountType = "admin" | "provider" | "customer"

export type AccountStatus = "pending" | "approved" | "rejected"

export interface AccountModel {
  id: string
  username: string
  first_name: string
  last_name: string
  email: string
  mobile_number: string
  password_hash: string
  role_type: string
  account_type: AccountType
  status: AccountStatus
  created_at: Date
  last_login?: Date
}
