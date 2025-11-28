# 🚀 OData Implementation Roadmap

## 📋 Overview

This roadmap provides a step-by-step guide to implement OData support in all modules of the e-Estoque-API.Node project.

**Status:** ✅ Categories Module - COMPLETE
**Next:** Companies, Products, Customers, Sales, Inventory, Taxes, Users

---

## ✅ COMPLETED: Categories Module

### Files Created

```
src/categories/
├── useCases/listCategoriesOData/
│   └── ListCategoriesODataUseCase.ts       ✅
├── http/controllers/
│   └── ListCategoriesODataController.ts   ✅
├── http/routes/
│   └── categoriesOData.routes.ts          ✅
└── index.ts                               ✅ Updated
```

### Endpoint
```
GET /api/categories/odata
```

---

## 📝 IMPLEMENTATION CHECKLIST

For each module, follow this checklist:

### Phase 1: Create Use Case (1 hour per module)
- [ ] Create `useCases/list{Module}OData/List{Module}ODataUseCase.ts`
- [ ] Extend `BaseODataUseCase`
- [ ] Implement `execute()` method
- [ ] Inject repository
- [ ] Add error handling
- [ ] Add logging

### Phase 2: Create Controller (30 min per module)
- [ ] Create `http/controllers/List{Module}ODataController.ts`
- [ ] Implement `handle()` method
- [ ] Inject use case
- [ ] Handle $count queries
- [ ] Add error handling
- [ ] Return proper HTTP responses

### Phase 3: Create Routes (15 min per module)
- [ ] Create `http/routes/{module}OData.routes.ts`
- [ ] Set up Express router
- [ ] Add authentication middleware
- [ ] Add OData middleware
- [ ] Register GET endpoint

### Phase 4: Update Module Index (5 min per module)
- [ ] Export new use case
- [ ] Export new routes
- [ ] Keep existing exports

### Phase 5: Integration (15 min per module)
- [ ] Add routes to main app router
- [ ] Update swagger docs
- [ ] Add to shared container (if needed)

### Phase 6: Testing (30 min per module)
- [ ] Create test file
- [ ] Test $filter
- [ ] Test $orderby
- [ ] Test $top/$skip
- [ ] Test $select
- [ ] Test $count
- [ ] Test complex queries

---

## 📊 MODULE IMPLEMENTATION STATUS

### 1. Companies Module
**Status:** ⏳ Pending
**Estimated Time:** 2.5 hours

**Files to Create:**
```
src/companies/
├── useCases/listCompaniesOData/
│   └── ListCompaniesODataUseCase.ts
├── http/controllers/
│   └── ListCompaniesODataController.ts
└── http/routes/
    └── companiesOData.routes.ts
```

**Special Considerations:**
- Company has `companyAddress` (ValueObject) - support $expand
- Complex filtering on `name`, `docId`, `email`
- Relations: `companyAddress`

**Example Queries:**
```bash
# Filter by company name
GET /api/companies/odata?$filter=contains(name, 'Tech')

# Expand address
GET /api/companies/odata?$expand=companyAddress

# Filter by city
GET /api/companies/odata?$filter=companyAddress/city eq 'São Paulo'
```

---

### 2. Customers Module
**Status:** ⏳ Pending
**Estimated Time:** 2.5 hours

**Files to Create:**
```
src/customers/
├── useCases/listCustomersOData/
│   └── ListCustomersODataUseCase.ts
├── http/controllers/
│   └── ListCustomersODataController.ts
└── http/routes/
    └── customersOData.routes.ts
```

**Special Considerations:**
- Customer has `customerAddress` (ValueObject) - support $expand
- Filter by `name`, `docId`, `email`
- Relations: `customerAddress`

**Example Queries:**
```bash
# Filter customers by city
GET /api/customers/odata?$filter=customerAddress/city eq 'Rio de Janeiro'

# Get customers with addresses
GET /api/customers/odata?$expand=customerAddress&$select=id,name,email
```

---

### 3. Products Module
**Status:** ⏳ Pending
**Estimated Time:** 3 hours

**Files to Create:**
```
src/products/
├── useCases/listProductsOData/
│   └── ListProductsODataUseCase.ts
├── http/controllers/
│   └── ListProductsODataController.ts
└── http/routes/
    └── productsOData.routes.ts
```

