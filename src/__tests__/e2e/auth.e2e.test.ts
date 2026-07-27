import { describe, it, expect, beforeAll } from '@jest/globals'
import {
  skipIfServerUnavailable,
  login,
  refreshToken,
  getAuthToken,
  getCachedRefreshToken,
  clearTokenCache,
  authGet,
  apiRequest,
  TEST_CREDENTIALS,
  ApiEnvelope,
  LoginData,
} from './setup'

describe('Auth E2E', () => {
  let shouldSkip = false

  beforeAll(async () => {
    shouldSkip = await skipIfServerUnavailable()
  })

  // -----------------------------------------------------------------------
  // POST /auth/login
  // -----------------------------------------------------------------------
  describe('POST /auth/login', () => {
    it('should return 200 and tokens with valid credentials', async () => {
      if (shouldSkip) return

      const res = await login(TEST_CREDENTIALS.email, TEST_CREDENTIALS.password)

      expect(res.status).toBe(200)

      const body = res.body as ApiEnvelope<LoginData>
      expect(body.success).toBe(true)
      expect(body.data).toBeDefined()
      expect(body.data!.accessToken).toBeDefined()
      expect(body.data!.refreshToken).toBeDefined()
      expect(body.data!.expiresIn).toBeDefined()
      expect(body.data!.user).toBeDefined()
      expect(body.data!.user.id).toBeDefined()
      expect(body.data!.user.email).toBe(TEST_CREDENTIALS.email)
    })

    it('should return 401 with invalid credentials', async () => {
      if (shouldSkip) return

      const res = await login('nonexistent@example.com', 'WrongPassword123')

      expect(res.status).toBe(401)

      const body = res.body as ApiEnvelope
      expect(body.success).toBe(false)
      expect(body.errors).toBeDefined()
    })

    it('should return 400 when email is missing', async () => {
      if (shouldSkip) return

      const res = await apiRequest('POST', '/auth/login', {
        body: { password: 'SomePassword123' },
      })

      expect(res.status).toBe(400)
    })

    it('should return 400 when password is missing', async () => {
      if (shouldSkip) return

      const res = await apiRequest('POST', '/auth/login', {
        body: { email: 'test@example.com' },
      })

      expect(res.status).toBe(400)
    })
  })

  // -----------------------------------------------------------------------
  // POST /auth/refresh-token
  // -----------------------------------------------------------------------
  describe('POST /auth/refresh-token', () => {
    it('should return 200 with a valid refresh token', async () => {
      if (shouldSkip) return

      // Ensure we have a valid refresh token
      clearTokenCache()
      await getAuthToken()
      const validRefreshToken = getCachedRefreshToken()

      expect(validRefreshToken).toBeTruthy()

      const res = await refreshToken(validRefreshToken!)

      expect(res.status).toBe(200)

      const body = res.body as ApiEnvelope<LoginData>
      expect(body.success).toBe(true)
      expect(body.data!.accessToken).toBeDefined()
      expect(body.data!.refreshToken).toBeDefined()
    })

    it('should return 401 with an invalid refresh token', async () => {
      if (shouldSkip) return

      const res = await refreshToken('this-is-not-a-valid-token')

      expect(res.status).toBe(401)

      const body = res.body as ApiEnvelope
      expect(body.success).toBe(false)
    })

    it('should return 400 when refresh token is missing', async () => {
      if (shouldSkip) return

      const res = await apiRequest('POST', '/auth/refresh-token', {
        body: {},
      })

      expect(res.status).toBe(400)
    })
  })

  // -----------------------------------------------------------------------
  // Protected route access
  // -----------------------------------------------------------------------
  describe('Protected route access', () => {
    it('should return 401 when accessing a protected route without a token', async () => {
      if (shouldSkip) return

      const res = await apiRequest('GET', '/categories')

      expect(res.status).toBe(401)

      const body = res.body as ApiEnvelope
      expect(body.success).toBe(false)
    })

    it('should return 200 when accessing a protected route with a valid token', async () => {
      if (shouldSkip) return

      const token = await getAuthToken()

      const res = await authGet('/categories', token)

      // 200 is expected; some deployments may return 200 with an empty list
      expect(res.status).toBe(200)
    })

    it('should return 401 when using an expired or malformed token', async () => {
      if (shouldSkip) return

      const res = await authGet('/categories', 'malformed.jwt.token')

      expect(res.status).toBe(401)

      const body = res.body as ApiEnvelope
      expect(body.success).toBe(false)
    })
  })
})
