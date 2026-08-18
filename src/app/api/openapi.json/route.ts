import { NextResponse } from 'next/server';

export async function GET() {
  const openApiSpec = {
    openapi: '3.1.0',
    info: {
      title: 'MyCashier POS & Table Self-Ordering PWA API',
      version: '1.0.0',
      description: `
**MyCashier API Reference** — Documentation for the Online POS & Table Self-Ordering PWA platform.

### Core Features Covered:
- 🔑 **Authentication & Role-Based Access Control (RBAC)** (JWT Session & Role Verification)
- 🍽️ **Menu Master & Catalog Management** (CRUD, Variants, Availability Toggling)
- 📋 **Order Management & Real-time SSE Stream** (Table Self-Ordering, Split-Bill, Cashier Queue)
- 📦 **Raw Material Inventory & Inter-Branch Transfers** (Stock Tracking & Atomic Multi-Branch Moves)
- 💰 **Dynamic Tax Engine & Store Configuration** (PB1 Resto Tax, Service Charge, Cash Rounding)
- 🛡️ **Security Audit Logs & Activity Trail** (Mutation Logging & Field-Level Diffs)
- 🤖 **Executive AI & Smart Recommendations** (Daily Sales Briefing & Cart Upselling)
- 🏬 **Multi-Tenant SaaS & Multi-Branch Resto Selector**
      `,
      contact: {
        name: 'MyCashier Developer Team',
        url: 'https://github.com/OpikSendy/mycashier',
      },
    },
    servers: [
      {
        url: '/',
        description: 'Current Environment Host',
      },
    ],
    tags: [
      { name: 'Authentication', description: 'JWT Session authentication & PIN login per role' },
      { name: 'Menu Catalog', description: 'Master menu CRUD, category presets & stock availability' },
      { name: 'Orders & Realtime', description: 'Order placement, status updates & Server-Sent Events stream' },
      { name: 'Inventory & Transfers', description: 'Ingredient stock tracking & inter-branch stock transfers' },
      { name: 'Store Settings & Tax', description: 'PB1 tax %, Service Charge %, and store branding' },
      { name: 'Analytics & AI', description: 'Omzet trends, Executive AI Sales Briefing & AI Chat assistant' },
      { name: 'Vouchers & Loyalty', description: 'Promo coupon validation & Customer Loyalty points' },
      { name: 'Tenants & Branches', description: 'Multi-tenant SaaS stores & Multi-branch resto switcher' },
      { name: 'Audit Logs', description: 'Field-level mutation logs & admin security audit trail' },
    ],
    paths: {
      '/api/auth/login': {
        post: {
          tags: ['Authentication'],
          summary: 'User / Cashier PIN Login',
          description: 'Authenticate user via Email/Password or 4-6 digit PIN code and set HTTP-only JWT cookie.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    role: { type: 'string', enum: ['OWNER', 'MANAGER', 'CASHIER', 'KITCHEN'], example: 'CASHIER' },
                    pin: { type: 'string', example: '1234' },
                    email: { type: 'string', example: 'admin@mycashier.com' },
                    password: { type: 'string', example: 'secret123' },
                  },
                  required: ['role'],
                },
              },
            },
          },
          responses: {
            200: { description: 'Authentication successful, JWT token set in cookie.' },
            401: { description: 'Invalid PIN or credentials.' },
          },
        },
      },
      '/api/auth/me': {
        get: {
          tags: ['Authentication'],
          summary: 'Get Active User Session',
          description: 'Retrieve current authenticated session details from JWT cookie.',
          responses: {
            200: { description: 'Active session user object.' },
            401: { description: 'No active session token found.' },
          },
        },
      },
      '/api/auth/logout': {
        post: {
          tags: ['Authentication'],
          summary: 'Logout Active User',
          description: 'Clear active HTTP-only JWT authentication cookie.',
          responses: {
            200: { description: 'Logged out successfully.' },
          },
        },
      },
      '/api/menu': {
        get: {
          tags: ['Menu Catalog'],
          summary: 'Get All Menu Items',
          description: 'Fetch complete active menu catalog list with category & stock status.',
          responses: {
            200: { description: 'Array of menu items.' },
          },
        },
        post: {
          tags: ['Menu Catalog'],
          summary: 'Create New Menu Item',
          description: 'Add a new product to master catalog (Admin/Owner only).',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', example: 'Kopi Susu Gula Aren' },
                    price: { type: 'number', example: 22000 },
                    category: { type: 'string', enum: ['food', 'drinks', 'dessert', 'snack'], example: 'drinks' },
                    subCategory: { type: 'string', example: 'Coffee' },
                    description: { type: 'string', example: 'Espresso dengan susu segar & gula aren organik.' },
                    image: { type: 'string', example: 'https://images.unsplash.com/photo-1541167760496-1628856ab772' },
                  },
                  required: ['name', 'price', 'category'],
                },
              },
            },
          },
          responses: {
            201: { description: 'Menu item created successfully.' },
            403: { description: 'Unauthorized role.' },
          },
        },
      },
      '/api/menu/{id}': {
        put: {
          tags: ['Menu Catalog'],
          summary: 'Update Full Menu Item',
          description: 'Update entire details of an existing menu item by ID.',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' }, example: 'm1' },
          ],
          responses: {
            200: { description: 'Menu item updated.' },
          },
        },
        patch: {
          tags: ['Menu Catalog'],
          summary: 'Toggle Availability Status',
          description: 'Quick toggle product availability (`isAvailable: true/false`).',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          ],
          responses: {
            200: { description: 'Availability status updated.' },
          },
        },
        delete: {
          tags: ['Menu Catalog'],
          summary: 'Delete Menu Item',
          description: 'Remove item permanently from catalog.',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          ],
          responses: {
            200: { description: 'Menu item deleted.' },
          },
        },
      },
      '/api/orders': {
        get: {
          tags: ['Orders & Realtime'],
          summary: 'Get All Orders',
          description: 'Retrieve order queue for Cashier POS and KDS views.',
          responses: {
            200: { description: 'List of order records.' },
          },
        },
        post: {
          tags: ['Orders & Realtime'],
          summary: 'Submit Table Self-Order',
          description: 'Submit customer order from table self-ordering PWA.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    tableNumber: { type: 'string', example: 'Meja 04' },
                    customerName: { type: 'string', example: 'Budi Santoso' },
                    paymentMethod: { type: 'string', enum: ['CASH', 'QRIS', 'DEBIT'], example: 'QRIS' },
                    items: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          productId: { type: 'string', example: 'm1' },
                          productName: { type: 'string', example: 'Bakmi Ayam Jamur' },
                          price: { type: 'number', example: 35000 },
                          quantity: { type: 'number', example: 2 },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Order submitted successfully.' },
          },
        },
      },
      '/api/orders/{id}': {
        patch: {
          tags: ['Orders & Realtime'],
          summary: 'Update Order Kitchen / Payment Status',
          description: 'Update status (`PENDING` ➔ `COOKING` ➔ `READY` ➔ `SERVED`) or payment status (`PAID`).',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          ],
          responses: {
            200: { description: 'Order status updated.' },
          },
        },
      },
      '/api/orders/stream': {
        get: {
          tags: ['Orders & Realtime'],
          summary: 'Live Order Server-Sent Events (SSE) Stream',
          description: 'Real-time event stream (`text/event-stream`) notifying Kitchen & Cashier of incoming orders instantly.',
          responses: {
            200: { description: 'SSE Event Stream Connection Established.' },
          },
        },
      },
      '/api/inventory': {
        get: {
          tags: ['Inventory & Transfers'],
          summary: 'Get Raw Material Inventory',
          description: 'Fetch ingredient stock levels, unit measures, and low-stock warning thresholds.',
          responses: {
            200: { description: 'Inventory items list.' },
          },
        },
      },
      '/api/inventory/transfers': {
        get: {
          tags: ['Inventory & Transfers'],
          summary: 'Get Inter-Branch Stock Transfers',
          description: 'Fetch transfer shipments between resto branches (Jakarta, Bandung, Bali).',
          responses: {
            200: { description: 'Stock transfer shipments list.' },
          },
        },
        post: {
          tags: ['Inventory & Transfers'],
          summary: 'Request Inter-Branch Stock Transfer',
          description: 'Initiate a new inventory transfer shipment request from Branch A to Branch B.',
          responses: {
            201: { description: 'Transfer request created.' },
          },
        },
      },
      '/api/store-settings': {
        get: {
          tags: ['Store Settings & Tax'],
          summary: 'Get Store Configuration',
          description: 'Read store profile, tax rates (PB1 %), service charge %, and cash rounding rules.',
          responses: {
            200: { description: 'Store settings object.' },
          },
        },
        put: {
          tags: ['Store Settings & Tax'],
          summary: 'Update Store Configuration & Tax Rules',
          description: 'Update tax percentage, service charge percentage, and rounding rules.',
          responses: {
            200: { description: 'Store settings updated.' },
          },
        },
      },
      '/api/audit-logs': {
        get: {
          tags: ['Audit Logs'],
          summary: 'Fetch Security Audit Logs',
          description: 'Read timestamped administrative activity logs with payload diffs.',
          responses: {
            200: { description: 'List of audit log records.' },
          },
        },
      },
      '/api/ai/briefing': {
        get: {
          tags: ['Analytics & AI'],
          summary: 'Get Executive AI Daily Sales Briefing',
          description: 'Generate AI sales insights & markdown executive briefing for store managers.',
          responses: {
            200: { description: 'AI Executive Briefing Report.' },
          },
        },
      },
      '/api/chat': {
        post: {
          tags: ['Analytics & AI'],
          summary: 'Ask MyCashier AI Assistant',
          description: 'Send query to AI Chat Assistant via OpenRouter API.',
          responses: {
            200: { description: 'AI Assistant text response.' },
          },
        },
      },
    },
  };

  return NextResponse.json(openApiSpec);
}
