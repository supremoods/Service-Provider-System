import {
  ensureCsrfTokenCookie,
  getBearerTokenFromCookies,
  getCsrfTokenFromCookies,
  getRefreshTokenFromCookies,
  setBearerTokenCookie,
  setRefreshTokenCookie,
  withAuthHeader,
} from "@/proxy/auth-token.proxy"
import type { IBaseResponse } from "@/types/base-response"

export const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/sps/v1/"
const REFRESH_ENDPOINT = "refresh"

type AnyRecord = Record<string, unknown>

export interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean>
  timeout?: number
  token?: string
}

function isRecord(value: unknown): value is AnyRecord {
  return typeof value === "object" && value !== null
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
      const found = findStringByKeys(nested, keys, depth + 1)
      if (found) {
        return found
      }
    }
  }

  return undefined
}

function getPrimaryPayload<T>(response: IBaseResponse<T>) {
  return response.response ?? response.data ?? response
}

function extractAuthTokens(response: IBaseResponse<unknown>) {
  const payload = getPrimaryPayload(response)
  const tokenKeys = ["access_token", "accessToken", "token", "jwt"] as const
  const refreshTokenKeys = ["refreshToken", "refresh_token"] as const
  const token =
    findStringByKeys(payload, tokenKeys) ?? findStringByKeys(response, tokenKeys)
  const refreshToken =
    findStringByKeys(payload, refreshTokenKeys) ??
    findStringByKeys(response, refreshTokenKeys)

  if (!token) {
    return undefined
  }

  return {
    token,
    refreshToken,
  }
}

function normalizeEndpointPath(endpoint: string) {
  return endpoint.split("?")[0].replace(/^\/+/, "")
}

function extractApiErrorMessage(response: Response, errorText: string) {
  const trimmed = errorText.trim()

  if (trimmed) {
    try {
      const parsed = JSON.parse(trimmed)
      const message = findStringByKeys(parsed, [
        "errorMessage",
        "message",
        "error_description",
        "detail",
        "title",
      ])

      if (message) {
        return message
      }
    } catch {
      // Keep fallback path for non-JSON responses.
    }

    // If backend returned plain text, surface it directly.
    const looksLikeJson = trimmed.startsWith("{") || trimmed.startsWith("[")
    const looksLikeHtml = trimmed.startsWith("<")
    if (!looksLikeJson && !looksLikeHtml) {
      return trimmed
    }
  }

  if (response.statusText) {
    return response.statusText
  }

  return `Request failed with status ${response.status}`
}

function isSafeMethod(method: string) {
  return method === "GET" || method === "HEAD" || method === "OPTIONS" || method === "TRACE"
}

function withCsrfHeader(headers: Headers, method: string) {
  if (isSafeMethod(method)) {
    return headers
  }

  const csrfToken = getCsrfTokenFromCookies() ?? ensureCsrfTokenCookie()
  if (csrfToken && !headers.has("X-CSRF-Token")) {
    headers.set("X-CSRF-Token", csrfToken)
  }

  return headers
}

/**
 * Creates an API object that reads bearer token from cookies.
 */
export function createApi() {
  const normalizedBaseUrl = BASE_URL.endsWith("/") ? BASE_URL : `${BASE_URL}/`

  async function refreshAccessToken(refreshToken: string, timeout: number) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeout)
    const refreshUrl = new URL(REFRESH_ENDPOINT, normalizedBaseUrl)

    try {
      const requestMethod = "POST"
      const refreshResponse = await fetch(refreshUrl.toString(), {
        method: requestMethod,
        signal: controller.signal,
        headers: withCsrfHeader(withAuthHeader(), requestMethod),
        body: JSON.stringify({ refreshToken }),
        cache: "no-store",
      })

      if (!refreshResponse.ok) {
        return undefined
      }

      const refreshBody = (await refreshResponse.json()) as IBaseResponse<unknown>
      return extractAuthTokens(refreshBody)
    } catch (error: unknown) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("Request timed out")
      }

      return undefined
    } finally {
      clearTimeout(timer)
    }
  }

  async function request<T>(
    endpoint: string,
    { params, token, timeout = 15000, ...options }: FetchOptions = {},
    allowRefresh: boolean = true
  ): Promise<IBaseResponse<T>> {
    const normalizedEndpoint = endpoint.startsWith("/") ? endpoint.slice(1) : endpoint
    const endpointPath = normalizeEndpointPath(normalizedEndpoint)
    const url = new URL(normalizedEndpoint, normalizedBaseUrl)

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value))
      })
    }

    const accessToken = token || getBearerTokenFromCookies()
    const requestMethod = (options.method ?? "GET").toUpperCase()
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url.toString(), {
        ...options,
        signal: controller.signal,
        headers: withCsrfHeader(
          withAuthHeader(options.headers, accessToken),
          requestMethod
        ),
        cache: options.cache ?? "no-store",
      })

      if (!response.ok) {
        if (
          response.status === 401 &&
          allowRefresh &&
          endpointPath !== REFRESH_ENDPOINT
        ) {
          const refreshToken = getRefreshTokenFromCookies()

          if (refreshToken) {
            const refreshedSession = await refreshAccessToken(refreshToken, timeout)

            if (refreshedSession?.token) {
              setBearerTokenCookie(refreshedSession.token)
              if (refreshedSession.refreshToken) {
                setRefreshTokenCookie(refreshedSession.refreshToken)
              }

              return request<T>(
                endpoint,
                {
                  ...options,
                  params,
                  timeout,
                  token: refreshedSession.token,
                },
                false
              )
            }
          }
        }

        const errorText = await response.text()
        throw new Error(extractApiErrorMessage(response, errorText))
      }

      return (await response.json()) as IBaseResponse<T>
    } catch (error: unknown) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("Request timed out")
      }

      throw error
    } finally {
      clearTimeout(timer)
    }
  }

  return {
    get: async <T>(endpoint: string, options?: FetchOptions) =>
      request<T>(endpoint, { ...options, method: "GET" }),

    getById: async <T>(endpoint: string, id: string, options?: FetchOptions) =>
      request<T>(`${endpoint}/${id}`, { ...options, method: "GET" }),

    post: async <T>(endpoint: string, body?: unknown, options?: FetchOptions) =>
      request<T>(endpoint, {
        ...options,
        method: "POST",
        body: body ? JSON.stringify(body) : undefined,
      }),

    put: async <T>(
      endpoint: string,
      id: string,
      body?: unknown,
      options?: FetchOptions
    ) =>
      request<T>(`${endpoint}/${id}`, {
        ...options,
        method: "PUT",
        body: body ? JSON.stringify(body) : undefined,
      }),

    delete: async <T>(endpoint: string, options?: FetchOptions) =>
      request<T>(endpoint, { ...options, method: "DELETE" }),
  }
}