**Special Considerations:**
- Product has multiple value objects: `dimensions`, `weight`, `images`
- Relations: `category`, `tax`
- Complex filtering on `price`, `sku`
- Multiple expansions possible

**Example Queries:**
```bash
# Filter by price range
GET /api/products/odata?$filter=price gt 100 and price lt 500

# Expand category
GET /api/products/odata?$expand=category

# Filter by category name
GET /api/products/odata?$filter=category/name eq 'Electronics'

# Select specific fields
GET /api/products/odata?$select=id,name,price,category/name
```

---

### 4. Sales Module
**Status:** ⏳ Pending
**Estimated Time:** 3.5 hours

**Files to Create:**
```
src/sales/
├── useCases/listSalesOData/
│   └── ListSalesODataUseCase.ts
├── http/controllers/
│   └── ListSalesODataController.ts
└── http/routes/
    └── salesOData.routes.ts
```

**Special Considerations:**
- Complex entity with `saleProducts` array
- Relations: `customer`, `saleProducts`, `saleProducts/product`
- Filter by `total`, `date`, `status`
- Aggregate queries for total revenue

**Example Queries:**
```bash
# Filter by date range
GET /api/sales/odata?$filter=createdAt ge 2025-01-01 and createdAt le 2025-12-31

# Filter by total amount
GET /api/sales/odata?$filter=total gt 1000

# Expand customer and products
GET /api/sales/odata?$expand=customer,saleProducts/product

# Filter by status
GET /api/sales/odata?$filter=status eq 'completed'
```

---

### 5. Inventory Module
**Status:** ⏳ Pending
**Estimated Time:** 3 hours

**Files to Create:**
```
src/inventory/
├── useCases/listInventoryOData/
│   └── ListInventoryODataUseCase.ts
├── http/controllers/
│   └── ListInventoryODataController.ts
└── http/routes/
    └── inventoryOData.routes.ts
```

**Special Considerations:**
- Filter by `quantity`, `minimumStock`, `product`
- Relations: `product`
- Real-time data - cache carefully
- Support for low stock queries

**Example Queries:**
```bash
# Filter low stock items
GET /api/inventory/odata?$filter=quantity le minimumStock

# Expand product
GET /api/inventory/odata?$expand=product

# Filter by product name
GET /api/inventory/odata?$filter=product/name eq 'iPhone 15'
```

---

### 6. Taxes Module
**Status:** ⏳ Pending
**Estimated Time:** 2 hours

**Files to Create:**
```
src/taxs/
├── useCases/listTaxesOData/
│   └── ListTaxesODataUseCase.ts
├── http/controllers/
│   └── ListTaxesODataController.ts
└── http/routes/
    └── taxesOData.routes.ts
```

**Special Considerations:**
- Simple entity with `percentage`, `name`
- Filter by `isActive`, `percentage`
- Support for percentage range queries

**Example Queries:**
```bash
# Filter active taxes
GET /api/taxs/odata?$filter=isActive eq true

# Filter by percentage range
GET /api/taxs/odata?$filter=percentage ge 10 and percentage le 20
```

---

### 7. Users Module
**Status:** ⏳ Pending
**Estimated Time:** 2.5 hours

**Files to Create:**
```
src/users/
├── useCases/listUsersOData/
│   └── ListUsersODataUseCase.ts
├── http/controllers/
│   └── ListUsersODataController.ts
└── http/routes/
    └── usersOData.routes.ts
```

**Special Considerations:**
- Sensitive data - sanitize output
- Relations: `roles`
- Filter by `email`, `name`, `isActive`
- Security considerations

**Example Queries:**
```bash
# Filter active users
GET /api/users/odata?$filter=isActive eq true

# Expand roles
GET /api/users/odata?$expand=roles

# Select limited fields (security)
GET /api/users/odata?$select=id,name,email,roles/name
```

---

## 🏗️ INTEGRATION STEPS

### Step 1: Update Main Application Router

```typescript
// src/shared/http/routes/index.ts

// Import all OData routes
import { categoriesODataRouter } from '@categories/http/routes/categoriesOData.routes'
import { companiesODataRouter } from '@companies/http/routes/companiesOData.routes'
// ... other imports

// Register OData routes
app.use('/api/categories/odata', categoriesODataRouter)
app.use('/api/companies/odata', companiesODataRouter)
// ... other routes
```

