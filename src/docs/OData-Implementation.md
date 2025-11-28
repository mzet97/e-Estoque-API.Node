# OData Implementation - e-Estoque-API.Node

## 📖 Overview

This document describes the OData implementation for the e-Estoque-API.Node project. OData (Open Data Protocol) is a RESTful protocol for querying and updating data, allowing clients to construct sophisticated queries using URL parameters.

## 🎯 Features Implemented

### ✅ Supported OData Operations

1. **$filter** - Filter data based on criteria
2. **$select** - Select specific fields
3. **$orderby** - Sort results
4. **$top** - Limit number of results
5. **$skip** - Skip results (pagination)
6. **$count** - Get total count
7. **$expand** - Include related entities

### ✅ Advanced Features

- **Query Parser** - Full OData syntax parser
- **Caching** - Intelligent caching for complex queries
- **Performance Optimization** - Automatic query optimization
- **TypeORM Integration** - Seamless integration with TypeORM

## 🔧 Architecture

### Core Components

```
src/shared/services/
├── ODataParser.ts        # Query parser
├── ODataMiddleware.ts    # Express middleware
└── ODataCacheService.ts  # Query caching

src/shared/useCases/
└── BaseODataUseCase.ts   # Base class for OData use cases
```

### Module Integration

Each module that supports OData should have:

```
module/
├── useCases/
│   └── list{Module}OData/
│       └── List{Module}ODataUseCase.ts
├── http/
│   └── controllers/
│       └── List{Module}ODataController.ts
│   └── routes/
│       └── {module}OData.routes.ts
```

## 📝 Usage Examples

### Basic Filtering

```bash
# Filter by name equals 'Electronics'
GET /api/categories/odata?$filter=name eq 'Electronics'

# Filter by multiple criteria (AND)
GET /api/categories/odata?$filter=name eq 'Electronics' and isActive eq true

# Filter with contains
GET /api/categories/odata?$filter=contains(name, 'tron')
```

### Ordering

```bash
# Order by name ascending
GET /api/categories/odata?$orderby=name

# Order by name descending
GET /api/categories/odata?$orderby=name desc

# Order by multiple fields
GET /api/categories/odata?$orderby=name asc,createdAt desc
```

### Pagination

```bash
# Get first 10 records
GET /api/categories/odata?$top=10

# Skip first 20, get next 10
GET /api/categories/odata?$skip=20&$top=10

# Pagination (page 3, 15 items per page)
GET /api/categories/odata?$skip=30&$top=15
```

### Field Selection

```bash
# Select only specific fields
GET /api/categories/odata?$select=id,name,description

# Mix with filtering
GET /api/categories/odata?$filter=isActive eq true&$select=id,name
```

### Count

```bash
# Get total count
GET /api/categories/odata?$count=true

# Count with filter
GET /api/categories/odata?$filter=isActive eq true&$count=true
```

### Complex Queries

```bash
# Complex query with multiple operations
GET /api/categories/odata?
  $filter=name eq 'Electronics' and isActive eq true
  &$orderby=name asc
  &$select=id,name,description
  &$top=10

# With pagination
GET /api/categories/odata?
  $filter=contains(name, 'tron')
  &$orderby=createdAt desc
  &$skip=20
  &$top=10
```

## 🚀 Implementation Guide

### Step 1: Create OData Use Case

```typescript
import { inject, injectable } from 'tsyringe'
import BaseODataUseCase from '@shared/useCases/BaseODataUseCase'
import IResult from '@shared/viewModels/IResult'
import IPaginationResult from '@shared/viewModels/IPaginationResult'
import { YourEntity } from '../entities/YourEntity'
import IYourRepository from '../repositories/IYourRepository'
import { ODataQuery } from '@shared/services/ODataParser'

export interface ListYourEntityODataFilters {
  oDataQuery?: ODataQuery
  userId?: string
  cacheEnabled?: boolean
}

@injectable()
export default class ListYourEntityODataUseCase extends BaseODataUseCase<ListYourEntityODataFilters, IPaginationResult<YourEntity>> {
  constructor(
    @inject(ODataParserService.name)
    protected oDataParser: ODataParserService,

    @inject(ODataCacheService.name)
    protected oDataCache: ODataCacheService,

    @inject('YourRepository')
    private yourRepository: IYourRepository,
  ) {
    super(oDataParser, oDataCache)
  }

  async execute(filters: ListYourEntityODataFilters): Promise<IResult<IPaginationResult<YourEntity>>> {
    const { oDataQuery, userId } = filters

    return this.handleWithCache(
      'yourEntity',
      oDataQuery!,
      userId,
      async () => {
        // Your repository logic here
        const result = await this.yourRepository.findWithFilters({})
        return result
      }
    )
  }
}
```

