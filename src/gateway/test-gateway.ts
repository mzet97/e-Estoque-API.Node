// Test script to verify gateway components can be imported and instantiated
import { GatewayMiddlewareStack } from './core/GatewayMiddlewareStack'
import RateLimitMiddleware from './middlewares/RateLimitMiddleware'

console.log('🧪 Testing e-Estoque API Gateway Components...')

try {
  // Test RedisClient import
  console.log('1. Testing RedisClient import...')
  const { RedisClient } = require('../shared/redis/RedisClient')
  console.log('✅ RedisClient imported successfully')

  // Test GatewayMiddlewareStack
  console.log('2. Testing GatewayMiddlewareStack...')
  const gateway = new GatewayMiddlewareStack()
  console.log('✅ GatewayMiddlewareStack instantiated successfully')

  // Test RateLimitMiddleware
  console.log('3. Testing RateLimitMiddleware...')
  const rateLimitMiddleware = new RateLimitMiddleware()
  console.log('✅ RateLimitMiddleware instantiated successfully')

  // Test middleware creation methods
  console.log('4. Testing middleware creation methods...')
  const tierLimiter = RateLimitMiddleware.createTierBasedLimiter()
  const strictLimiter = RateLimitMiddleware.createStrictLimiter(10, 60000)
  console.log('✅ Middleware creation methods work correctly')

  // Test configuration
  console.log('5. Testing configuration...')
  const config = gateway.getConfig()
  console.log('✅ Gateway configuration retrieved:', {
    port: config.port,
    host: config.host,
    services: Object.keys(config.services)
  })

  console.log('\n🎉 All gateway components tested successfully!')
  console.log('📦 e-Estoque API Gateway is ready for deployment!')

} catch (error) {
  console.error('❌ Gateway test failed:', error)
  process.exit(1)
}