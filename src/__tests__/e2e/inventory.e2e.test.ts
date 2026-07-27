import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import {
  skipIfServerUnavailable,
  getAuthToken,
  authGet,
  authPost,
  authPut,
  authDelete,
  uniqueSuffix,
  ApiEnvelope,
} from './setup'

/**
 * Inventory E2E Tests
 *
 * Validates the read-only inventory reporting endpoints exposed at
 * /inventory/companies/:companyId/*.
 *
 * A company (and optionally a product with stock) is created in beforeAll
 * so the endpoints have meaningful data to return. Cleanup runs in afterAll.
 */
describe('Inventory E2E', () => {
  let shouldSkip = false
  let token: string
  let companyId: string
  let productId: string

  const suffix = uniqueSuffix()

  // -----------------------------------------------------------------------
  // Setup & Teardown
  // -----------------------------------------------------------------------

  beforeAll(async () => {
    shouldSkip = await skipIfServerUnavailable()
    if (shouldSkip) return

    token = await getAuthToken()

    // Create a company to own inventory data
    const compRes = await authPost(
      '/companies',
      {
        name: `E2E InvCo ${suffix}`,
        docId: `55667788${suffix.slice(-3).padStart(3, '0')}00`,
        email: `e2e_invco_${suffix}@test.com`,
      },
      token
    )

    const compBody = compRes.body as any
    companyId = compBody?.data?.id || compBody?.id

    if (!companyId) {
      console.warn('[E2E] Could not create company for inventory tests')
      return
    }

    // Create a product so statistics have at least one product to count
    const prodRes = await authPost(
      '/products',
      {
        name: `E2E InvProduct ${suffix}`,
        price: 25.0,
        stockQuantity: 50,
        minStockLevel: 10,
        companyId,
      },
      token
    )

    const prodBody = prodRes.body as any
    productId = prodBody?.data?.id || prodBody?.id
  })

  afterAll(async () => {
    if (shouldSkip || !token) return

    // Clean up product first (foreign key), then company
    if (productId) {
      await authDelete(`/products/${productId}`, token).catch(() => {})
    }
    if (companyId) {
      await authDelete(`/companies/${companyId}`, token).catch(() => {})
    }
  })

  // -----------------------------------------------------------------------
  // GET /inventory/companies/:companyId/statistics
  // -----------------------------------------------------------------------
  describe('GET /inventory/companies/:companyId/statistics', () => {
    it('should return 200 with inventory statistics', async () => {
      if (shouldSkip || !companyId) return

      const res = await authGet(
        `/inventory/companies/${companyId}/statistics`,
        token
      )

      expect(res.status).toBe(200)
      expect(res.body).toBeDefined()

      // The response should contain some form of statistics object
      const body = res.body as any
      const data = body?.data ?? body
      expect(data).toBeDefined()
    })

    it('should accept optional date range query params', async () => {
      if (shouldSkip || !companyId) return

      const startDate = '2024-01-01'
      const endDate = '2024-12-31'

      const res = await authGet(
        `/inventory/companies/${companyId}/statistics?startDate=${startDate}&endDate=${endDate}`,
        token
      )

      expect(res.status).toBe(200)
      expect(res.body).toBeDefined()
    })

    it('should return 400 for an invalid companyId', async () => {
      if (shouldSkip) return

      const res = await authGet(
        '/inventory/companies/not-a-uuid/statistics',
        token
      )

      expect([400, 404]).toContain(res.status)
    })
  })

  // -----------------------------------------------------------------------
  // GET /inventory/companies/:companyId/low-stock
  // -----------------------------------------------------------------------
  describe('GET /inventory/companies/:companyId/low-stock', () => {
    it('should return 200 with low stock products', async () => {
      if (shouldSkip || !companyId) return

      const res = await authGet(
        `/inventory/companies/${companyId}/low-stock`,
        token
      )

      expect(res.status).toBe(200)
      expect(res.body).toBeDefined()

      // Response should be a list (may be empty if stock is healthy)
      const body = res.body as any
      const data = body?.data ?? body
      expect(data).toBeDefined()
    })

    it('should accept optional query parameters', async () => {
      if (shouldSkip || !companyId) return

      const res = await authGet(
        `/inventory/companies/${companyId}/low-stock?includeCritical=true&includeOutOfStock=true`,
        token
      )

      expect(res.status).toBe(200)
      expect(res.body).toBeDefined()
    })

    it('should return 400 for an invalid companyId', async () => {
      if (shouldSkip) return

      const res = await authGet(
        '/inventory/companies/not-a-uuid/low-stock',
        token
      )

      expect([400, 404]).toContain(res.status)
    })
  })

  // -----------------------------------------------------------------------
  // GET /inventory/companies/:companyId/out-of-stock
  // -----------------------------------------------------------------------
  describe('GET /inventory/companies/:companyId/out-of-stock', () => {
    it('should return 200 with out-of-stock products', async () => {
      if (shouldSkip || !companyId) return

      const res = await authGet(
        `/inventory/companies/${companyId}/out-of-stock`,
        token
      )

      expect(res.status).toBe(200)
      expect(res.body).toBeDefined()

      const body = res.body as any
      const data = body?.data ?? body
      expect(data).toBeDefined()
    })

    it('should support pagination parameters', async () => {
      if (shouldSkip || !companyId) return

      const res = await authGet(
        `/inventory/companies/${companyId}/out-of-stock?page=1&pageSize=10`,
        token
      )

      expect(res.status).toBe(200)
      expect(res.body).toBeDefined()
    })

    it('should return 400 for an invalid companyId', async () => {
      if (shouldSkip) return

      const res = await authGet(
        '/inventory/companies/not-a-uuid/out-of-stock',
        token
      )

      expect([400, 404]).toContain(res.status)
    })
  })

  // -----------------------------------------------------------------------
  // GET /inventory/companies/:companyId/expired
  // -----------------------------------------------------------------------
  describe('GET /inventory/companies/:companyId/expired', () => {
    it('should return 200 with expired products', async () => {
      if (shouldSkip || !companyId) return

      const res = await authGet(
        `/inventory/companies/${companyId}/expired`,
        token
      )

      expect(res.status).toBe(200)
      expect(res.body).toBeDefined()

      const body = res.body as any
      const data = body?.data ?? body
      expect(data).toBeDefined()
    })

    it('should accept daysAhead query parameter', async () => {
      if (shouldSkip || !companyId) return

      const res = await authGet(
        `/inventory/companies/${companyId}/expired?daysAhead=60`,
        token
      )

      expect(res.status).toBe(200)
      expect(res.body).toBeDefined()
    })

    it('should support pagination parameters', async () => {
      if (shouldSkip || !companyId) return

      const res = await authGet(
        `/inventory/companies/${companyId}/expired?page=1&pageSize=5`,
        token
      )

      expect(res.status).toBe(200)
      expect(res.body).toBeDefined()
    })

    it('should return 400 for an invalid companyId', async () => {
      if (shouldSkip) return

      const res = await authGet(
        '/inventory/companies/not-a-uuid/expired',
        token
      )

      expect([400, 404]).toContain(res.status)
    })
  })

  // -----------------------------------------------------------------------
  // Authentication requirements
  // -----------------------------------------------------------------------
  describe('Authentication requirements', () => {
    it('should return 401 when accessing inventory endpoints without a token', async () => {
      if (shouldSkip || !companyId) return

      // Use the raw apiRequest without a token via a direct fetch
      const { apiRequest: rawRequest } = await import('./setup')
      const res = await rawRequest(
        'GET',
        `/inventory/companies/${companyId}/statistics`
      )

      expect(res.status).toBe(401)
    })
  })
})
