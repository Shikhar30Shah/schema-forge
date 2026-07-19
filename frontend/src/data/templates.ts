// Schema templates data for quick loading
export type SchemaTemplateCategory = 'basic' | 'auth' | 'ecommerce' | 'blog' | 'database';

export interface SchemaTemplate {
  id: string;
  name: string;
  description: string;
  category: SchemaTemplateCategory;
  schema?: Record<string, unknown>;
}

export const templateCategories: SchemaTemplateCategory[] = ['basic', 'auth', 'ecommerce', 'blog', 'database'];

export const schemaTemplates: SchemaTemplate[] = [
  {
    id: 'basic-crud',
    name: 'Basic CRUD',
    description: 'Basic CRUD operations with user management',
    category: 'basic',
    schema: {
      users: {
        id: 'integer',
        name: 'string',
        email: 'string',
        created_at: 'timestamp'
      }
    }
  },
  {
    id: 'auth-system',
    name: 'Authentication System',
    description: 'User authentication and management system',
    category: 'auth',
    schema: {
      users: {
        id: 'integer',
        email: 'string',
        password_hash: 'string',
        name: 'string',
        role: 'string',
        created_at: 'timestamp',
        updated_at: 'timestamp'
      },
      sessions: {
        id: 'integer',
        user_id: 'integer',
        token: 'string',
        expires_at: 'timestamp'
      }
    }
  },
  {
    id: 'ecommerce-core',
    name: 'E-commerce Core',
    category: 'ecommerce',
    description: 'Basic e-commerce functionality',
    schema: {
      products: {
        id: 'integer',
        name: 'string',
        price: 'decimal',
        description: 'text',
        category_id: 'integer',
        stock: 'integer',
        created_at: 'timestamp'
      },
      orders: {
        id: 'integer',
        user_id: 'integer',
        total_amount: 'decimal',
        status: 'string',
        created_at: 'timestamp'
      },
      order_items: {
        id: 'integer',
        order_id: 'integer',
        product_id: 'integer',
        quantity: 'integer',
        price: 'decimal'
      }
    }
  },
  {
    id: 'blog-engine',
    name: 'Blog Engine',
    description: 'Basic blog engine',
    category: 'blog',
    schema: {
      posts: {
        id: 'integer',
        title: 'string',
        content: 'text',
        author_id: 'integer',
        published: 'boolean',
        created_at: 'timestamp',
        updated_at: 'timestamp'
      },
      comments: {
        id: 'integer',
        post_id: 'integer',
        author_name: 'string',
        content: 'text',
        created_at: 'timestamp'
      },
      categories: {
        id: 'integer',
        name: 'string',
        description: 'text'
      }
    }
  },
  {
    id: 'database-schema',
    name: 'Database Schema',
    description: 'Database schema with relations',
    category: 'database',
    schema: {
      users: {
        id: 'integer',
        username: 'string',
        email: 'string',
        password_hash: 'string',
        profile_id: 'integer',
        created_at: 'timestamp',
        updated_at: 'timestamp'
      },
      profiles: {
        id: 'integer',
        user_id: 'integer',
        first_name: 'string',
        last_name: 'string',
        bio: 'text',
        avatar_url: 'string'
      },
      posts: {
        id: 'integer',
        user_id: 'integer',
        title: 'string',
        content: 'text',
        published_at: 'timestamp'
      },
      comments: {
        id: 'integer',
        post_id: 'integer',
        user_id: 'integer',
        content: 'text',
        created_at: 'timestamp'
      }
    }
  },
];

export function getTemplateById(id: string): SchemaTemplate | undefined {
  return schemaTemplates.find(t => t.id === id);
}

export function getTemplatesByCategory(category: SchemaTemplateCategory): SchemaTemplate[] {
  return schemaTemplates.filter(t => t.category === category);
}