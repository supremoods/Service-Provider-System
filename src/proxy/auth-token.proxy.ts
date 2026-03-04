export const ACCESS_TOKEN_COOKIE_NAME =
  process.env.NEXT_PUBLIC_ACCESS_TOKEN_COOKIE_NAME || "access_token"

export function getBearerTokenFromCookies(
  cookieName: string = ACCESS_TOKEN_COOKIE_NAME
) {
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
