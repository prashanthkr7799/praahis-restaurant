# Multi-Tenancy Enablement

This project now supports multi-tenant isolation by restaurant using a `restaurant_id` column on all core tables, indexes for performance, and Row-Level Security (RLS) policies in Supabase.

## What changed

- restaurants
  - Ensured columns: `id uuid PK`, `name`, `slug`, `logo_url`, `is_active`, `created_at`
  - Unique index on lower(slug)
- Added/ensured `restaurant_id` (UUID, FK → restaurants.id) on:
  - tables, menu_items, orders, payments, offers, feedbacks, users (staff), activity_logs
- Backfill
  - payments.restaurant_id ← orders.restaurant_id
  - feedbacks.restaurant_id ← orders.restaurant_id
  - users.restaurant_id ← only if there is exactly one restaurant (safe default)
- Indexes
  - `(restaurant_id)` on all above tables
  - `(restaurant_id, created_at)` on orders and feedbacks
- Supabase RLS
  - Staff can only see/modify rows where `row.restaurant_id = staff.restaurant_id`
  - RLS is enabled on restaurants, tables, menu_items, orders, payments, offers, feedbacks, users, activity_logs

## Migration

Run the migration after your base schema/seed:

1. 01_schema.sql
2. 02_seed.sql
3. 03_enable_realtime.sql (if used)
4. 10_multitenancy.sql (new)

The migration is safe and idempotent: it uses `IF NOT EXISTS` guards and drops/re-creates policies by name.

## Query patterns (JS)

Always scope reads and writes by `restaurant_id`:

```js
// Read menu items for a restaurant
const { data: items, error } = await supabase
  .from('menu_items')
  .select('*')
  .eq('restaurant_id', restaurantId)
  .order('category')
  .order('name');

// Create an order (MUST include restaurant_id)
const { data: order, error: orderErr } = await supabase
  .from('orders')
  .insert([{ restaurant_id: restaurantId, table_id, table_number, items, subtotal, tax, total }])
  .select()
  .single();

// Feedbacks filtered by restaurant
const { data: feedbacks } = await supabase
  .from('feedbacks')
  .select('*')
  .eq('restaurant_id', restaurantId)
  .order('created_at', { ascending: false });
```

Realtime subscription pattern (filter by restaurant):

```js
const channel = supabase
  .channel(`orders-${restaurantId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'orders',
    filter: `restaurant_id=eq.${restaurantId}`,
  }, (payload) => {
    // handle payload
  })
  .subscribe();
```

## RLS notes

- Policies limit authenticated users (staff) to rows matching their `users.restaurant_id`.
- If customers (anonymous role) create orders directly, avoid exposing broad insert permissions from the browser. Use one of:
  - An Edge Function with the service role to write orders safely, or
  - A narrowly-scoped policy for `anon` if you must, ensuring you validate/force `restaurant_id` server-side.

## Backward compatibility

- Existing data are preserved; where possible, `restaurant_id` was backfilled.
- Queries that lacked a `restaurant_id` filter may now return fewer rows due to RLS. Add `.eq('restaurant_id', restaurantId)` for clarity and performance.

## Troubleshooting

- Staff sees no data: ensure their profile in `public.users` has a `restaurant_id` set to the correct restaurant.
- Inserts rejected: verify you pass `restaurant_id` and it matches the staff’s restaurant.
- Orders/Feedbacks missing `restaurant_id`: re-run the migration; it backfills from `orders`.
