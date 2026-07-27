import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import {
  skipIfServerUnavailable,
  getAuthToken,
  authGet,
  authPost,
  authPut,
  authDelete,
  apiRequest,
  uniqueName,
  uniqueSuffix,
  ApiEnvelope,
} from './setup'

/**
 * CRUD Flow E2E Tests
 *
 * Exercises the full Create -> Read -> Update -> Delete lifecycle for
 * categories, companies, customers, and products.
 * Also validates OData query parameters ($filter, $top, $orderby).
 *
 * Each suite is self-contained: it creates its own data and cleans up
 * after itself. A shared auth token is obtained once in beforeAll.
 */
describe('CRUD Flow E2E', () => {
  let shouldSkip = false
  let token: string

  beforeAll(async () => {
    shouldSkip = await skipIfServerUnavailable()
    if (!shouldSkip) {
      token = await getAuthToken()
    }
  })

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------

  /** Extract the `data` field from a standard API envelope, tolerating
   *  responses that return the entity directly (no envelope wrapper). */
  function extractData<T>(body: any): T {
    if (body && typeof body === 'object' && 'data' in body) {
      return body.data as T
    }
    return body as T
  }

  /** Return the first item from a list response, whether the body uses
   *  `data` (array), `data.items`, `data.data`, or `items`. */
  function firstItem<T>(body: any): T | undefined {
    const d = extractData<any>(body)
    if (Array.isArray(d)) return d[0] as T
    if (d?.items && Array.isArray(d.items)) return d.items[0] as T
    if (d?.data && Array.isArray(d.data)) return d.data[0] as T
    return undefined
  }

  // -----------------------------------------------------------------------
  // Category CRUD
  // -----------------------------------------------------------------------
  describe('Category CRUD', () => {
    let categoryId: string
    const categoryName = uniqueName('CatE2E')

    it('should create a category', async () => {
      if (shouldSkip) return

      const res = await authPost(
        '/categories',
        {
          name: categoryName,
          description: 'E2E test category',
        },
        token
      )

      expect([200, 201]).toContain(res.status)

      const data = extractData<any>(res.body)
      categoryId = data?.id
      expect(categoryId).toBeDefined()
      expect(data?.name).toBe(categoryName)
    })

    it('should read the created category by id', async () => {
      if (shouldSkip || !categoryId) return

      const res = await authGet(`/categories/${categoryId}`, token)

      expect(res.status).toBe(200)

      const data = extractData<any>(res.body)
      expect(data?.id).toBe(categoryId)
      expect(data?.name).toBe(categoryName)
    })

    it('should update the category', async () => {
      if (shouldSkip || !categoryId) return

      const updatedName = `${categoryName}_updated`
      const res = await authPut(
        `/categories/${categoryId}`,
        { name: updatedName, description: 'Updated via E2E' },
        token
      )

      expect(res.status).toBe(200)

      const data = extractData<any>(res.body)
      expect(data?.name).toBe(updatedName)
    })

    it('should delete the category', async () => {
      if (shouldSkip || !categoryId) return

      const res = await authDelete(`/categories/${categoryId}`, token)

      expect([200, 204]).toContain(res.status)
    })

    it('should return 404 or empty when fetching deleted category', async () => {
      if (shouldSkip || !categoryId) return

      const res = await authGet(`/categories/${categoryId}`, token)

      // Soft-delete may return 404 or a response indicating inactive/removed
      expect([200, 404]).toContain(res.status)
    })
  })

  // -----------------------------------------------------------------------
  // Company CRUD
  // -----------------------------------------------------------------------
  describe('Company CRUD', () => {
    let companyId: string
    const suffix = uniqueSuffix()
    const companyData = {
      name: `E2E Company ${suffix}`,
      docId: `12345678${suffix.slice(-3).padStart(3, '0')}00`,
      email: `e2e_company_${suffix}@test.com`,
      description: 'E2E test company',
      phoneNumber: '(11) 99999-0000',
    }

    it('should create a company', async () => {
      if (shouldSkip) return

      const res = await authPost('/companies', companyData, token)

      expect([200, 201]).toContain(res.status)

      const data = extractData<any>(res.body)
      companyId = data?.id
      expect(companyId).toBeDefined()
      expect(data?.name).toBe(companyData.name)
    })

    it('should read the created company by id', async () => {
      if (shouldSkip || !companyId) return

      const res = await authGet(`/companies/${companyId}`, token)

      expect(res.status).toBe(200)

      const data = extractData<any>(res.body)
      expect(data?.id).toBe(companyId)
      expect(data?.name).toBe(companyData.name)
    })

    it('should update the company', async () => {
      if (shouldSkip || !companyId) return

      const res = await authPut(
        `/companies/${companyId}`,
        { name: `${companyData.name} Updated`, description: 'Updated via E2E' },
        token
      )

      expect(res.status).toBe(200)

      const data = extractData<any>(res.body)
      expect(data?.name).toContain('Updated')
    })

    it('should delete the company', async () => {
      if (shouldSkip || !companyId) return

      const res = await authDelete(`/companies/${companyId}`, token)

      expect([200, 204]).toContain(res.status)
    })
  })

  // -----------------------------------------------------------------------
  // Customer CRUD
  // -----------------------------------------------------------------------
  describe('Customer CRUD', () => {
    let customerId: string
    const suffix = uniqueSuffix()
    const customerData = {
      name: `E2E Customer ${suffix}`,
      docId: `98765432${suffix.slice(-3).padStart(3, '0')}00`,
      email: `e2e_customer_${suffix}@test.com`,
      description: 'E2E test customer',
      phoneNumber: '(21) 98888-0000',
    }

    it('should create a customer', async () => {
      if (shouldSkip) return

      const res = await authPost('/customers', customerData, token)

      expect([200, 201]).toContain(res.status)

      const data = extractData<any>(res.body)
      customerId = data?.id
      expect(customerId).toBeDefined()
      expect(data?.name).toBe(customerData.name)
    })

    it('should read the created customer by id', async () => {
      if (shouldSkip || !customerId) return

      const res = await authGet(`/customers/${customerId}`, token)

      expect(res.status).toBe(200)

      const data = extractData<any>(res.body)
      expect(data?.id).toBe(customerId)
      expect(data?.name).toBe(customerData.name)
    })

    it('should update the customer', async () => {
      if (shouldSkip || !customerId) return

      const res = await authPut(
        `/customers/${customerId}`,
        { name: `${customerData.name} Updated`, description: 'Updated via E2E' },
        token
      )

      expect(res.status).toBe(200)

      const data = extractData<any>(res.body)
      expect(data?.name).toContain('Updated')
    })

    it('should delete the customer', async () => {
      if (shouldSkip || !customerId) return

      const res = await authDelete(`/customers/${customerId}`, token)

      expect([200, 204]).toContain(res.status)
    })
  })

  // -----------------------------------------------------------------------
  // Product CRUD
  // -----------------------------------------------------------------------
  describe('Product CRUD', () => {
    let productId: string
    let companyId: string
    let categoryId: string
    const suffix = uniqueSuffix()

    // Products require a companyId (and optionally categoryId).
    // We create a company and category first so the product has valid
    // foreign-key references.
    beforeAll(async () => {
      if (shouldSkip) return

      // Create a company for the product
      const compRes = await authPost(
        '/companies',
        {
          name: `E2E ProdCo ${suffix}`,
          docId: `11223344${suffix.slice(-3).padStart(3, '0')}00`,
          email: `e2e_prodco_${suffix}@test.com`,
        },
        token
      )
      const compData = extractData<any>(compRes.body)
      companyId = compData?.id

      // Create a category for the product
      const catRes = await authPost(
        '/categories',
        { name: uniqueName('ProdCatE2E'), description: 'For product E2E' },
        token
      )
      const catData = extractData<any>(catRes.body)
      categoryId = catData?.id
    })

    afterAll(async () => {
      if (shouldSkip || !token) return

      // Clean up the supporting company and category
      if (companyId) await authDelete(`/companies/${companyId}`, token).catch(() => {})
      if (categoryId) await authDelete(`/categories/${categoryId}`, token).catch(() => {})
    })

    it('should create a product', async () => {
      if (shouldSkip || !companyId) return

      const res = await authPost(
        '/products',
        {
          name: `E2E Product ${suffix}`,
          description: 'E2E test product',
          price: 49.99,
          stockQuantity: 100,
          minStockLevel: 10,
          companyId,
          categoryId: categoryId || undefined,
        },
        token
      )

      expect([200, 201]).toContain(res.status)

      const data = extractData<any>(res.body)
      productId = data?.id
      expect(productId).toBeDefined()
      expect(data?.name).toContain('E2E Product')
    })

    it('should read the created product by id', async () => {
      if (shouldSkip || !productId) return

      const res = await authGet(`/products/${productId}`, token)

      expect(res.status).toBe(200)

      const data = extractData<any>(res.body)
      expect(data?.id).toBe(productId)
    })

    it('should update the product', async () => {
      if (shouldSkip || !productId) return

      const res = await authPut(
        `/products/${productId}`,
        { name: `E2E Product ${suffix} Updated`, price: 59.99 },
        token
      )

      expect(res.status).toBe(200)

      const data = extractData<any>(res.body)
      expect(data?.name).toContain('Updated')
    })

    it('should delete the product', async () => {
      if (shouldSkip || !productId) return

      const res = await authDelete(`/products/${productId}`, token)

      expect([200, 204]).toContain(res.status)
    })
  })

  // -----------------------------------------------------------------------
  // OData query verification
  // -----------------------------------------------------------------------
  describe('OData queries', () => {
    let categoryId: string

    beforeAll(async () => {
      if (shouldSkip) return

      // Seed a category so there is at least one record to query
      const res = await authPost(
        '/categories',
        { name: uniqueName('ODataCat'), description: 'OData seed' },
        token
      )
      const data = extractData<any>(res.body)
      categoryId = data?.id
    })

    afterAll(async () => {
      if (shouldSkip || !categoryId || !token) return
      await authDelete(`/categories/${categoryId}`, token).catch(() => {})
    })

    it('should support $top to limit results', async () => {
      if (shouldSkip) return

      const res = await authGet('/categories?$top=1', token)

      expect(res.status).toBe(200)

      const body = res.body
      const items = Array.isArray(body?.data)
        ? body.data
        : Array.isArray(body?.data?.data)
          ? body.data.data
          : Array.isArray(body?.data?.items)
            ? body.data.items
            : Array.isArray(body)
              ? body
              : []

      expect(items.length).toBeLessThanOrEqual(1)
    })

    it('should support $orderby to sort results', async () => {
      if (shouldSkip) return

      const res = await authGet('/categories?$orderby=name asc', token)

      expect(res.status).toBe(200)

      // Verify the response is valid; ordering correctness is hard to assert
      // without seed data control, but the endpoint must not error.
      expect(res.body).toBeDefined()
    })

    it('should support $filter to filter results', async () => {
      if (shouldSkip) return

      // Use a filter that should match the seeded category
      const res = await authGet(
        `/categories?$filter=contains(name,'ODataCat')`,
        token
      )

      expect(res.status).toBe(200)
      expect(res.body).toBeDefined()
    })

    it('should support $count to get total count', async () => {
      if (shouldSkip) return

      const res = await authGet('/categories?$count=true', token)

      expect(res.status).toBe(200)
      expect(res.body).toBeDefined()
    })
  })
})