### Step 2: Create OData Controller

```typescript
import { Request, Response } from 'express'
import { inject, injectable } from 'tsyringe'
import ListYourEntityODataUseCase from '../../useCases/listYourEntityOData/ListYourEntityODataUseCase'
import IController from '@shared/useCases/IController'

@injectable()
export default class ListYourEntityODataController implements IController {
  constructor(
    @inject(ListYourEntityODataUseCase.name)
    private listYourEntityODataUseCase: ListYourEntityODataUseCase,
  ) {}

  async handle(req: Request, res: Response): Promise<Response> {
    const oDataQuery = req.oDataQuery
    const userId = (req as any).user?.id

    const result = await this.listYourEntityODataUseCase.execute({
      oDataQuery,
      userId
    })

    if (!result.success) {
      return res.status(400).json(result)
    }

    if (oDataQuery?.count) {
      return res.json({
        '@odata.count': result.data?.total || 0
      })
    }

    return res.json(result)
  }
}
```

### Step 3: Create OData Routes

```typescript
import { Router } from 'express'
import { authenticateJWT } from '@shared/http/middlewares/auth.middleware'
import ODataMiddleware from '@shared/services/ODataMiddleware'
import ListYourEntityODataController from '../controllers/ListYourEntityODataController'

const yourEntityODataRouter = Router()
const listYourEntityODataController = new ListYourEntityODataController()

yourEntityODataRouter.use(authenticateJWT)
yourEntityODataRouter.use(ODataMiddleware.execute)

yourEntityODataRouter.get(
  '/',
  listYourEntityODataController.handle.bind(listYourEntityODataController)
)

export { yourEntityODataRouter }
```

### Step 4: Update Module Index

```typescript
export * from './http/routes/yourEntity.routes'
export * from './http/routes/yourEntityOData.routes'  // Add this
export * from './useCases/listYourEntityOData/ListYourEntityODataUseCase'  // Add this
```

## 🔍 Supported Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `eq` | Equal | `name eq 'Electronics'` |
| `ne` | Not Equal | `isActive ne false` |
| `gt` | Greater Than | `price gt 100` |
| `ge` | Greater Than or Equal | `quantity ge 10` |
| `lt` | Less Than | `price lt 50` |
| `le` | Less Than or Equal | `price le 100` |
| `contains` | Contains | `contains(name, 'tron')` |
| `startswith` | Starts With | `startswith(name, 'Ele')` |
| `endswith` | Ends With | `endswith(name, 'ics')` |
| `in` | In List | `category in ('A','B','C')` |
| `nin` | Not In List | `status nin ('deleted','archived')` |

## 💡 Best Practices

### 1. Caching Strategy

- Enable caching for read-heavy endpoints
- Disable caching for real-time data
- Use `$count` queries have shorter TTL

### 2. Performance

- Use `$select` to reduce data transfer
- Implement pagination with `$top` and `$skip`
- Index frequently filtered fields
- Monitor query complexity

### 3. Security

- Always use authentication middleware
- Validate OData queries before processing
- Limit `$top` values to prevent DoS
- Sanitize field names

### 4. Error Handling

- Return meaningful error messages
- Log complex queries for debugging
- Handle parsing errors gracefully

## 🧪 Testing

### Example Test

```bash
# Test OData parsing
curl -X GET "http://localhost:3000/api/categories/odata?$filter=name eq 'Electronics'" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test pagination
curl -X GET "http://localhost:3000/api/categories/odata?$top=10&$skip=20" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test count
curl -X GET "http://localhost:3000/api/categories/odata?$count=true" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📊 Performance Metrics

### Caching Statistics

```typescript
GET /api/categories/odata/stats
```

Returns cache hit rate, size, and performance metrics.

### Query Complexity

The system automatically detects complex queries:
- Multiple filters (> 3)
- Deep filtering (nested fields)
- Expands with relations
- Large skip values (> 100)

Complex queries receive extended cache TTL.

## 🔗 Related Documentation

- [OData Protocol](https://www.odata.org/)
- [TypeORM Documentation](https://typeorm.io/)
- [Express.js Middleware](https://expressjs.com/en/guide/writing-middleware.html)

## 📝 Changelog

### Version 1.0.0 (2025-11-27)
- Initial OData implementation
- Parser for $filter, $select, $orderby, $top, $skip
- Caching service
- Middleware integration
- Categories module integration

## 🤝 Contributing

When adding OData support to a new module:

1. Follow the implementation guide above
2. Add comprehensive tests
3. Update this documentation
4. Update module index.ts
5. Register in shared container (if needed)

---

**Author:** SWE Principal
**Last Updated:** 2025-11-27
**Version:** 1.0.0
