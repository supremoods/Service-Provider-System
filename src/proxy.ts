import { NextResponse, type NextRequest } from "next/server"

const ACCESS_TOKEN_COOKIE_NAME =
  process.env.NEXT_PUBLIC_ACCESS_TOKEN_COOKIE_NAME || "access_token"

const AUTH_PAGES = new Set(["/login", "/signup"])
const PROTECTED_PREFIXES = ["/admin", "/customer"]
const ACCOUNT_TYPES = ["admin", "provider", "customer"] as const

type AccountType = (typeof ACCOUNT_TYPES)[number]

function isProtectedPath(pathname: string) {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}

function decodeTokenPayload(token: string) {
  const [, payload] = token.split(".")
  if (!payload) {
    return undefined
  }

  const normalized = payload.replace(/-/g, "+").replace(/_/g, "/")
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4))

  try {
    return JSON.parse(atob(`${normalized}${padding}`)) as Record<string, unknown>
  } catch {
    return undefined
  }
}

function getAccountTypeFromToken(token: string): AccountType | undefined {
  const payload = decodeTokenPayload(token)
  const accountType = payload?.account_type

  if (typeof accountType === "string" && ACCOUNT_TYPES.includes(accountType as AccountType)) {
    return accountType as AccountType
  }

  return undefined
}

function isTokenExpired(token: string) {
  const payload = decodeTokenPayload(token)
  const expiresAt = payload?.exp

  if (typeof expiresAt !== "number") {
    return false
  }

  return expiresAt * 1000 <= Date.now()
}

function getDesignatedModuleRoute(accountType?: AccountType) {
  if (accountType === "admin") {
    return "/admin/registrations"
  }

  return "/customer/providers"
}

function redirectTo(url: string, request: NextRequest) {
  return NextResponse.redirect(new URL(url, request.url))
}

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const token = request.cookies.get(ACCESS_TOKEN_COOKIE_NAME)?.value
  const hasValidToken = Boolean(token && !isTokenExpired(token))
  const accountType = token ? getAccountTypeFromToken(token) : undefined
  const designatedRoute = getDesignatedModuleRoute(accountType)

  if (isProtectedPath(pathname) && !hasValidToken) {
    return redirectTo("/login", request)
  }

  if (pathname.startsWith("/admin") && hasValidToken && accountType !== "admin") {
    return redirectTo(designatedRoute, request)
  }

  if (pathname.startsWith("/customer") && hasValidToken && accountType === "admin") {
    return redirectTo(designatedRoute, request)
  }

  if (AUTH_PAGES.has(pathname) && hasValidToken) {
    return redirectTo(designatedRoute, request)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*", "/customer/:path*", "/login", "/signup"],
}

