# 📊 Analytics Domain

## Overview
The Analytics domain provides comprehensive data visualization, reporting, and business intelligence capabilities for the Praahis platform. It delivers insights on revenue, orders, customer behavior, and operational metrics for restaurant managers and superadmins.

---

## 📂 Structure

```
src/domains/analytics/
├── components/
│   ├── CategorySalesChart.jsx      # Sales breakdown by category
│   ├── HourlySalesChart.jsx       # Hourly sales distribution
│   ├── ItemRankingChart.jsx       # Top-selling items
│   ├── OrderStatusChart.jsx       # Order status distribution
│   ├── PaymentMethodChart.jsx     # Payment method breakdown
│   ├── RevenueChart.jsx           # Revenue trends over time
│   └── StatsCard.jsx              # Metric display card
├── utils/
│   ├── chartHelpers.js            # Chart data transformation
│   └── analyticsCalculations.js   # Metric calculations
├── events.js                      # Domain events
└── index.js                       # Public API exports
```

---

## 🎯 Purpose

### Business Capabilities
- Revenue tracking and forecasting
- Sales performance analysis
- Customer behavior insights
- Menu item performance
- Operational efficiency metrics
- Real-time dashboard updates

### Technical Responsibilities
- Data aggregation and transformation
- Chart rendering and visualization
- Metric calculation and caching
- Export capabilities (CSV, PDF)
- Time-range filtering and comparison

---

## 🔌 Public API

### Components

#### `RevenueChart`
```jsx
import { RevenueChart } from '@domains/analytics';

<RevenueChart 
  restaurantId="restaurant-123"
  startDate="2025-01-01"
  endDate="2025-12-31"
  interval="daily" // 'hourly' | 'daily' | 'weekly' | 'monthly'
/>
```

**Props:**
- `restaurantId` (string, required): Restaurant ID
- `startDate` (string, required): Start date (ISO format)
- `endDate` (string, required): End date (ISO format)
- `interval` (string, optional): Time interval for grouping
- `currency` (string, optional): Currency code (default: 'INR')

**Features:**
- Line chart with revenue trends
- Comparison with previous period
- Hover tooltips with detailed data
- Responsive design
- Export to CSV/PNG

---

#### `CategorySalesChart`
```jsx
import { CategorySalesChart } from '@domains/analytics';

<CategorySalesChart 
  restaurantId="restaurant-123"
  dateRange={{ start: '2025-01-01', end: '2025-01-31' }}
/>
```

**Props:**
- `restaurantId` (string, required)
- `dateRange` (object, required): `{ start: string, end: string }`
- `showPercentages` (boolean, optional): Show percentages instead of amounts

**Features:**
- Pie chart showing category distribution
- Interactive legend
- Color-coded categories
- Drill-down capability

---

#### `ItemRankingChart`
```jsx
import { ItemRankingChart } from '@domains/analytics';

<ItemRankingChart 
  restaurantId="restaurant-123"
  topN={10}
  sortBy="revenue" // 'revenue' | 'quantity' | 'rating'
/>
```

**Props:**
- `restaurantId` (string, required)
- `topN` (number, optional): Number of items to show (default: 10)
- `sortBy` (string, optional): Sort criteria
- `dateRange` (object, optional)

**Features:**
- Horizontal bar chart
- Rank indicators
- Item images
- Quick action buttons (edit, view details)

---

#### `StatsCard`
```jsx
import { StatsCard } from '@domains/analytics';

<StatsCard
  title="Total Revenue"
  value={125000}
  format="currency"
  trend={12.5}
  icon="TrendingUp"
  color="green"
/>
```

**Props:**
- `title` (string, required): Card title
- `value` (number, required): Metric value
- `format` (string, optional): 'currency' | 'number' | 'percentage'
- `trend` (number, optional): Percentage change
- `icon` (string, optional): Lucide icon name
- `color` (string, optional): Theme color

---

### Utilities

#### `chartHelpers.js`