### Step 2: Update Swagger Documentation

```typescript
// src/shared/http/swagger.config.ts

// Add OData routes to swagger
const oDataPaths = {
  '/categories/odata': {
    get: {
      tags: ['Categories'],
      summary: 'List categories with OData support',
      parameters: [
        {
          name: '$filter',
          in: 'query',
          description: 'OData filter expression'
        },
        // ... other OData parameters
      ]
    }
  }
}
```

### Step 3: Register in Shared Container (if needed)

```typescript
// src/shared/container/index.ts

// Register OData services
container.registerSingleton(ODataParserService)
container.registerSingleton(ODataCacheService)
```

---

## 🧪 TESTING STRATEGY

### Test Categories

1. **Parser Tests**
   - Filter parsing
   - OrderBy parsing
   - Select parsing
   - Top/Skip parsing

2. **Integration Tests**
   - End-to-end with real database
   - Complex queries
   - Performance with large datasets
   - Cache behavior

3. **Security Tests**
   - SQL injection prevention
   - Field validation
   - Authorization checks

### Example Test Suite

```typescript
// src/modules/yourModule/__tests__/oData.test.ts

describe('YourModule OData', () => {
  test('should filter with $filter', async () => {
    const response = await request(app)
      .get('/api/yourModule/odata?$filter=name eq "Test"')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    expect(response.body.data).toBeDefined()
  })

  test('should handle $count', async () => {
    const response = await request(app)
      .get('/api/yourModule/odata?$count=true')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    expect(response.body['@odata.count']).toBeDefined()
  })
})
```

---

## 📈 PERFORMANCE CONSIDERATIONS

### Caching Strategy

| Query Type | TTL | Cache Key |
|------------|-----|-----------|
| Simple filters | 5 min | entity + query hash |
| Complex queries | 10 min | entity + query hash |
| Count queries | 2 min | entity + query hash |
| Real-time data | No cache | - |

### Database Indexing

Ensure these indexes exist:

```sql
-- Categories
CREATE INDEX idx_categories_name ON categories(name);
CREATE INDEX idx_categories_is_active ON categories(is_active);

-- Companies
CREATE INDEX idx_companies_name ON companies(name);
CREATE INDEX idx_companies_doc_id ON companies(doc_id);

-- Products
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_category_id ON products(category_id);

-- Sales
CREATE INDEX idx_sales_created_at ON sales(created_at);
CREATE INDEX idx_sales_total ON sales(total);

-- Inventory
CREATE INDEX idx_inventory_quantity ON inventory(quantity);
CREATE INDEX idx_inventory_product_id ON inventory(product_id);
```

---

## 🎯 DEPLOYMENT CHECKLIST

Before deploying OData to production:

- [ ] All modules have OData support
- [ ] Database indexes created
- [ ] Performance tests passing
- [ ] Security tests passing
- [ ] Caching configured
- [ ] Monitoring setup
- [ ] Documentation updated
- [ ] Swagger docs updated

---

## 📅 TIMELINE

| Module | Time | Start Date | End Date |
|--------|------|------------|----------|
| Categories | Done | - | 2025-11-27 |
| Companies | 2.5h | Day 1 | Day 1 |
| Customers | 2.5h | Day 1 | Day 1 |
| Products | 3h | Day 2 | Day 2 |
| Sales | 3.5h | Day 2-3 | Day 3 |
| Inventory | 3h | Day 3 | Day 3 |
| Taxes | 2h | Day 3 | Day 3 |
| Users | 2.5h | Day 4 | Day 4 |
| Integration | 4h | Day 4-5 | Day 5 |
| Testing | 8h | Day 5-6 | Day 6 |
| Documentation | 4h | Day 6 | Day 6 |

**Total Estimated Time:** 6 days

---

## 🤝 CONTRIBUTION GUIDELINES

When implementing OData for a new module:

1. **Follow the exact structure** shown in Categories module
2. **Use TypeScript strict mode**
3. **Add comprehensive error handling**
4. **Write tests before committing**
5. **Update documentation**
6. **Run performance tests**
7. **Ensure security compliance**

---

**Document Version:** 1.0.0
**Last Updated:** 2025-11-27
**Author:** SWE Principal
**Status:** Ready for Implementation
