/**
 * E2E Test Setup
 *
 * Provides shared configuration and helper functions for end-to-end tests.
 * These tests require a running API server and database.
 *
 * Environment variables:
 *   E2E_BASE_URL  - API base URL (default: http://localhost:3001/api/v1)
 *   E2E_EMAIL     - Login email  (default: admin@eestoque.com)
 *   E2E_PASSWORD  - Login password (default: Admin@123)
 */

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3001/api/v1'

export const TEST_CREDENTIALS = {
  email: process.env.E2E_EMAIL || 'admin@eestoque.com',
  password: process.env.E2E_PASSWORD || 'Admin@123',
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ApiResponse<T = any> {
  status: number
  body: T
  headers: Headers
}

export interface LoginData {
  accessToken: string
  refreshToken: string
  expiresIn: string
  user: {
    id: string
    name: string
    email: string
    firstName: string
    lastName?: string
    role: {
      id: string
      name: string
    }
  }
}

export interface ApiEnvelope<T = any> {
  success: boolean
  message: string
  data?: T
  errors?: Array<{ code: string; message: string }>
}

// ---------------------------------------------------------------------------
// Server availability
// ---------------------------------------------------------------------------

let serverAvailable: boolean | null = null

/**
 * Check whether the API server is reachable.
 * Result is cached after the first call so health-checks don't flood the logs.
 */
export async function isServerAvailable(): Promise<boolean> {
  if (serverAvailable !== null) return serverAvailable

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)

    const res = await fetch(`${BASE_URL}/`, {
      method: 'GET',
      signal: controller.signal,
    })
    clearTimeout(timeout)

    serverAvailable = res.status === 200 || res.status === 404
  } catch {
    serverAvailable = false
  }

  return serverAvailable
}

/**
 * Skip the current test suite gracefully when the server is not running.
 * Call inside `beforeAll` -- returns `true` when the suite should be skipped.
 */
export async function skipIfServerUnavailable(): Promise<boolean> {
  const available = await isServerAvailable()
  if (!available) {
    console.warn(`[E2E] Server not reachable at ${BASE_URL} -- skipping tests`)
  }
  return !available
}

// ---------------------------------------------------------------------------
// Token management
// ---------------------------------------------------------------------------

let cachedToken: string | null = null
let cachedRefreshToken: string | null = null
let cachedUserId: string | null = null

/**
 * Authenticate once and cache the access token for the entire test run.
 * Subsequent calls return the cached token.
 */
export async function getAuthToken(): Promise<string> {
  if (cachedToken) return cachedToken

  const res = await login(TEST_CREDENTIALS.email, TEST_CREDENTIALS.password)

  if (res.status !== 200) {
    throw new Error(
      `[E2E] Could not obtain auth token (status ${res.status}). ` +
        'Make sure the test user exists and the server is running.'
    )
  }

  const body = res.body as ApiEnvelope<LoginData>
  cachedToken = body.data!.accessToken
  cachedRefreshToken = body.data!.refreshToken
  cachedUserId = body.data!.user.id

  return cachedToken
}

export function getCachedRefreshToken(): string | null {
  return cachedRefreshToken
}

export function getCachedUserId(): string | null {
  return cachedUserId
}

/**
 * Clear cached tokens (useful when testing auth flows that invalidate sessions).
 */
export function clearTokenCache(): void {
  cachedToken = null
  cachedRefreshToken = null
  cachedUserId = null
}

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------

/**
 * Generic request helper. Automatically sets Content-Type and optional Bearer token.
 */
export async function apiRequest<T = any>(
  method: string,
  path: string,
  options: {
    body?: unknown
    token?: string
    headers?: Record<string, string>
  } = {}
): Promise<ApiResponse<T>> {
  const url = `${BASE_URL}${path}`

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`
  }

  const fetchOptions: RequestInit = {
    method,
    headers,
  }

  if (options.body !== undefined) {
    fetchOptions.body = JSON.stringify(options.body)
  }

  const res = await fetch(url, fetchOptions)

  let body: any
  const contentType = res.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    body = await res.json()
  } else {
    body = await res.text()
  }

  return { status: res.status, body, headers: res.headers }
}

// Convenience wrappers -------------------------------------------------------

export function login(email: string, password: string) {
  return apiRequest('POST', '/auth/login', { body: { email, password } })
}

export function refreshToken(refreshTokenValue: string) {
  return apiRequest('POST', '/auth/refresh-token', {
    body: { refreshToken: refreshTokenValue },
  })
}

export function authGet<T = any>(path: string, token: string) {
  return apiRequest<T>('GET', path, { token })
}

export function authPost<T = any>(path: string, body: unknown, token: string) {
  return apiRequest<T>('POST', path, { body, token })
}

export function authPut<T = any>(path: string, body: unknown, token: string) {
  return apiRequest<T>('PUT', path, { body, token })
}

export function authDelete<T = any>(path: string, token: string) {
  return apiRequest<T>('DELETE', path, { token })
}

// ---------------------------------------------------------------------------
// Unique data helpers
// ---------------------------------------------------------------------------

let counter = 0

/** Return a unique suffix to avoid collisions between parallel test runs. */
export function uniqueSuffix(): string {
  counter += 1
  return `${Date.now()}_${counter}`
}

/** Generate a unique string for test data fields. */
export function uniqueName(prefix: string): string {
  return `${prefix}_${uniqueSuffix()}`
}
