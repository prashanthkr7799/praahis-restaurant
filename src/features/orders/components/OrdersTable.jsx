import React from 'react';
import { formatCurrency, formatDateTime } from '@shared/utils/formatters';

const Badge = ({ variant = 'info', children }) => {
  const map = {
    served: 'bg-success-light text-success',
    ready: 'bg-info-light text-info',
    preparing: 'bg-warning-light text-warning',
    received: 'bg-info-light text-info',
    paid: 'bg-success-light text-success',
    failed: 'bg-destructive/15 text-destructive',
    pending: 'bg-warning-light text-warning',
    info: 'bg-info-light text-info',
  };
  const cls = map[variant] || map.info;
  return <span className={`px-2 py-1 text-xs font-medium rounded-full ${cls}`}>{children}</span>;
};

const OrdersTable = ({ orders = [], onRowClick }) => {
  return (
    <div className="card-minimal overflow-hidden">
      <div className="px-6 py-4 border-b border-border/60 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Recent Orders</h2>
        <button
          onClick={() => onRowClick && onRowClick('all')}
          className="text-primary hover:underline text-sm font-medium"
        >
          View All →
        </button>
      </div>
      {orders.length === 0 ? (
        <div className="px-6 py-12 text-center text-muted-foreground">No orders yet today</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border/60">
            <thead className="bg-muted">
              <tr>
                {['Order #','Table','Status','Payment','Total','Time'].map((h)=> (
                  <th key={h} className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {orders.map((order) => (
                <tr
                  key={order.id}
                  onClick={() => onRowClick && onRowClick(order)}
                  className="hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">#{order.order_number}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">Table {order.tables?.table_number || order.table_id}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={order.order_status}>{order.order_status}</Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={order.payment_status}>{order.payment_status}</Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{formatCurrency(order.total)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{formatDateTime(order.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default OrdersTable;
