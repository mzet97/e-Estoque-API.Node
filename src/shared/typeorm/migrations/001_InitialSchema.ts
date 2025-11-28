/**
 * Initial Database Schema Migration
 * Version: 1.0.0
 * Description: Create the initial database schema for E-Estoque
 */

import { DataSource } from 'typeorm';
import { Logger } from 'winston';

export const initialSchemaMigration = {
  id: '001_initial_schema',
  name: 'Initial Database Schema',
  version: '1.0.0',
  description: 'Create the initial database schema including users, products, orders, and inventory tables',
  checksum: '',
  createdAt: new Date(),
  executedAt: undefined,

  async up(dataSource: DataSource, logger: Logger): Promise<void> {
    logger.info('Creating initial database schema...');

    const queries = [
      // Users table
      `
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email VARCHAR(255) UNIQUE NOT NULL,
          name VARCHAR(255) NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          role VARCHAR(50) NOT NULL DEFAULT 'user',
          is_active BOOLEAN NOT NULL DEFAULT true,
          email_verified BOOLEAN NOT NULL DEFAULT false,
          email_verification_token VARCHAR(255),
          password_reset_token VARCHAR(255),
          password_reset_expires TIMESTAMP WITH TIME ZONE,
          last_login TIMESTAMP WITH TIME ZONE,
          preferences JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `,

      // Categories table
      `
        CREATE TABLE IF NOT EXISTS categories (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          description TEXT,
          parent_id UUID REFERENCES categories(id),
          is_active BOOLEAN NOT NULL DEFAULT true,
          sort_order INTEGER DEFAULT 0,
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `,

      // Products table
      `
        CREATE TABLE IF NOT EXISTS products (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          description TEXT,
          sku VARCHAR(100) UNIQUE NOT NULL,
          price DECIMAL(10,2) NOT NULL,
          cost DECIMAL(10,2),
          category_id UUID NOT NULL REFERENCES categories(id),
          is_active BOOLEAN NOT NULL DEFAULT true,
          is_digital BOOLEAN NOT NULL DEFAULT false,
          weight DECIMAL(8,2),
          dimensions JSONB DEFAULT '{}',
          images JSONB DEFAULT '[]',
          metadata JSONB DEFAULT '{}',
          seo_title VARCHAR(255),
          seo_description TEXT,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `,

      // Inventory table
      `
        CREATE TABLE IF NOT EXISTS inventory (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
          current_stock INTEGER NOT NULL DEFAULT 0,
          reserved_stock INTEGER NOT NULL DEFAULT 0,
          minimum_stock INTEGER NOT NULL DEFAULT 0,
          maximum_stock INTEGER,
          reorder_point INTEGER,
          reorder_quantity INTEGER,
          location VARCHAR(100),
          batch_number VARCHAR(100),
          expiry_date DATE,
          last_restocked_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(product_id, batch_number)
        );
      `,

      // Orders table
      `
        CREATE TABLE IF NOT EXISTS orders (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id),
          order_number VARCHAR(50) UNIQUE NOT NULL,
          status VARCHAR(50) NOT NULL DEFAULT 'pending',
          total_amount DECIMAL(10,2) NOT NULL,
          subtotal DECIMAL(10,2) NOT NULL,
          tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
          shipping_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
          discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
          currency VARCHAR(3) NOT NULL DEFAULT 'USD',
          payment_status VARCHAR(50) NOT NULL DEFAULT 'pending',
          shipping_status VARCHAR(50) NOT NULL DEFAULT 'pending',
          shipping_address JSONB,
          billing_address JSONB,
          payment_method VARCHAR(100),
          payment_reference VARCHAR(255),
          notes TEXT,
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `,

      // Order items table
      `
        CREATE TABLE IF NOT EXISTS order_items (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
          product_id UUID NOT NULL REFERENCES products(id),
          quantity INTEGER NOT NULL,
          unit_price DECIMAL(10,2) NOT NULL,
          total_price DECIMAL(10,2) NOT NULL,
          product_snapshot JSONB NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `,

      // Suppliers table
      `
        CREATE TABLE IF NOT EXISTS suppliers (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          contact_person VARCHAR(255),
          email VARCHAR(255),
          phone VARCHAR(50),
          address JSONB,
          is_active BOOLEAN NOT NULL DEFAULT true,
          payment_terms VARCHAR(100),
          delivery_time INTEGER, -- in days
          notes TEXT,
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `,

      // Audit log table
      `
        CREATE TABLE IF NOT EXISTS audit_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          table_name VARCHAR(100) NOT NULL,
          record_id UUID NOT NULL,
          action VARCHAR(50) NOT NULL,
          old_values JSONB,
          new_values JSONB,
          user_id UUID REFERENCES users(id),
          ip_address INET,
          user_agent TEXT,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `,

      // Sessions table for Redis-like session storage
      `
        CREATE TABLE IF NOT EXISTS sessions (
          id VARCHAR(255) PRIMARY KEY,
          user_id UUID REFERENCES users(id),
          data JSONB NOT NULL DEFAULT '{}',
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `,

      // Create indexes for better performance
      `
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
        CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
        CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
        CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
        CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
        CREATE INDEX IF NOT EXISTS idx_inventory_product_id ON inventory(product_id);
        CREATE INDEX IF NOT EXISTS idx_inventory_current_stock ON inventory(current_stock);
        CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
        CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
        CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
        CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
        CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
        CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON audit_logs(table_name, record_id);
        CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
        CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
        CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
      `,

      // Create triggers for updated_at timestamps
      `
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
        END;
        $$ language 'plpgsql';
      `,

      `
        CREATE TRIGGER update_users_updated_at 
        BEFORE UPDATE ON users 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      `,

      `
        CREATE TRIGGER update_categories_updated_at 
        BEFORE UPDATE ON categories 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      `,

      `
        CREATE TRIGGER update_products_updated_at 
        BEFORE UPDATE ON products 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      `,

      `
        CREATE TRIGGER update_inventory_updated_at 
        BEFORE UPDATE ON inventory 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      `,

      `
        CREATE TRIGGER update_orders_updated_at 
        BEFORE UPDATE ON orders 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      `,

      `
        CREATE TRIGGER update_suppliers_updated_at 
        BEFORE UPDATE ON suppliers 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      `,

      // Create sequence for order numbers
      `
        CREATE SEQUENCE IF NOT EXISTS order_number_seq 
        START 1000 
        INCREMENT 1 
        OWNED BY orders.order_number;
      `,

      // Create function to generate order numbers
      `
        CREATE OR REPLACE FUNCTION generate_order_number()
        RETURNS TEXT AS $$
        DECLARE
          next_number INTEGER;
          order_num TEXT;
        BEGIN
          SELECT nextval('order_number_seq') INTO next_number;
          order_num := 'ORD-' || LPAD(next_number::TEXT, 6, '0');
          RETURN order_num;
        END;
        $$ LANGUAGE plpgsql;
      `,

      // Create trigger to auto-generate order numbers
      `
        CREATE OR REPLACE FUNCTION set_order_number()
        RETURNS TRIGGER AS $$
        BEGIN
          IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
            NEW.order_number := generate_order_number();
          END IF;
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `,

      `
        CREATE TRIGGER set_order_number_trigger
        BEFORE INSERT ON orders
        FOR EACH ROW EXECUTE FUNCTION set_order_number();
      `
    ];

    // Execute all queries
    for (const query of queries) {
      try {
        await dataSource.query(query);
        logger.debug('Query executed successfully');
      } catch (error) {
        logger.error('Failed to execute query:', error);
        throw error;
      }
    }

    // Insert default admin user
    const adminUserQuery = `
      INSERT INTO users (email, name, password_hash, role, email_verified, preferences)
      VALUES (
        'admin@eestoque.com',
        'System Administrator',
        '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewfhP3Xo0j9Z4W8W', -- password: admin123
        'admin',
        true,
        '{"theme": "dark", "notifications": true}'::jsonb
      ) ON CONFLICT (email) DO NOTHING;
    `;

    await dataSource.query(adminUserQuery);

    logger.info('Initial database schema created successfully');
  },

  async down(dataSource: DataSource, logger: Logger): Promise<void> {
    logger.info('Rolling back initial database schema...');

    const rollbackQueries = [
      // Drop triggers
      'DROP TRIGGER IF EXISTS set_order_number_trigger ON orders;',
      'DROP FUNCTION IF EXISTS set_order_number();',
      'DROP FUNCTION IF EXISTS generate_order_number();',
      'DROP SEQUENCE IF EXISTS order_number_seq;',
      'DROP TRIGGER IF EXISTS update_suppliers_updated_at ON suppliers;',
      'DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;',
      'DROP TRIGGER IF EXISTS update_inventory_updated_at ON inventory;',
      'DROP TRIGGER IF EXISTS update_products_updated_at ON products;',
      'DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;',
      'DROP TRIGGER IF EXISTS update_users_updated_at ON users;',
      'DROP FUNCTION IF EXISTS update_updated_at_column();',

      // Drop tables in reverse dependency order
      'DROP TABLE IF EXISTS order_items;',
      'DROP TABLE IF EXISTS orders;',
      'DROP TABLE IF EXISTS audit_logs;',
      'DROP TABLE IF EXISTS sessions;',
      'DROP TABLE IF EXISTS suppliers;',
      'DROP TABLE IF EXISTS inventory;',
      'DROP TABLE IF EXISTS products;',
      'DROP TABLE IF EXISTS categories;',
      'DROP TABLE IF EXISTS users;'
    ];

    // Execute rollback queries
    for (const query of rollbackQueries) {
      try {
        await dataSource.query(query);
        logger.debug('Rollback query executed successfully');
      } catch (error) {
        logger.error('Failed to execute rollback query:', error);
        throw error;
      }
    }

    logger.info('Initial database schema rolled back successfully');
  }
};