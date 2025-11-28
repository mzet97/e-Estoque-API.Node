import CacheService, { CacheStrategy, CacheConfig } from './CacheService'

// Cache configurations for different bounded contexts
export const cacheConfigs = {
  // Products Cache Configuration
  products: {
    ttl: 1800, // 30 minutes
    prefix: 'products:',
    strategies: [
      { name: 'product_detail', type: 'cache-aside', ttl: 3600 },
      { name: 'product_list', type: 'cache-aside', ttl: 900 }, // 15 minutes
      { name: 'product_search', type: 'cache-aside', ttl: 600 }, // 10 minutes
      { name: 'category_products', type: 'cache-aside', ttl: 1800 }
    ]
  },

  // Customers Cache Configuration
  customers: {
    ttl: 3600, // 1 hour
    prefix: 'customers:',
    strategies: [
      { name: 'customer_detail', type: 'cache-aside', ttl: 7200 }, // 2 hours
      { name: 'customer_list', type: 'cache-aside', ttl: 1800 }, // 30 minutes
      { name: 'customer_analytics', type: 'write-through', ttl: 14400 }, // 4 hours
      { name: 'customer_search', type: 'cache-aside', ttl: 900 }
    ]
  },

  // Sales Cache Configuration
  sales: {
    ttl: 3600, // 1 hour
    prefix: 'sales:',
    strategies: [
      { name: 'sale_detail', type: 'cache-aside', ttl: 7200 },
      { name: 'sale_list', type: 'cache-aside', ttl: 1800 },
      { name: 'sales_analytics', type: 'write-through', ttl: 21600 }, // 6 hours
      { name: 'daily_reports', type: 'write-behind', ttl: 86400 } // 24 hours
    ]
  },

  // Inventory Cache Configuration
  inventory: {
    ttl: 900, // 15 minutes
    prefix: 'inventory:',
    strategies: [
      { name: 'stock_levels', type: 'cache-aside', ttl: 600 }, // 10 minutes
      { name: 'low_stock_alerts', type: 'write-through', ttl: 3600 },
      { name: 'product_availability', type: 'cache-aside', ttl: 300 }, // 5 minutes
      { name: 'stock_movements', type: 'write-through', ttl: 1800 }
    ]
  },

  // Companies Cache Configuration
  companies: {
    ttl: 7200, // 2 hours
    prefix: 'companies:',
    strategies: [
      { name: 'company_detail', type: 'cache-aside', ttl: 14400 }, // 4 hours
      { name: 'company_list', type: 'cache-aside', ttl: 3600 },
      { name: 'company_settings', type: 'cache-aside', ttl: 21600 } // 6 hours
    ]
  },

  // Users Cache Configuration
  users: {
    ttl: 3600, // 1 hour
    prefix: 'users:',
    strategies: [
      { name: 'user_profile', type: 'cache-aside', ttl: 7200 },
      { name: 'user_permissions', type: 'cache-aside', ttl: 14400 },
      { name: 'user_activity', type: 'write-through', ttl: 21600 }
    ]
  },

  // Dashboard Cache Configuration
  dashboard: {
    ttl: 1800, // 30 minutes
    prefix: 'dashboard:',
    strategies: [
      { name: 'metrics_summary', type: 'refresh-ahead', ttl: 3600 },
      { name: 'recent_activities', type: 'cache-aside', ttl: 900 },
      { name: 'chart_data', type: 'write-behind', ttl: 3600 },
      { name: 'notifications', type: 'cache-aside', ttl: 600 }
    ]
  },

  // Analytics Cache Configuration
  analytics: {
    ttl: 3600, // 1 hour
    prefix: 'analytics:',
    strategies: [
      { name: 'daily_stats', type: 'write-through', ttl: 86400 }, // 24 hours
      { name: 'weekly_reports', type: 'write-through', ttl: 604800 }, // 7 days
      { name: 'monthly_reports', type: 'write-through', ttl: 2592000 }, // 30 days
      { name: 'real_time_metrics', type: 'cache-aside', ttl: 60 } // 1 minute
    ]
  },

  // Search Cache Configuration
  search: {
    ttl: 600, // 10 minutes
    prefix: 'search:',
    strategies: [
      { name: 'search_results', type: 'cache-aside', ttl: 300 },
      { name: 'autocomplete', type: 'cache-aside', ttl: 1800 },
      { name: 'faceted_search', type: 'cache-aside', ttl: 900 }
    ]
  }
}

