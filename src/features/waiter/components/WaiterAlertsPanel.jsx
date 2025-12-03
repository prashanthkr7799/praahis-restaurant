/**
 * WaiterAlertsPanel - Displays call waiter and cash payment alerts
 */
import React from 'react';
import { Bell, X, CreditCard } from 'lucide-react';

export function WaiterAlertsPanel({ alerts, onDismiss }) {
  if (alerts.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-red-500/10 via-red-500/5 to-transparent border-l-4 border-red-500 rounded-r-xl p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-white flex items-center gap-2">
          <Bell className="w-5 h-5 text-red-500 animate-pulse" />
          Active Alerts ({alerts.length})
        </h3>
      </div>
      <div className="space-y-2">
        {alerts.slice(0, 5).map((alert) => (
          <div
            key={alert.id}
            className="flex items-center justify-between bg-slate-800/50 rounded-lg p-3 border border-slate-700/50"
          >
            <div className="flex items-center gap-3">
              {alert.type === 'Cash Payment' ? (
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-green-500" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-red-500" />
                </div>
              )}
              <div>
                <p className="font-semibold text-white">Table {alert.tableNumber}</p>
                <p className="text-xs text-slate-400">
                  {alert.type}
                  {alert.amount && ` - ₹${alert.amount}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">
                {new Date(alert.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <button
                onClick={() => onDismiss(alert.id)}
                className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default WaiterAlertsPanel;
