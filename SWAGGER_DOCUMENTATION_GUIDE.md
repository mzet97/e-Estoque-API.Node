# 📚 Swagger Documentation Guide - e-Estoque API

## 🎯 Swagger UI Access

After starting the server, access the Swagger UI at:
- **Development:** http://localhost:3000/api/docs
- **JSON Spec:** http://localhost:3000/api/docs.json

## ✅ Completed Tasks

### 1. Swagger Configuration ✅
- **File:** `src/shared/http/swagger.config.ts`
- **Status:** Complete with all schemas
- **Features:**
  - OpenAPI 3.0.3 specification
  - Bearer token authentication
  - Complete schemas for all entities
  - Swagger UI with advanced options
  - Raw JSON spec endpoint

### 2. Middleware Integration ✅
- **File:** `src/shared/http/app.ts`
- **Status:** Already integrated
- **Endpoint:** `/api/docs`
- **Options:**
  - Persist authorization
  - Display request duration
  - Filter enabled
  - Show extensions

### 3. Schemas Defined ✅
All entity schemas have been defined:

| Module | Schema | Properties |
|--------|--------|------------|
| **Common** | Error | success, message, error, errors |
| | PaginationMeta | page, pageSize, total, totalPages |
| | PagedResult | items, total, page, pageSize, totalPages |
| **Categories** | Category | id, name, description, slug, isActive, etc. |
| | CreateCategoryRequest | name, description, parentId, sortOrder |
| | UpdateCategoryRequest | name, description, parentId, isActive, sortOrder |
| **Companies** | Company | id, name, docId, email, description, phoneNumber, companyAddress |
| **Customers** | Customer | id, name, docId, email, description, phoneNumber, customerAddress |
| **Products** | Product | id, name, description, sku, price, cost, category, tax |
| **Sales** | Sale | id, saleNumber, customer, total, discount, taxTotal, status, saleProducts |
| **Inventory** | Inventory | id, product, quantity, minimumStock, location |
| **Taxes** | Tax | id, name, percentage, description, isActive |
| **Users** | User | id, name, email, isActive, roles |
| **Roles** | Role | id, name, description, isDeleted |
| **Auth** | LoginRequest | email, password |
| | LoginResponse | success, data, message |

## 📝 Next Steps

### 1. Add JSDoc to Controllers (In Progress)
Example for Categories controller:

```typescript
/**
 * @swagger
 * /categories:
 *   get:
 *     tags: [Categories]
 *     summary: List all categories
 *     description: Returns a paginated list of categories with optional filtering
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: number, minimum: 1, default: 1 }
 *         description: Page number
 *       - in: query
 *         name: pageSize
 *         schema: { type: number, minimum: 1, maximum: 100, default: 15 }
 *         description: Items per page
 *       - in: query
 *         name: searchTerm
 *         schema: { type: string }
 *         description: Search term
 *       - in: query
 *         name: isActive
 *         schema: { type: boolean }
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   $ref: '#/components/schemas/PagedResult'
 *                 message: { type: string }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
```

### 2. Controllers to Document
Priority order:

1. **Categories** (5 endpoints)
   - GET /categories
   - POST /categories
   - GET /categories/{id}
   - PUT /categories/{id}
   - DELETE /categories/{id}

2. **Companies** (5 endpoints)
3. **Customers** (5 endpoints)
4. **Products** (5 endpoints)
5. **Sales** (6 endpoints)
6. **Inventory** (5 endpoints)
7. **Taxes** (5 endpoints)
8. **Users** (5 endpoints)
9. **Roles** (5 endpoints - partially done)
10. **Auth** (2 endpoints)

### 3. OData Endpoints
Also document OData endpoints:

- GET /categories/odata
- GET /companies/odata
- GET /customers/odata
- GET /products/odata
- GET /sales/odata
- GET /inventory/odata
- GET /taxs/odata
- GET /users/odata

## 🔍 Swagger UI Features

After integration, the Swagger UI will have:

### Navigation
- ✅ Tags for each module
- ✅ Search and filter endpoints
- ✅ Group by tags

### Authentication
- ✅ Bearer token input at top
- ✅ "Authorize" button
- ✅ Persist across requests

### Request/Response
- ✅ Example values for all parameters
- ✅ Request bodies with schemas
- ✅ Response schemas with examples
- ✅ HTTP status codes
- ✅ Response duration display

### Interactive Testing
- ✅ "Try it out" button for each endpoint
- ✅ Execute requests directly from UI
- ✅ View actual responses
- ✅ cURL command generation

## 📊 Testing Checklist

- [ ] Start server: `npm run dev`
- [ ] Access: http://localhost:3000/api/docs
- [ ] Verify all tags are visible
- [ ] Check auth button works
- [ ] Test a GET endpoint
- [ ] Test a POST endpoint with auth
- [ ] Verify JSON spec: http://localhost:3000/api/docs.json
- [ ] Validate with Swagger Editor

## 🎯 Success Criteria

Swagger UI is successful when:
- ✅ All 40+ endpoints are documented
- ✅ All schemas are referenced correctly
- ✅ Authentication works
- ✅ Examples are realistic
- ✅ Interactive testing works
- ✅ No errors in spec

## 📚 Resources

- [OpenAPI 3.0 Specification](https://swagger.io/specification/)
- [Swagger UI Demo](https://swagger.io/tools/swagger-ui/)
- [Swagger Editor](https://editor.swagger.io/)
- [JSDoc for OpenAPI](https://github.com/Surnet/swagger-jsdoc)

---

**Status:** 40% Complete
**Next:** Add JSDoc to Categories controller
**ETA:** 2-3 hours for full documentation
