/**
 * AdminSidebar Component
 * Navigation sidebar for admin portal
 */

import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  UtensilsCrossed,
  ShoppingCart,
  CreditCard,
  Users,
  Tag,
  QrCode,
  BarChart3,
  Settings,
  FileText,
  Activity,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const AdminSidebar = ({ isOpen, onToggle }) => {
  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/manager/dashboard' },
    { icon: UtensilsCrossed, label: 'Menu', path: '/manager/menu' },
    { icon: ShoppingCart, label: 'Orders', path: '/manager/orders' },
    { icon: CreditCard, label: 'Payments', path: '/manager/payments' },
    { icon: Users, label: 'Staff', path: '/manager/staff' },
    { icon: QrCode, label: 'QR Codes', path: '/manager/qr-codes' },
    { icon: BarChart3, label: 'Analytics', path: '/manager/analytics' },
    { icon: FileText, label: 'Reports', path: '/manager/reports' },
    { icon: Activity, label: 'Activity Logs', path: '/manager/logs' },
    { icon: Settings, label: 'Settings', path: '/manager/settings' },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen bg-white border-r border-gray-200 transition-all duration-300 ${
          isOpen ? 'w-64' : 'w-20'
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
          {isOpen && (
            <span className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              Manager Portal
            </span>
          )}
          <button
            onClick={onToggle}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors ml-auto"
          >
            {isOpen ? (
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            ) : (
              <ChevronRight className="h-5 w-5 text-gray-600" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2 overflow-y-auto h-[calc(100vh-4rem)]">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`
              }
              title={!isOpen ? item.label : ''}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {isOpen && <span className="font-medium">{item.label}</span>}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default AdminSidebar;
