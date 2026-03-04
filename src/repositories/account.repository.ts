import { listUsers, type ListUsersRequest } from "@/modules/accounts/services/account.service"
import type {
  AccountModel,
  AccountStatus,
  AccountType,
} from "@/modules/accounts/models/account.model"
import type { IBaseResponse } from "@/types/base-response"

type AnyRecord = Record<string, unknown>
export type SearchMode = "exact" | "like"

const ACCOUNT_TYPES: AccountType[] = ["admin", "provider", "customer"]
const ACCOUNT_STATUSES: AccountStatus[] = ["pending", "approved", "rejected"]

export type UsersPagination = {
  page: number
  limit: number
  total: number
  totalPages: number
  hasPrevious: boolean
  hasNext: boolean
}

export type AccountsListResult = {
  items: AccountModel[]
  pagination: UsersPagination
}

export type SearchableUserField =
  | "id"
  | "first_name"
  | "last_name"
  | "email"
  | "mobile_number"
  | "role_type"
  | "account_type"
  | "status"

export type GetAccountsRequest = ListUsersRequest
export type UserSearchCondition = {
  fieldName: SearchableUserField
  value: string
  mode?: SearchMode
}

function isRecord(value: unknown): value is AnyRecord {
  return typeof value === "object" && value !== null
}

function getPrimaryPayload<T>(response: IBaseResponse<T>) {
  return response.response ?? response.data ?? response
}

function parseNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : undefined
  }

  return undefined
}

function parseDate(value: unknown) {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value
  }

  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? undefined : parsed
  }

  return undefined
}

function extractArray(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value
  }

  if (!isRecord(value)) {
    return []
  }

  const listKeys = ["items", "rows", "records", "users", "data"]
  for (const key of listKeys) {
    const candidate = value[key]
    if (Array.isArray(candidate)) {
      return candidate
    }
  }

  return []
}

function normalizeAccountType(value: unknown): AccountType {
  if (typeof value === "string" && ACCOUNT_TYPES.includes(value as AccountType)) {
    return value as AccountType
  }

  return "customer"
}

function normalizeAccountStatus(value: unknown): AccountStatus {
  if (
    typeof value === "string" &&
    ACCOUNT_STATUSES.includes(value as AccountStatus)
  ) {
    return value as AccountStatus
  }

  return "pending"
}

function parseAccountModel(value: unknown): AccountModel | undefined {
  if (!isRecord(value)) {
    return undefined
  }

  const createdAt = parseDate(value.created_at) ?? new Date(0)
  const lastLogin = parseDate(value.last_login)

  return {
    id: typeof value.id === "string" ? value.id : "",
    first_name: typeof value.first_name === "string" ? value.first_name : "",
    last_name: typeof value.last_name === "string" ? value.last_name : "",
    email: typeof value.email === "string" ? value.email : "",
    mobile_number:
      typeof value.mobile_number === "string" ? value.mobile_number : "",
    password_hash:
      typeof value.password_hash === "string" ? value.password_hash : "",
    role_type: typeof value.role_type === "string" ? value.role_type : "",
    account_type: normalizeAccountType(value.account_type),
    status: normalizeAccountStatus(value.status),
    created_at: createdAt,
    last_login: lastLogin,
  }
}

function parsePagination(
  payload: unknown,
  defaults: { page: number; limit: number; itemCount: number }
): UsersPagination {
  const payloadRecord = isRecord(payload) ? payload : undefined
  const meta =
    (isRecord(payloadRecord?.pagination) ? payloadRecord?.pagination : undefined) ??
    (isRecord(payloadRecord?.meta) ? payloadRecord?.meta : undefined)

  const page = parseNumber(meta?.page ?? payloadRecord?.page) ?? defaults.page
  const limit =
    parseNumber(meta?.limit ?? payloadRecord?.limit) ?? defaults.limit
  const total =
    parseNumber(meta?.total ?? payloadRecord?.total ?? payloadRecord?.count) ??
    defaults.itemCount
  const totalPages =
    parseNumber(
      meta?.totalPages ??
        meta?.total_pages ??
        payloadRecord?.totalPages ??
        payloadRecord?.total_pages
    ) ?? Math.max(1, Math.ceil(total / Math.max(limit, 1)))

  return {
    page,
    limit,
    total,
    totalPages,
    hasPrevious: page > 1,
    hasNext: page < totalPages,
  }
}

function parseAccountsResponse(
  response: IBaseResponse<unknown>,
  fallback: { page: number; limit: number }
): AccountsListResult {
  const payload = getPrimaryPayload(response)
  const items = extractArray(payload)
    .map((item) => parseAccountModel(item))
    .filter((item): item is AccountModel => Boolean(item))

  const pagination = parsePagination(payload, {
    page: fallback.page,
    limit: fallback.limit,
    itemCount: items.length,
  })

  return {
    items,
    pagination,
  }
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

export function buildUserSearch(
  fieldName: SearchableUserField,
  value: string,
  mode: SearchMode = "like"
) {
  const trimmed = value.trim()

  if (!trimmed) {
    return undefined
  }

  if (mode === "exact") {
    return `${fieldName}:${trimmed}`
  }

  return `${fieldName}:.*${escapeRegex(trimmed)}.*`
}

function joinSearchParts(
  parts: Array<string | undefined>,
  operator: "|" | ","
) {
  const normalized = parts
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))

  if (normalized.length === 0) {
    return undefined
  }

  return normalized.join(operator)
}

export function combineSearchWithOr(...parts: Array<string | undefined>) {
  return joinSearchParts(parts, "|")
}

export function combineSearchWithAnd(...parts: Array<string | undefined>) {
  return joinSearchParts(parts, ",")
}

export function buildUserSearchOr(conditions: UserSearchCondition[]) {
  return combineSearchWithOr(
    ...conditions.map((condition) =>
      buildUserSearch(
        condition.fieldName,
        condition.value,
        condition.mode ?? "exact"
      )
    )
  )
}

export function buildUserSearchAnd(conditions: UserSearchCondition[]) {
  return combineSearchWithAnd(
    ...conditions.map((condition) =>
      buildUserSearch(
        condition.fieldName,
        condition.value,
        condition.mode ?? "exact"
      )
    )
  )
}

export async function getAccounts(
  request: GetAccountsRequest = {}
): Promise<AccountsListResult> {
  const page = request.page ?? 1
  const limit = request.limit ?? 10

  const response = await listUsers({
    ...request,
    page,
    limit,
  })

  return parseAccountsResponse(response, { page, limit })
}

export async function getRegisteredProviders(
  request: GetAccountsRequest = {}
): Promise<AccountsListResult> {
  const providerOnlyQuery = buildUserSearchAnd([
    { fieldName: "account_type", value: "provider", mode: "exact" },
    { fieldName: "status", value: "approved", mode: "exact" },
  ])

  const result = await getAccounts({
    ...request,
    search: combineSearchWithAnd(providerOnlyQuery, request.search),
  })

  return {
    ...result,
    items: result.items.filter(
      (account) =>
        account.account_type === "provider" && account.status === "approved"
    ),
  }
}