```javascript
import { 
  transformRevenueData,
  aggregateByTimeInterval,
  calculateGrowthRate,
  formatChartData
} from '@domains/analytics';
```

**Functions:**

##### `transformRevenueData(orders, interval)`
Transform order data into chart-ready format.

```javascript
const chartData = transformRevenueData(orders, 'daily');
// Returns: [{ date: '2025-01-01', revenue: 5000, orders: 45 }, ...]
```

**Parameters:**
- `orders` (array): Raw order data
- `interval` (string): Time grouping ('hourly', 'daily', 'weekly', 'monthly')

**Returns:** Array of chart data points

---

##### `aggregateByTimeInterval(data, interval, metric)`
Aggregate data by time interval.

```javascript
const aggregated = aggregateByTimeInterval(
  orders,
  'weekly',
  'total_amount'
);
```

**Parameters:**
- `data` (array): Data to aggregate
- `interval` (string): Time interval
- `metric` (string): Field to aggregate

**Returns:** Aggregated data array

---

##### `calculateGrowthRate(current, previous)`
Calculate percentage growth rate.

```javascript
const growth = calculateGrowthRate(5000, 4000);
// Returns: 25 (representing 25% growth)
```

**Parameters:**
- `current` (number): Current period value
- `previous` (number): Previous period value

**Returns:** Growth rate percentage

---

#### `analyticsCalculations.js`

```javascript
import {
  calculateRevenue,
  calculateAverageOrderValue,
  calculateCustomerLifetimeValue,
  getTopSellingItems
} from '@domains/analytics';
```

##### `calculateRevenue(orders, filters)`
Calculate total revenue with filters.

```javascript
const revenue = calculateRevenue(orders, {
  startDate: '2025-01-01',
  endDate: '2025-01-31',
  paymentStatus: 'completed'
});
```

**Parameters:**
- `orders` (array): Order data
- `filters` (object): Filter criteria

**Returns:** Total revenue number

---

##### `calculateAverageOrderValue(orders)`
Calculate average order value (AOV).

```javascript
const aov = calculateAverageOrderValue(orders);
// Returns: 450 (average ₹450 per order)
```

**Parameters:**
- `orders` (array): Order data

**Returns:** Average order value

---

##### `getTopSellingItems(orders, limit)`
Get top-selling menu items.

```javascript
const topItems = getTopSellingItems(orders, 10);
// Returns: [{ id, name, quantity, revenue, rank }, ...]
```

**Parameters:**
- `orders` (array): Order data
- `limit` (number): Number of items to return

**Returns:** Array of top items with metrics

---

## 🔔 Events

This domain emits the following events:

### `ANALYTICS_UPDATED`
```javascript
{
  type: 'ANALYTICS_UPDATED',
  payload: {
    restaurantId: 'restaurant-123',
    metrics: {
      revenue: 125000,
      orders: 450,
      averageOrderValue: 277.78
    },
    timestamp: '2025-11-08T10:30:00Z'
  }
}
```

### `REPORT_GENERATED`
```javascript
{
  type: 'REPORT_GENERATED',
  payload: {
    reportId: 'report-456',
    type: 'revenue_summary',
    format: 'pdf',
    downloadUrl: 'https://...'
  }
}
```

### `EXPORT_COMPLETED`
```javascript
{
  type: 'EXPORT_COMPLETED',
  payload: {
    exportId: 'export-789',
    format: 'csv',
    recordCount: 1500
  }
}
```

---

## 📊 Database Queries

### Common Analytics Queries

#### Revenue by Date Range
```sql
SELECT 
  DATE(created_at) as date,
  SUM(total_amount) as revenue,
  COUNT(*) as order_count
FROM orders
WHERE restaurant_id = $1
  AND created_at BETWEEN $2 AND $3
  AND payment_status = 'completed'
GROUP BY DATE(created_at)
ORDER BY date;
```

