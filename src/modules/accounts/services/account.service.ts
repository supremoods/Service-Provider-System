import { createApi, type FetchOptions } from "@/services/api.service"
import type { IBaseResponse } from "@/types/base-response"

const accountsApi = createApi()

export type ListUsersRequest = {
  paginate?: boolean
  limit?: number
  page?: number
  search?: string
}

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
