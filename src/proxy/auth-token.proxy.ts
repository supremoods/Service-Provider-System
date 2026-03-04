export const ACCESS_TOKEN_COOKIE_NAME = process.env.NEXT_PUBLIC_ACCESS_TOKEN_COOKIE_NAME || "access_token"
export const REFRESH_TOKEN_COOKIE_NAME = process.env.NEXT_PUBLIC_REFRESH_TOKEN_COOKIE_NAME || "refresh_token"
export const CSRF_TOKEN_COOKIE_NAME = process.env.NEXT_PUBLIC_CSRF_TOKEN_COOKIE_NAME || "csrf_token"
const DEFAULT_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7
const ACCOUNT_TYPES = ["admin", "provider", "customer"] as const

type AccountType = (typeof ACCOUNT_TYPES)[number]
type AnyRecord = Record<string, unknown>
type CookieSameSite = "strict" | "lax" | "none"

export type AuthTokenIdentity = {
  id?: string
  username?: string
  email?: string
  first_name?: string
  last_name?: string
  account_type?: AccountType
}

type CookieWriteOptions = {
  maxAgeSeconds?: number
  sameSite?: CookieSameSite
  secure?: boolean
}

function getCookieValue(cookieName: string) {
  if (typeof document === "undefined") {
    return undefined
  }

  const cookies = document.cookie.split(";").map((item) => item.trim())
  const tokenCookie = cookies.find((item) => item.startsWith(`${cookieName}=`))

  if (!tokenCookie) {
    return undefined
  }

  return decodeURIComponent(tokenCookie.split("=").slice(1).join("="))
}

export function getBearerTokenFromCookies(
  cookieName: string = ACCESS_TOKEN_COOKIE_NAME
) {
  return getCookieValue(cookieName)
}

export function getRefreshTokenFromCookies(
  cookieName: string = REFRESH_TOKEN_COOKIE_NAME
) {
  return getCookieValue(cookieName)
}

function setCookieValue(
  cookieName: string,
  value: string,
  {
    maxAgeSeconds = DEFAULT_COOKIE_MAX_AGE_SECONDS,
    sameSite = "strict",
    secure,
  }: CookieWriteOptions = {}
) {
  if (typeof document === "undefined") {
    return
  }

  const shouldUseSecureCookie =
    secure ??
    (typeof window !== "undefined" && window.location.protocol === "https:")
  const secureFlag = shouldUseSecureCookie ? "; secure" : ""

  document.cookie = `${cookieName}=${encodeURIComponent(
    value
  )}; path=/; max-age=${maxAgeSeconds}; samesite=${sameSite}${secureFlag}`
}

export function setBearerTokenCookie(
  token: string,
  cookieName: string = ACCESS_TOKEN_COOKIE_NAME,
  maxAgeSeconds: number = DEFAULT_COOKIE_MAX_AGE_SECONDS
) {
  setCookieValue(cookieName, token, {
    maxAgeSeconds,
    sameSite: "strict",
  })
}

export function setRefreshTokenCookie(
  token: string,
  cookieName: string = REFRESH_TOKEN_COOKIE_NAME,
  maxAgeSeconds: number = DEFAULT_COOKIE_MAX_AGE_SECONDS
) {
  setCookieValue(cookieName, token, {
    maxAgeSeconds,
    sameSite: "strict",
  })
}

function clearCookie(cookieName: string) {
  if (typeof document === "undefined") {
    return
  }

  const secure =
    typeof window !== "undefined" && window.location.protocol === "https:"
      ? "; secure"
      : ""

  document.cookie = `${cookieName}=; path=/; max-age=0; samesite=strict${secure}`
}

export function clearBearerTokenCookie(
  cookieName: string = ACCESS_TOKEN_COOKIE_NAME
) {
  clearCookie(cookieName)
}

export function clearRefreshTokenCookie(
  cookieName: string = REFRESH_TOKEN_COOKIE_NAME
) {
  clearCookie(cookieName)
}

export function getCsrfTokenFromCookies(
  cookieName: string = CSRF_TOKEN_COOKIE_NAME
) {
  return getCookieValue(cookieName)
}

function generateCsrfToken() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID().replace(/-/g, "")
  }

  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const bytes = new Uint8Array(32)
    crypto.getRandomValues(bytes)
    return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("")
  }

  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`
}

export function setCsrfTokenCookie(
  token: string,
  cookieName: string = CSRF_TOKEN_COOKIE_NAME,
  maxAgeSeconds: number = DEFAULT_COOKIE_MAX_AGE_SECONDS
) {
  setCookieValue(cookieName, token, {
    maxAgeSeconds,
    sameSite: "strict",
  })
}

export function ensureCsrfTokenCookie(
  cookieName: string = CSRF_TOKEN_COOKIE_NAME
) {
  const existing = getCsrfTokenFromCookies(cookieName)

  if (existing) {
    return existing
  }

  const token = generateCsrfToken()
  setCsrfTokenCookie(token, cookieName)
  return token
}

export function clearCsrfTokenCookie(
  cookieName: string = CSRF_TOKEN_COOKIE_NAME
) {
  clearCookie(cookieName)
}

export function clearAuthCookies() {
  clearBearerTokenCookie()
  clearRefreshTokenCookie()
  clearCsrfTokenCookie()
}

function decodeBase64Url(value: string) {
  if (typeof window === "undefined") {
    return undefined
  }

  const normalized = value.replace(/-/g, "+").replace(/_/g, "/")
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4))

  try {
    return atob(`${normalized}${padding}`)
  } catch {
    return undefined
  }
}

function isAccountType(value: unknown): value is AccountType {
  return typeof value === "string" && ACCOUNT_TYPES.includes(value as AccountType)
}

function isRecord(value: unknown): value is AnyRecord {
  return typeof value === "object" && value !== null
}

function parseAccessTokenPayload(token?: string) {
  const accessToken = token ?? getBearerTokenFromCookies()

  if (!accessToken) {
    return undefined
  }

  const [, payload] = accessToken.split(".")
  if (!payload) {
    return undefined
  }

  const decodedPayload = decodeBase64Url(payload)
  if (!decodedPayload) {
    return undefined
  }

  try {
    const parsed = JSON.parse(decodedPayload)
    return isRecord(parsed) ? parsed : undefined
  } catch {
    return undefined
  }
}

export function getAuthIdentityFromAccessToken(token?: string): AuthTokenIdentity | undefined {
  const payload = parseAccessTokenPayload(token)

  if (!payload) {
    return undefined
  }

  const accountType = isAccountType(payload.account_type)
    ? payload.account_type
    : undefined

  return {
    id: typeof payload.id === "string" ? payload.id : undefined,
    username: typeof payload.username === "string" ? payload.username : undefined,
    email: typeof payload.email === "string" ? payload.email : undefined,
    first_name:
      typeof payload.first_name === "string" ? payload.first_name : undefined,
    last_name: typeof payload.last_name === "string" ? payload.last_name : undefined,
    account_type: accountType,
  }
}

export function getAccountTypeFromAccessToken(token?: string): AccountType | undefined {
  return getAuthIdentityFromAccessToken(token)?.account_type
}

export function withAuthHeader(
  headers?: HeadersInit,
  accessToken?: string
): Headers {
  const merged = new Headers(headers)

  if (!merged.has("Content-Type")) {
    merged.set("Content-Type", "application/json")
  }

  if (accessToken && !merged.has("Authorization")) {
    merged.set("Authorization", `Bearer ${accessToken}`)
  }

  return merged
}
