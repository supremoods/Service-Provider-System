import { createApi } from "@/services/api.service"
import type { IBaseResponse } from "@/types/base-response"

type AnyRecord = Record<string, unknown>
type AuthAccountType = "admin" | "provider" | "customer"

export type LoginRequest = {
  username: string
  password: string
}

export type RefreshRequest = {
  refreshToken: string
}

export type RegisterRequest = {
  first_name: string
  last_name: string
  username: string
  email: string
  mobile_number: string
  role_type: string
  password_hash: string
  account_type?: "admin" | "provider" | "customer"
}

export type AuthUser = {
  id: string
  username: string
  email: string
  account_type: AuthAccountType
}

export type AuthSession = {
  token: string
  refreshToken?: string
  data?: AuthUser
}

const authApi = createApi()

export async function login(payload: LoginRequest) {
  return authApi.post<AuthSession>("/auth/login", payload)
}

export async function refreshSession(payload: RefreshRequest) {
  return authApi.post<AuthSession>("/refresh", payload)
}

export async function register(payload: RegisterRequest) {
  return authApi.post<AuthSession | AnyRecord>("/auth/register", payload)
}

function isRecord(value: unknown): value is AnyRecord {
  return typeof value === "object" && value !== null
}

function parseAuthUser(value: unknown): AuthUser | undefined {
  if (!isRecord(value)) {
    return undefined
  }

  const { id, username, email, account_type } = value
  const validAccountTypes: AuthAccountType[] = ["admin", "provider", "customer"]

  if (
    typeof id !== "string" ||
    typeof username !== "string" ||
    typeof email !== "string" ||
    typeof account_type !== "string" ||
    !validAccountTypes.includes(account_type as AuthAccountType)
  ) {
    return undefined
  }

  return {
    id,
    username,
    email,
    account_type: account_type as AuthAccountType,
  }
}

function findStringByKeys(
  value: unknown,
  keys: readonly string[],
  depth: number = 0
): string | undefined {
  if (depth > 2 || !isRecord(value)) {
    return undefined
  }

  for (const key of keys) {
    const candidate = value[key]
    if (typeof candidate === "string" && candidate.length > 0) {
      return candidate
    }
  }

  for (const nested of Object.values(value)) {
    if (isRecord(nested)) {
      const token = findStringByKeys(nested, keys, depth + 1)
      if (token) {
        return token
      }
    }
  }

  return undefined
}

function getPrimaryPayload<T>(response: IBaseResponse<T>) {
  return response.response ?? response.data ?? response
}

function getUserPayload(value: unknown) {
  if (!isRecord(value)) {
    return undefined
  }

  return value.data ?? value.user
}

export function extractAuthSession(response: IBaseResponse<unknown>) {
  const payload = getPrimaryPayload(response)
  const tokenKeys = ["access_token", "accessToken", "token", "jwt"] as const
  const refreshTokenKeys = ["refreshToken", "refresh_token"] as const

  const token = findStringByKeys(payload, tokenKeys) ?? findStringByKeys(response, tokenKeys)

  if (!token) {
    return undefined
  }

  const refreshToken = findStringByKeys(payload, refreshTokenKeys) ?? findStringByKeys(response, refreshTokenKeys)
  const user = parseAuthUser(getUserPayload(payload))

  if (user) {
    return {
      token,
      refreshToken,
      data: user,
    }
  }

  return {
    token,
    refreshToken,
  }
}

export function extractSessionToken(response: IBaseResponse<unknown>) {
  return extractAuthSession(response)?.token
}