#### Top Selling Items
```sql
SELECT 
  mi.id,
  mi.name,
  mi.category,
  SUM(oi.quantity) as total_quantity,
  SUM(oi.subtotal) as total_revenue
FROM menu_items mi
JOIN order_items oi ON mi.id = oi.item_id
JOIN orders o ON oi.order_id = o.id
WHERE o.restaurant_id = $1
  AND o.created_at BETWEEN $2 AND $3
GROUP BY mi.id, mi.name, mi.category
ORDER BY total_revenue DESC
LIMIT 10;
```

#### Category Performance
```sql
SELECT 
  mi.category,
  SUM(oi.quantity) as items_sold,
  SUM(oi.subtotal) as revenue,
  COUNT(DISTINCT o.id) as order_count
FROM menu_items mi
JOIN order_items oi ON mi.id = oi.item_id
JOIN orders o ON oi.order_id = o.id
WHERE o.restaurant_id = $1
GROUP BY mi.category;
```

---

## 🔗 Dependencies

### Internal Dependencies
```javascript
// Shared utilities
import { supabase } from '@shared/utils/api/supabaseClient';
import { formatCurrency, formatDate } from '@shared/utils/helpers/formatters';

// Shared components
import { Card } from '@shared/components/primitives/Card';
import { LoadingSpinner } from '@shared/components/feedback/LoadingSpinner';
```

### External Dependencies
- `recharts` - Chart rendering library
- `date-fns` - Date manipulation
- `react` - Component framework
- `lucide-react` - Icons

---

## 🎨 Usage Examples

### Example 1: Manager Dashboard
```jsx
import { 
  RevenueChart, 
  StatsCard, 
  CategorySalesChart 
} from '@domains/analytics';
import { useRestaurant } from '@shared/contexts/RestaurantContext';

function ManagerDashboard() {
  const { restaurant } = useRestaurant();
  const dateRange = {
    start: '2025-11-01',
    end: '2025-11-30'
  };

  return (
    <div>
      <div className="stats-grid">
        <StatsCard 
          title="Total Revenue"
          value={125000}
          format="currency"
          trend={12.5}
          icon="DollarSign"
        />
        <StatsCard 
          title="Orders"
          value={450}
          format="number"
          trend={8.2}
          icon="ShoppingCart"
        />
      </div>

      <RevenueChart 
        restaurantId={restaurant.id}
        startDate={dateRange.start}
        endDate={dateRange.end}
        interval="daily"
      />

      <CategorySalesChart 
        restaurantId={restaurant.id}
        dateRange={dateRange}
      />
    </div>
  );
}
```

### Example 2: Custom Analytics Hook
```jsx
import { useState, useEffect } from 'react';
import { calculateRevenue, calculateAverageOrderValue } from '@domains/analytics';
import { supabase } from '@shared/utils/api/supabaseClient';

function useRestaurantAnalytics(restaurantId, dateRange) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end);

      const revenue = calculateRevenue(orders);
      const aov = calculateAverageOrderValue(orders);

      setMetrics({ revenue, aov, orderCount: orders.length });
      setLoading(false);
    }

    fetchAnalytics();
  }, [restaurantId, dateRange]);

  return { metrics, loading };
}
```

### Example 3: Export Analytics Data
```jsx
import { transformRevenueData } from '@domains/analytics';
import { exportToCSV } from '@shared/utils/helpers/exportHelpers';

async function exportRevenueReport(restaurantId, dateRange) {
  // Fetch orders
  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .gte('created_at', dateRange.start)
    .lte('created_at', dateRange.end);

  // Transform to chart format
  const chartData = transformRevenueData(orders, 'daily');

  // Export as CSV
  const csvContent = exportToCSV(chartData, {
    filename: `revenue-report-${dateRange.start}-to-${dateRange.end}.csv`,
    headers: ['Date', 'Revenue', 'Orders']
  });

  // Trigger download
  downloadFile(csvContent, 'revenue-report.csv');
}
```

---

## 🧪 Testing

