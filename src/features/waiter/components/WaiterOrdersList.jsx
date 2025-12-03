/**
 * WaiterOrdersList - Orders list view for waiter dashboard
 */
import React from 'react';
import { Search, X, Sparkles } from 'lucide-react';
import WaiterOrderCard from './WaiterOrderCard';

export function WaiterOrdersList({ orders, searchText, setSearchText, onMarkServed }) {
  // Group orders by status
  const readyOrders = orders.filter((o) => o.status === 'ready');
  const preparingOrders = orders.filter((o) => o.status === 'preparing');
  const receivedOrders = orders.filter((o) => o.status === 'received');
  const servedOrders = orders.filter((o) => o.status === 'served');

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search by order # or table..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="w-full pl-12 pr-10 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50"
        />
        {searchText && (
          <button
            onClick={() => setSearchText('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Ready Orders - Priority Section */}
      {readyOrders.length > 0 && (
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 text-lg font-bold text-emerald-400">
            <Sparkles className="w-5 h-5" />
            Ready to Serve ({readyOrders.length})
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {readyOrders.map((order) => (
              <WaiterOrderCard
                key={order.id}
                order={order}
                onMarkServed={() => onMarkServed(order)}
                priority
              />
            ))}
          </div>
        </div>
      )}

      {/* Preparing Orders */}
      {preparingOrders.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-amber-400">
            Being Prepared ({preparingOrders.length})
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {preparingOrders.map((order) => (
              <WaiterOrderCard
                key={order.id}
                order={order}
                onMarkServed={() => onMarkServed(order)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Received Orders */}
      {receivedOrders.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-blue-400">New Orders ({receivedOrders.length})</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {receivedOrders.map((order) => (
              <WaiterOrderCard
                key={order.id}
                order={order}
                onMarkServed={() => onMarkServed(order)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Served Orders */}
      {servedOrders.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-slate-400">
            Recently Served ({servedOrders.length})
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 opacity-60">
            {servedOrders.slice(0, 6).map((order) => (
              <WaiterOrderCard
                key={order.id}
                order={order}
                onMarkServed={() => onMarkServed(order)}
                served
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {orders.length === 0 && (
        <div className="text-center py-20">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-slate-800 flex items-center justify-center mb-4">
            <Search className="w-10 h-10 text-slate-600" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No Orders Found</h3>
          <p className="text-slate-400">
            {searchText ? 'Try a different search term' : 'New orders will appear here'}
          </p>
        </div>
      )}
    </div>
  );
}

export default WaiterOrdersList;
