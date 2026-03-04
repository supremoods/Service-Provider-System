import { getBearerTokenFromCookies, withAuthHeader } from "@/proxy/auth-token.proxy"
import type { IBaseResponse } from "@/types/base-response"

export const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"
export const API_VERSION = process.env.NEXT_PUBLIC_API_VERSION || "dev"

export interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean>
  timeout?: number
  token?: string
}

/**
 * Creates an API object that reads bearer token from cookies.
 */
export function createApi() {
  async function request<T>(
    endpoint: string,
    { params, token, timeout = 15000, ...options }: FetchOptions = {}
  ): Promise<IBaseResponse<T>> {
    const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`
    const url = new URL(`mindsuite/${API_VERSION}${normalizedEndpoint}`, BASE_URL)

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value))
      })
    }

    const accessToken = token || getBearerTokenFromCookies()
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url.toString(), {
        ...options,
        signal: controller.signal,
        headers: withAuthHeader(options.headers, accessToken),
        cache: options.cache ?? "no-store",
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`API error (${response.status}): ${errorText}`)
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
