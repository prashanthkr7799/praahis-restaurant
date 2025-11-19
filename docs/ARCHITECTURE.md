# 🏗️ Praahis Architecture Documentation

## Overview
Praahis is a modern, domain-driven restaurant SaaS platform built with React, Vite, and Supabase. This document provides a comprehensive overview of the application architecture, design decisions, and implementation patterns.

---

## 📋 Table of Contents
1. [Architecture Pattern](#architecture-pattern)
2. [Folder Structure](#folder-structure)
3. [Domain Organization](#domain-organization)
4. [Communication Patterns](#communication-patterns)
5. [Technology Stack](#technology-stack)
6. [Design Principles](#design-principles)
7. [Security Architecture](#security-architecture)
8. [Data Flow](#data-flow)
9. [Deployment Architecture](#deployment-architecture)

---

## 🎯 Architecture Pattern

### Domain-Driven Design (DDD)

Praahis follows a **Domain-Driven Design** approach, organizing code around business domains rather than technical layers.

```
┌─────────────────────────────────────────────────┐
│             User Interface Layer                │
│  (React Components organized by User Role)      │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│           Business Domain Layer                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │Ordering  │ │Analytics │ │ Billing  │       │
│  └──────────┘ └──────────┘ └──────────┘       │
│  ┌──────────┐ ┌──────────┐                     │
│  │  Staff   │ │Notifications│                  │
│  └──────────┘ └──────────┘                     │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│         Shared Infrastructure Layer             │
│  (Utilities, Components, Contexts, Hooks)       │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│            Data Access Layer                    │
│  (Supabase Client, Database, Auth, Storage)     │
└─────────────────────────────────────────────────┘
```

### Why Domain-Driven Design?

**Benefits:**
- ✅ **Clear boundaries:** Each domain is self-contained with clear responsibilities
- ✅ **Scalability:** Easy to add new features within domains
- ✅ **Team collaboration:** Multiple teams can work on different domains
- ✅ **Maintainability:** Easy to locate and modify business logic
- ✅ **Testability:** Domains can be tested in isolation

---

## 📂 Folder Structure

### High-Level Structure

```
praahis/
├── src/
│   ├── domains/              # Business logic domains
│   │   ├── notifications/    # Notification system
│   │   ├── analytics/        # Reporting & charts
│   │   ├── staff/            # Employee management
│   │   ├── ordering/         # Order processing
│   │   └── billing/          # Payments & subscriptions
│   │
│   ├── shared/               # Shared infrastructure
│   │   ├── components/       # Reusable UI components
│   │   ├── layouts/          # Page layouts
│   │   ├── guards/           # Route protection
│   │   ├── contexts/         # Global state management
│   │   ├── hooks/            # Custom React hooks
│   │   └── utils/            # Utility functions
│   │
│   ├── pages/                # User interface pages
│   │   ├── customer/         # Customer-facing pages
│   │   ├── waiter/           # Waiter operations
│   │   ├── chef/             # Kitchen display
│   │   ├── manager/          # Restaurant management
│   │   ├── superadmin/       # Platform administration
│   │   ├── public/           # Marketing pages
│   │   └── utility/          # Support pages
│   │
│   ├── lib/                  # Legacy/external integrations
│   ├── constants/            # Application constants
│   └── assets/               # Static assets
│
├── database/                 # SQL schema & migrations
├── supabase/                 # Supabase functions
├── docs/                     # Documentation
└── public/                   # Public static files
```

### Domain Internal Structure

Each domain follows a consistent structure:

```
domain/
├── components/          # Domain-specific UI components
├── hooks/              # Domain-specific React hooks
├── utils/              # Domain utilities and helpers
├── events.js           # Domain event definitions
├── index.js            # Public API exports
└── README.md           # Domain documentation
```

---

## 🎯 Domain Organization

### 5 Core Business Domains

#### 1. **Notifications Domain** 🔔
**Responsibility:** Real-time notifications, alerts, in-app messaging

**Key Features:**
- Real-time notification delivery
- Notification badge management
- Notification history
- User preferences

**Public API:**
```javascript
import { NotificationBell, subscribeToNotifications } from '@domains/notifications';
```

**Database Tables:**
- `notifications`

---

#### 2. **Analytics Domain** 📊
**Responsibility:** Data visualization, reporting, business intelligence

**Key Features:**
- Revenue tracking
- Sales analytics
- Performance metrics
- Custom reports
- Data exports

**Public API:**
```javascript
import { 
  RevenueChart, 
  CategorySalesChart, 
  StatsCard 
} from '@domains/analytics';
```

**Database Tables:**
- Uses aggregated data from `orders`, `order_items`, `menu_items`

---

#### 3. **Staff Domain** 👥
**Responsibility:** Employee management, permissions, activity logging

**Key Features:**
- Staff CRUD operations
- Role-based access control
- Activity audit logging
- Permission management
- Shift tracking

**Public API:**
```javascript
import { 
  StaffForm, 
  hasPermission, 
  logActivity 
} from '@domains/staff';
```

**Database Tables:**
- `staff`
- `activity_logs`

---

#### 4. **Ordering Domain** 🍽️
**Responsibility:** Menu, cart, orders, order fulfillment

**Key Features:**
- Menu browsing
- Cart management
- Order placement
- Real-time order tracking
- Order status management
- Kitchen workflow

**Public API:**
```javascript
import { 
  MenuItem, 
  CartSummary, 
  OrderCard, 
  useRealtimeOrders 
} from '@domains/ordering';
```

**Database Tables:**
- `menu_items`
- `orders`
- `order_items`
- `tables`

---

#### 5. **Billing Domain** 💳
**Responsibility:** Payments, subscriptions, invoicing

**Key Features:**
- Payment processing
- Subscription management
- Invoice generation
- Refund processing
- Transaction history

**Public API:**
```javascript
import { 
  PricingCard, 
  usePayment, 
  useSubscription 
} from '@domains/billing';
```

**Database Tables:**
- `transactions`
- `subscriptions`
- `subscription_plans`
- `payment_methods`

---

## 🔄 Communication Patterns

### Event-Driven Architecture

Domains communicate through an **event bus** to maintain loose coupling.

```javascript
// Event Bus Pattern
import { eventBus } from '@shared/utils/events/eventBus';

// Domain A: Emit event
eventBus.emit('ORDER_PLACED', {
  orderId: 'order-123',
  totalAmount: 1320
});

// Domain B: Listen to event
eventBus.on('ORDER_PLACED', (payload) => {
  // Send notification
  createNotification(payload);
});
```

### Event Flow Example

```
Customer places order
         ↓
   Ordering Domain
   emits: ORDER_PLACED
         ↓
    ┌─────────┴─────────┐
    ↓                   ↓
Notifications      Analytics
Domain             Domain
creates alert      updates metrics
```

### Direct Imports

For **simple, synchronous** operations, domains can directly import from each other:

```javascript
// ✅ Allowed: Import shared utilities
import { formatCurrency } from '@shared/utils/helpers/formatters';

// ✅ Allowed: Import domain components (if exported)
import { OrderCard } from '@domains/ordering';

// ❌ Avoid: Direct domain utility imports
// Use events instead for cross-domain communication
```

---

## 💻 Technology Stack

### Frontend
- **React 19** - UI framework
- **Vite 6** - Build tool and dev server
- **React Router 7** - Client-side routing
- **TailwindCSS** - Utility-first CSS
- **Recharts** - Data visualization
- **Lucide React** - Icon library

### Backend & Database
- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Row Level Security (RLS)
  - Realtime subscriptions
  - Authentication
  - Storage

### State Management
- **React Context** - Global state
- **React Hooks** - Component state
- **Supabase Realtime** - Server state

### Build & Development
- **Vite** - Fast build tool
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **Path Aliases** - Clean imports

---

## 🎨 Design Principles

### 1. **Separation of Concerns**
Each domain handles one business capability. Shared code lives in `/shared`.

### 2. **Single Responsibility**
Each component, function, and module has one clear responsibility.

### 3. **DRY (Don't Repeat Yourself)**
Common functionality is extracted to shared utilities and components.

### 4. **Explicit Dependencies**
Use imports to make dependencies clear. Avoid global variables.

### 5. **Fail Fast**
Validate data early and throw clear errors.

### 6. **Progressive Enhancement**
Core functionality works, then add enhancements.

### 7. **Mobile-First**
Design for mobile, then scale up to desktop.

### 8. **Accessibility**
Follow WCAG guidelines for inclusive design.

---

## 🔐 Security Architecture

### Authentication Flow

```
User Login Request
     ↓
Supabase Auth
     ↓
JWT Token Generated
     ↓
Token stored in browser
     ↓
Subsequent requests include token
     ↓
Supabase verifies token
     ↓
RLS policies enforce access
```

### Row Level Security (RLS)

Every table has RLS policies:

```sql
-- Example: Users can only see their own orders
CREATE POLICY "Users see own orders"
ON orders
FOR SELECT
USING (auth.uid() = customer_id);

-- Example: Managers can see their restaurant's data
CREATE POLICY "Managers access restaurant data"
ON menu_items
FOR ALL
USING (
  restaurant_id IN (
    SELECT restaurant_id 
    FROM staff 
    WHERE user_id = auth.uid() 
    AND role IN ('manager', 'owner')
  )
);
```

### Permission Hierarchy

```
superadmin     (Platform-level access)
    ↓
  owner        (Restaurant ownership)
    ↓
 manager       (Restaurant management)
    ↓
chef/waiter    (Operational staff)
    ↓
 customer      (Limited access)
```

### Security Best Practices

1. **Never trust client input** - Validate on server
2. **Use RLS policies** - Enforce at database level
3. **Encrypt sensitive data** - Payment details, PII
4. **Log security events** - Activity logging
5. **Rate limiting** - Prevent abuse
6. **HTTPS only** - Secure communication

---

## 🔄 Data Flow

### Read Operations

```
Component
    ↓
React Hook (useEffect)
    ↓
Supabase Client
    ↓
PostgreSQL + RLS Check
    ↓
Data returned
    ↓
Component updates
```

### Write Operations

```
User Action (form submit)
    ↓
Validation (client-side)
    ↓
API Call (Supabase)
    ↓
RLS Check
    ↓
Database Write
    ↓
Realtime Event (optional)
    ↓
UI Update (optimistic or realtime)
```

### Realtime Subscriptions

```
Component mounts
    ↓
Subscribe to Supabase channel
    ↓
Listen for INSERT/UPDATE/DELETE
    ↓
Callback fires on change
    ↓
Component re-renders
    ↓
Cleanup on unmount
```

---

## 🚀 Deployment Architecture

### Production Setup

```
┌──────────────────────────────────────────┐
│           Vercel / Netlify               │
│   (Static hosting + Edge functions)      │
│                                          │
│  ┌────────────────────────────────┐     │
│  │  React SPA (production build)  │     │
│  └────────────────────────────────┘     │
└──────────────────┬───────────────────────┘
                   │
                   ↓ HTTPS
┌──────────────────────────────────────────┐
│            Supabase Cloud                │
│                                          │
│  ┌────────────┐  ┌──────────────┐       │
│  │ PostgreSQL │  │ Auth Service │       │
│  └────────────┘  └──────────────┘       │
│                                          │
│  ┌────────────┐  ┌──────────────┐       │
│  │ Realtime   │  │   Storage    │       │
│  └────────────┘  └──────────────┘       │
└──────────────────────────────────────────┘
```

### Build Process

```bash
# 1. Install dependencies
npm install

# 2. Build for production
npm run build
# Output: dist/

# 3. Preview build
npm run preview

# 4. Deploy to hosting
vercel deploy
# or
netlify deploy
```

### Environment Variables

```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
VITE_APP_ENV=production
```

---

## 📊 Performance Considerations

### Code Splitting
```javascript
// Lazy load pages
const ManagerDashboard = lazy(() => import('@pages/manager/ManagerDashboard'));
```

### Image Optimization
- Use WebP format
- Lazy load images
- Serve responsive images

### Bundle Optimization
- Tree shaking enabled
- Minification in production
- Gzip compression

### Database Optimization
- Indexes on frequently queried columns
- Efficient RLS policies
- Connection pooling
- Query result caching

---

## 🧪 Testing Strategy

### Unit Tests
- Test individual functions
- Test components in isolation
- Mock dependencies

### Integration Tests
- Test domain interactions
- Test API calls
- Test user flows

### E2E Tests
- Test complete user journeys
- Test across devices/browsers

---

## 📚 Path Aliases

Clean imports using Vite path aliases:

```javascript
// ❌ Before: Messy relative imports
import { supabase } from '../../../shared/utils/api/supabaseClient';

// ✅ After: Clean absolute imports
import { supabase } from '@shared/utils/api/supabaseClient';
```

**Available Aliases:**
- `@` - `src/`
- `@shared` - `src/shared/`
- `@domains` - `src/domains/`
- `@pages` - `src/pages/`

---

## 🔮 Future Architecture Plans

### Planned Enhancements
1. **Microservices** - Split domains into separate services
2. **GraphQL** - Add GraphQL layer for flexible queries
3. **WebSockets** - Real-time collaboration features
4. **Service Workers** - Offline support
5. **CDN** - Static asset distribution
6. **Monitoring** - Error tracking and performance monitoring
7. **CI/CD** - Automated testing and deployment

---

## 📖 Additional Resources

### Domain Documentation
- [Notifications Domain](../src/domains/notifications/README.md)
- [Analytics Domain](../src/domains/analytics/README.md)
- [Staff Domain](../src/domains/staff/README.md)
- [Ordering Domain](../src/domains/ordering/README.md)
- [Billing Domain](../src/domains/billing/README.md)

### Database Documentation
- [Schema Documentation](../database/README.md)
- [RLS Policies](../database/04_production_rls.sql)
- [Seed Data](../database/02_seed.sql)

### Migration Documentation
- [Migration Complete Report](../MIGRATION_COMPLETE.md)
- [Testing Guide](../TESTING_VALIDATION.md)
- [Quick Start](../START_HERE.md)

---

## 👥 Contributing

When contributing to Praahis:

1. **Understand the domain** - Read the domain README
2. **Follow patterns** - Use existing code as reference
3. **Keep domains isolated** - Use events for cross-domain communication
4. **Document changes** - Update relevant documentation
5. **Write tests** - Add tests for new features
6. **Code review** - Get review before merging

---

**Architecture Version:** 2.0.0 (Domain-Driven Design)  
**Last Updated:** November 8, 2025  
**Migration Date:** November 7-8, 2025