### Unit Tests
```javascript
describe('analyticsCalculations', () => {
  it('should calculate revenue correctly', () => {
    const orders = [
      { total_amount: 1000, payment_status: 'completed' },
      { total_amount: 2000, payment_status: 'completed' },
      { total_amount: 500, payment_status: 'pending' }
    ];

    const revenue = calculateRevenue(orders, { paymentStatus: 'completed' });
    expect(revenue).toBe(3000);
  });

  it('should calculate average order value', () => {
    const orders = [
      { total_amount: 1000 },
      { total_amount: 2000 },
      { total_amount: 3000 }
    ];

    const aov = calculateAverageOrderValue(orders);
    expect(aov).toBe(2000);
  });
});
```

### Integration Tests
```javascript
it('should display correct revenue on dashboard', async () => {
  const { getByText } = render(<ManagerDashboard />);
  
  await waitFor(() => {
    expect(getByText(/Total Revenue/i)).toBeInTheDocument();
    expect(getByText(/₹125,000/i)).toBeInTheDocument();
  });
});
```

---

## 🔐 Security

### RLS Policies
- Managers can only see their restaurant's analytics
- Superadmins can see all restaurant analytics
- Data is filtered by restaurant_id automatically

### Data Privacy
- Customer PII is anonymized in reports
- Payment details are aggregated only
- Export capabilities require appropriate permissions

---

## 🚀 Performance

### Optimization Strategies
- **Caching:** Cache analytics data for 5 minutes
- **Pagination:** Load large datasets in chunks
- **Aggregation:** Pre-aggregate data at database level
- **Lazy loading:** Load charts on scroll/viewport
- **Memoization:** Memoize expensive calculations

### Query Performance
- Revenue query: <500ms for 1 month of data
- Chart rendering: <200ms for 100 data points
- Dashboard load: <2s for full analytics

---

## 🔄 Cross-Domain Integration

### Receives Events From:
- **Ordering Domain:** Order completion events
- **Billing Domain:** Payment events
- **Customer Pages:** User activity events

### Sends Events To:
- **Manager Dashboard:** Real-time metric updates
- **Notifications Domain:** Alert on metric thresholds

### Example Integration:
```javascript
import { eventBus } from '@shared/utils/events/eventBus';
import { ORDER_EVENTS } from '@domains/ordering';

// Update analytics when order completed
eventBus.on(ORDER_EVENTS.ORDER_COMPLETED, async ({ orderId, totalAmount }) => {
  // Trigger analytics refresh
  eventBus.emit('ANALYTICS_UPDATED', {
    restaurantId: order.restaurant_id,
    trigger: 'order_completed'
  });
});
```

---

## 📝 Future Enhancements

### Planned Features
- [ ] Predictive analytics (ML forecasting)
- [ ] Custom dashboard builder
- [ ] Automated insights and recommendations
- [ ] A/B testing analytics
- [ ] Customer segmentation analysis
- [ ] Real-time alerts on anomalies
- [ ] Competitive benchmarking

### Technical Improvements
- [ ] Add data warehouse integration
- [ ] Implement materialized views for performance
- [ ] Add more chart types (heatmap, sankey, etc.)
- [ ] Support custom date ranges
- [ ] Add drill-down capabilities
- [ ] Implement dashboard sharing

---

## 🤝 Contributing

When adding features to this domain:

1. **Optimize queries:** Always test with large datasets
2. **Cache aggressively:** Analytics data can be slightly stale
3. **Document calculations:** Explain metric formulas
4. **Add exports:** Support CSV, PDF, Excel formats
5. **Test performance:** Ensure charts render quickly

---

## 📚 Related Documentation

- [Chart Library (Recharts)](https://recharts.org/)
- [Export Utilities](../../shared/utils/helpers/exportHelpers.js)
- [Database Schema](../../../database/01_schema.sql)
- [Manager Dashboard](../../pages/manager/ManagerDashboard.jsx)

---

**Domain Owner:** Analytics Team  
**Last Updated:** November 8, 2025  
**Version:** 1.0.0