export function createCacheConfig(): CacheConfig {
  return {
    defaultTTL: 3600, // 1 hour default
    contextConfigs: cacheConfigs
  }
}

// Cache invalidation rules by context
export const cacheInvalidationRules = {
  products: [
    {
      pattern: 'products:*',
      reason: 'Product CRUD operations',
      batchSize: 100
    },
    {
      pattern: 'search:*',
      reason: 'Product changes affect search',
      batchSize: 50
    }
  ],

  customers: [
    {
      pattern: 'customers:*',
      reason: 'Customer CRUD operations',
      batchSize: 100
    },
    {
      pattern: 'analytics:customer:*',
      reason: 'Customer analytics updated',
      batchSize: 50
    }
  ],

  sales: [
    {
      pattern: 'sales:*',
      reason: 'Sale CRUD operations',
      batchSize: 100
    },
    {
      pattern: 'inventory:*',
      reason: 'Sale affects inventory',
      batchSize: 50
    },
    {
      pattern: 'analytics:sales:*',
      reason: 'Sales analytics updated',
      batchSize: 30
    },
    {
      pattern: 'dashboard:*',
      reason: 'Dashboard metrics changed',
      batchSize: 20
    }
  ],

  inventory: [
    {
      pattern: 'inventory:*',
      reason: 'Stock level changes',
      batchSize: 100
    },
    {
      pattern: 'products:*',
      reason: 'Inventory affects product availability',
      batchSize: 50
    }
  ],

  companies: [
    {
      pattern: 'companies:*',
      reason: 'Company CRUD operations',
      batchSize: 50
    },
    {
      pattern: 'users:company:*',
      reason: 'Company changes affect users',
      batchSize: 30
    }
  ],

  users: [
    {
      pattern: 'users:*',
      reason: 'User CRUD operations',
      batchSize: 100
    },
    {
      pattern: 'customers:*',
      reason: 'User changes may affect customers',
      batchSize: 50
    }
  ],

  dashboard: [
    {
      pattern: 'dashboard:*',
      reason: 'Dashboard data refreshed',
      batchSize: 50,
      delay: 1000 // 1 second delay
    },
    {
      pattern: 'analytics:*',
      reason: 'Analytics data updated',
      batchSize: 30,
      delay: 500
    }
  ],

  analytics: [
    {
      pattern: 'analytics:*',
      reason: 'Analytics data updated',
      batchSize: 20,
      delay: 2000
    },
    {
      pattern: 'dashboard:*',
      reason: 'Analytics affects dashboard',
      batchSize: 10,
      delay: 1500
    }
  ]
}

// Cache warming strategies
export const cacheWarmingStrategies = {
  products: [
    { key: 'featured_products', loader: () => Promise.resolve([]) },
    { key: 'popular_categories', loader: () => Promise.resolve([]) }
  ],

  customers: [
    { key: 'recent_customers', loader: () => Promise.resolve([]) },
    { key: 'customer_segments', loader: () => Promise.resolve({}) }
  ],

  sales: [
    { key: 'recent_sales', loader: () => Promise.resolve([]) },
    { key: 'today_stats', loader: () => Promise.resolve({}) }
  ],

  inventory: [
    { key: 'low_stock_products', loader: () => Promise.resolve([]) },
    { key: 'popular_products', loader: () => Promise.resolve([]) }
  ],

  dashboard: [
    { key: 'overview_metrics', loader: () => Promise.resolve({}) },
    { key: 'quick_stats', loader: () => Promise.resolve({}) },
    { key: 'recent_activities', loader: () => Promise.resolve([]) }
  ],

  analytics: [
    { key: 'daily_summary', loader: () => Promise.resolve({}) },
    { key: 'top_products', loader: () => Promise.resolve([]) }
  ]
}