import { createApi, type FetchOptions } from "@/services/api.service"
import type { IBaseResponse } from "@/types/base-response"

const accountsApi = createApi()

export type ListUsersRequest = {
  paginate?: boolean
  limit?: number
  page?: number
  search?: string
}

export type UpdateUserRequest = Partial<{
  username: string
  first_name: string
  last_name: string
  email: string
  mobile_number: string
  password_hash: string
  role_type: string
  account_type: "admin" | "provider" | "customer"
  status: "pending" | "approved" | "rejected"
}>

function buildListUsersParams(payload: ListUsersRequest) {
  const params: NonNullable<FetchOptions["params"]> = {}

  if (typeof payload.paginate === "boolean") {
    params.paginate = payload.paginate
  }

  if (typeof payload.limit === "number") {
    params.limit = payload.limit
  }

  if (typeof payload.page === "number") {
    params.page = payload.page
  }

  if (payload.search) {
    params.search = payload.search
  }

  return params
}

export async function listUsers(payload: ListUsersRequest = {}) {
  const params = buildListUsersParams(payload)

  return accountsApi.get<unknown>("/users", {
    params: Object.keys(params).length > 0 ? params : undefined,
  }) as Promise<IBaseResponse<unknown>>
}

export async function updateUser(id: string, payload: UpdateUserRequest) {
  return accountsApi.put<unknown>("/users", id, payload) as Promise<
    IBaseResponse<unknown>
  >
}
