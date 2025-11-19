# Super Admin Component Implementation Guide

**Praahis Restaurant Management System**  
**Component Specifications with Code Examples**

---

## Table of Contents

1. [Dashboard Components](#dashboard-components)
2. [Restaurant Management Components](#restaurant-management-components)
3. [User Management Components](#user-management-components)
4. [Subscription Components](#subscription-components)
5. [Settings Components](#settings-components)
6. [Analytics Components](#analytics-components)
7. [Common Components](#common-components)
8. [Responsive Design Patterns](#responsive-design-patterns)

---

## Dashboard Components

### 1. PlatformKPIs.jsx

**Location**: `src/Components/superadmin/dashboard/PlatformKPIs.jsx`

**Purpose**: Display 6 key platform metrics in a responsive grid

**Props**:
```typescript
interface PlatformKPIsProps {
    stats: {
        totalRestaurants: number;
        activeRestaurants: number;
        totalUsers: number;
        monthlyRevenue: number;
        revenueGrowth: number;
        totalOrders: number;
        ordersGrowth: number;
        activeSessions: number;
        activeSubscriptions: number;
    };
    loading?: boolean;
}
```

**Implementation**:
```jsx
import React from 'react';
import { Building2, Users, DollarSign, ShoppingCart, Zap, CreditCard } from 'lucide-react';
import StatCard from '../common/StatCard';
import { formatCurrency } from '../../../utils/formatters';

const PlatformKPIs = ({ stats, loading = false }) => {
    const kpiData = [
        {
            title: 'Total Restaurants',
            value: stats.totalRestaurants,
            icon: Building2,
            tint: 'brand',
            subtitle: `${stats.activeRestaurants} active`
        },
        {
            title: 'Total Users',
            value: stats.totalUsers,
            icon: Users,
            tint: 'info',
        },
        {
            title: 'Monthly Revenue',
            value: formatCurrency(stats.monthlyRevenue),
            icon: DollarSign,
            tint: 'success',
            change: stats.revenueGrowth
        },
        {
            title: 'Total Orders',
            value: stats.totalOrders.toLocaleString(),
            icon: ShoppingCart,
            tint: 'warning',
            change: stats.ordersGrowth
        },
        {
            title: 'Active Sessions',
            value: stats.activeSessions,
            icon: Zap,
            tint: 'info',
        },
        {
            title: 'Subscriptions',
            value: stats.activeSubscriptions,
            icon: CreditCard,
            tint: 'success',
        }
    ];

    if (loading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="card-minimal p-6 animate-pulse">
                        <div className="h-12 bg-muted rounded" />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {kpiData.map((kpi, index) => (
                <StatCard
                    key={index}
                    title={kpi.title}
                    value={kpi.value}
                    icon={kpi.icon}
                    tint={kpi.tint}
                    change={kpi.change}
                    subtitle={kpi.subtitle}
                />
            ))}
        </div>
    );
};

export default PlatformKPIs;
```

**Usage**:
```jsx
// In Dashboard.jsx
<PlatformKPIs stats={stats} loading={loading} />
```

---

### 2. RevenueOverview.jsx

**Location**: `src/Components/superadmin/dashboard/RevenueOverview.jsx`

**Purpose**: Line chart showing revenue trend over last 30 days

**Props**:
```typescript
interface RevenueOverviewProps {
    data: Array<{
        date: string;
        revenue: number;
    }>;
    loading?: boolean;
}
```

**Implementation**:
```jsx
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../../../utils/formatters';
import { TrendingUp } from 'lucide-react';

const RevenueOverview = ({ data, loading = false }) => {
    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-card border border-border p-3 rounded-lg shadow-lg">
                    <p className="text-sm text-muted-foreground">{payload[0].payload.date}</p>
                    <p className="text-lg font-bold text-success">
                        {formatCurrency(payload[0].value)}
                    </p>
                </div>
            );
        }
        return null;
    };

    if (loading) {
        return (
            <div className="card p-6">
                <div className="h-8 bg-muted rounded w-48 mb-4 animate-pulse" />
                <div className="h-64 bg-muted rounded animate-pulse" />
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="card p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Revenue Overview</h3>
                <div className="h-64 flex items-center justify-center">
                    <div className="text-center">
                        <TrendingUp className="h-12 w-12 text-muted mx-auto mb-2" />
                        <p className="text-muted-foreground">No revenue data available</p>
                    </div>
                </div>
            </div>
        );
    }

    // Calculate total and average
    const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
    const avgRevenue = totalRevenue / data.length;

    return (
        <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-foreground">Revenue Overview</h3>
                    <p className="text-sm text-muted-foreground">Last 30 days</p>
                </div>
                <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold text-success">{formatCurrency(totalRevenue)}</p>
                </div>
            </div>

            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                    <defs>
                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 33%, 23%)" />
                    <XAxis
                        dataKey="date"
                        tick={{ fontSize: 12, fill: 'hsl(215, 16%, 80%)' }}
                        stroke="hsl(217, 33%, 23%)"
                    />
                    <YAxis
                        tick={{ fontSize: 12, fill: 'hsl(215, 16%, 80%)' }}
                        stroke="hsl(217, 33%, 23%)"
                        tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="hsl(142, 76%, 36%)"
                        strokeWidth={3}
                        dot={{ fill: 'hsl(142, 76%, 36%)', r: 4 }}
                        activeDot={{ r: 6 }}
                        fill="url(#revenueGradient)"
                    />
                </LineChart>
            </ResponsiveContainer>

            <div className="mt-4 p-3 bg-muted rounded-lg">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Average Daily Revenue:</span>
                    <span className="font-semibold text-foreground">{formatCurrency(avgRevenue)}</span>
                </div>
            </div>
        </div>
    );
};

export default RevenueOverview;
```

---

### 3. SubscriptionBreakdown.jsx

**Location**: `src/Components/superadmin/dashboard/SubscriptionBreakdown.jsx`

**Purpose**: Pie chart showing subscription plan distribution

**Implementation**:
```jsx
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const SubscriptionBreakdown = ({ data, loading = false }) => {
    const COLORS = {
        trial: 'hsl(215, 16%, 47%)',      // Gray
        basic: 'hsl(217, 91%, 60%)',      // Blue
        pro: 'hsl(142, 76%, 36%)',        // Green
        enterprise: 'hsl(14, 100%, 63%)'  // Orange
    };

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-card border border-border p-3 rounded-lg shadow-lg">
                    <p className="font-semibold text-foreground">{payload[0].name}</p>
                    <p className="text-sm text-muted-foreground">
                        {payload[0].value} restaurants ({payload[0].payload.percentage}%)
                    </p>
                </div>
            );
        }
        return null;
    };

    if (loading) {
        return (
            <div className="card p-6">
                <div className="h-8 bg-muted rounded w-48 mb-4 animate-pulse" />
                <div className="h-64 bg-muted rounded animate-pulse" />
            </div>
        );
    }

    // Transform data to include percentages
    const total = data.reduce((sum, item) => sum + item.count, 0);
    const chartData = data.map(item => ({
        name: item.plan.charAt(0).toUpperCase() + item.plan.slice(1),
        value: item.count,
        percentage: ((item.count / total) * 100).toFixed(1)
    }));

    return (
        <div className="card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Subscription Plans</h3>
            
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percentage }) => `${name} (${percentage}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                    >
                        {chartData.map((entry, index) => (
                            <Cell 
                                key={`cell-${index}`} 
                                fill={COLORS[data[index].plan] || COLORS.trial} 
                            />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                </PieChart>
            </ResponsiveContainer>

            <div className="mt-4 space-y-2">
                {chartData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-2 rounded hover:bg-muted transition-colors">
                        <div className="flex items-center gap-2">
                            <div 
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: COLORS[data[index].plan] }}
                            />
                            <span className="text-sm text-foreground">{item.name}</span>
                        </div>
                        <span className="text-sm font-semibold text-foreground">{item.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SubscriptionBreakdown;
```

---

## Restaurant Management Components

### 4. RestaurantCard.jsx

**Location**: `src/Components/superadmin/restaurants/RestaurantCard.jsx`

**Purpose**: Grid view card for individual restaurant

**Implementation**:
```jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Users, DollarSign, Edit, MoreVertical } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatCurrency } from '../../../utils/formatters';
import Badge from '../../common/Badge';

const RestaurantCard = ({ restaurant, onEdit, onToggleStatus }) => {
    const navigate = useNavigate();

    const statusVariant = restaurant.is_active ? 'success' : 'secondary';
    const subscriptionVariant = {
        trial: 'secondary',
        basic: 'info',
        pro: 'success',
        enterprise: 'brand'
    }[restaurant.subscription?.plan_name?.toLowerCase()] || 'secondary';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="card p-6 hover:shadow-xl transition-all cursor-pointer group"
            onClick={() => navigate(`/superadmin/restaurants/${restaurant.id}`)}
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    {restaurant.logo_url ? (
                        <img 
                            src={restaurant.logo_url} 
                            alt={restaurant.name}
                            className="w-12 h-12 rounded-lg object-cover ring-2 ring-border"
                        />
                    ) : (
                        <div className="w-12 h-12 rounded-lg bg-primary-tint flex items-center justify-center">
                            <Building2 className="h-6 w-6 text-primary" />
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                            {restaurant.name}
                        </h3>
                        <p className="text-sm text-muted-foreground truncate">/{restaurant.slug}</p>
                    </div>
                </div>
                <Badge variant={statusVariant}>
                    {restaurant.is_active ? 'Active' : 'Inactive'}
                </Badge>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                        <DollarSign className="h-4 w-4 text-success" />
                        <p className="text-xs text-muted-foreground">Revenue (30d)</p>
                    </div>
                    <p className="text-lg font-bold text-foreground">
                        {formatCurrency(restaurant.stats?.monthlyRevenue || 0)}
                    </p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                        <Users className="h-4 w-4 text-info" />
                        <p className="text-xs text-muted-foreground">Managers</p>
                    </div>
                    <p className="text-lg font-bold text-foreground">
                        {restaurant.stats?.managerCount || 0}
                    </p>
                </div>
            </div>

            {/* Subscription */}
            <div className="mb-4 p-3 bg-card-hover rounded-lg border border-border">
                <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Plan:</span>
                    <Badge variant={subscriptionVariant}>
                        {restaurant.subscription?.plan_name || 'Trial'}
                    </Badge>
                </div>
                {restaurant.subscription?.current_period_end && (
                    <p className="text-xs text-muted-foreground mt-1">
                        Renews: {new Date(restaurant.subscription.current_period_end).toLocaleDateString()}
                    </p>
                )}
            </div>

            {/* Actions */}
            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                <button 
                    className="btn-secondary flex-1 text-sm"
                    onClick={() => navigate(`/superadmin/restaurants/${restaurant.id}`)}
                >
                    View Details
                </button>
                <button 
                    className="btn-ghost p-2"
                    onClick={(e) => {
                        e.stopPropagation();
                        onEdit(restaurant);
                    }}
                >
                    <Edit className="h-4 w-4" />
                </button>
                <button 
                    className="btn-ghost p-2"
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleStatus(restaurant);
                    }}
                >
                    <MoreVertical className="h-4 w-4" />
                </button>
            </div>
        </motion.div>
    );
};

export default RestaurantCard;
```

**Mobile Variant**:
```jsx
const RestaurantCardMobile = ({ restaurant, onView }) => {
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="card p-4 active:bg-muted transition-colors"
            onClick={() => onView(restaurant.id)}
        >
            <div className="flex items-center gap-3 mb-3">
                {restaurant.logo_url ? (
                    <img 
                        src={restaurant.logo_url} 
                        alt={restaurant.name}
                        className="w-10 h-10 rounded-lg object-cover"
                    />
                ) : (
                    <div className="w-10 h-10 rounded-lg bg-primary-tint flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-primary" />
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{restaurant.name}</h3>
                    <p className="text-xs text-muted-foreground truncate">/{restaurant.slug}</p>
                </div>
                <Badge variant={restaurant.is_active ? 'success' : 'secondary'} size="sm">
                    {restaurant.is_active ? '●' : '○'}
                </Badge>
            </div>
            
            <div className="flex items-center justify-between text-sm">
                <div>
                    <span className="text-muted-foreground">Revenue: </span>
                    <span className="font-semibold text-foreground">
                        {formatCurrency(restaurant.stats?.monthlyRevenue || 0)}
                    </span>
                </div>
                <Badge variant="outline" size="sm">
                    {restaurant.subscription?.plan_name || 'Trial'}
                </Badge>
            </div>
        </motion.div>
    );
};
```

---

### 5. RestaurantForm.jsx

**Location**: `src/Components/superadmin/restaurants/RestaurantForm.jsx`

**Purpose**: Create/Edit restaurant modal form

**Implementation**:
```jsx
import React, { useState, useEffect } from 'react';
import { X, Building2, Link as LinkIcon, Mail, Phone, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../../common/Modal';

const RestaurantForm = ({ restaurant, isOpen, onClose, onSubmit }) => {
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        description: '',
        address: '',
        phone: '',
        email: '',
        logo_url: '',
        is_active: true,
        max_users: 10,
        max_tables: 20,
        max_menu_items: 100
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (restaurant) {
            setFormData({
                name: restaurant.name || '',
                slug: restaurant.slug || '',
                description: restaurant.description || '',
                address: restaurant.address || '',
                phone: restaurant.phone || '',
                email: restaurant.email || '',
                logo_url: restaurant.logo_url || '',
                is_active: restaurant.is_active ?? true,
                max_users: restaurant.max_users || 10,
                max_tables: restaurant.max_tables || 20,
                max_menu_items: restaurant.max_menu_items || 100
            });
        }
    }, [restaurant]);

    const generateSlug = (name) => {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        // Auto-generate slug from name
        if (field === 'name' && !restaurant) {
            setFormData(prev => ({
                ...prev,
                slug: generateSlug(value)
            }));
        }

        // Clear error for this field
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: null }));
        }
    };

    const validate = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Restaurant name is required';
        }

        if (!formData.slug.trim()) {
            newErrors.slug = 'Slug is required';
        } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
            newErrors.slug = 'Slug can only contain lowercase letters, numbers, and hyphens';
        }

        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Invalid email format';
        }

        if (formData.phone && !/^\+?[\d\s-()]+$/.test(formData.phone)) {
            newErrors.phone = 'Invalid phone format';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validate()) {
            toast.error('Please fix the errors');
            return;
        }

        setLoading(true);
        try {
            await onSubmit(formData);
            toast.success(restaurant ? 'Restaurant updated' : 'Restaurant created');
            onClose();
        } catch (error) {
            toast.error(error.message || 'Failed to save restaurant');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={restaurant ? 'Edit Restaurant' : 'Create Restaurant'}
            size="lg"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="space-y-4">
                    <h4 className="font-medium text-foreground">Basic Information</h4>
                    
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Restaurant Name *
                        </label>
                        <div className="relative">
                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                                className={`input pl-10 ${errors.name ? 'border-destructive' : ''}`}
                                placeholder="Enter restaurant name"
                            />
                        </div>
                        {errors.name && (
                            <p className="text-sm text-destructive mt-1">{errors.name}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            URL Slug *
                        </label>
                        <div className="relative">
                            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <input
                                type="text"
                                value={formData.slug}
                                onChange={(e) => handleChange('slug', e.target.value)}
                                className={`input pl-10 ${errors.slug ? 'border-destructive' : ''}`}
                                placeholder="restaurant-slug"
                                disabled={!!restaurant}
                            />
                        </div>
                        {errors.slug && (
                            <p className="text-sm text-destructive mt-1">{errors.slug}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                            URL: praahis.com/{formData.slug || 'restaurant-slug'}
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                            className="input"
                            rows={3}
                            placeholder="Brief description of the restaurant"
                        />
                    </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-4">
                    <h4 className="font-medium text-foreground">Contact Information</h4>
                    
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Email
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => handleChange('email', e.target.value)}
                                className={`input pl-10 ${errors.email ? 'border-destructive' : ''}`}
                                placeholder="restaurant@example.com"
                            />
                        </div>
                        {errors.email && (
                            <p className="text-sm text-destructive mt-1">{errors.email}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Phone
                        </label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => handleChange('phone', e.target.value)}
                                className={`input pl-10 ${errors.phone ? 'border-destructive' : ''}`}
                                placeholder="+1 (555) 123-4567"
                            />
                        </div>
                        {errors.phone && (
                            <p className="text-sm text-destructive mt-1">{errors.phone}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Address
                        </label>
                        <textarea
                            value={formData.address}
                            onChange={(e) => handleChange('address', e.target.value)}
                            className="input"
                            rows={2}
                            placeholder="Full address"
                        />
                    </div>
                </div>

                {/* Resource Limits */}
                <div className="space-y-4">
                    <h4 className="font-medium text-foreground">Resource Limits</h4>
                    
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Max Users
                            </label>
                            <input
                                type="number"
                                value={formData.max_users}
                                onChange={(e) => handleChange('max_users', parseInt(e.target.value))}
                                className="input"
                                min="1"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Max Tables
                            </label>
                            <input
                                type="number"
                                value={formData.max_tables}
                                onChange={(e) => handleChange('max_tables', parseInt(e.target.value))}
                                className="input"
                                min="1"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Max Menu Items
                            </label>
                            <input
                                type="number"
                                value={formData.max_menu_items}
                                onChange={(e) => handleChange('max_menu_items', parseInt(e.target.value))}
                                className="input"
                                min="1"
                            />
                        </div>
                    </div>
                </div>

                {/* Status */}
                <div>
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={formData.is_active}
                            onChange={(e) => handleChange('is_active', e.target.checked)}
                            className="w-5 h-5 text-primary border-border rounded focus:ring-info"
                        />
                        <span className="text-sm font-medium text-foreground">Active</span>
                    </label>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                    <button
                        type="button"
                        onClick={onClose}
                        className="btn-secondary"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={loading}
                    >
                        {loading ? 'Saving...' : restaurant ? 'Update' : 'Create'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default RestaurantForm;
```

---

## Common Components

### 6. StatCard (Enhanced)

**Location**: `src/Components/superadmin/common/StatCard.jsx`

**Implementation**:
```jsx
import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';

const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    tint = 'info', 
    change, 
    subtitle,
    loading = false 
}) => {
    const tintMap = {
        success: 'bg-success-light text-success',
        warning: 'bg-warning-light text-warning',
        info: 'bg-info-light text-info',
        brand: 'bg-primary-tint text-primary',
    };
    const tintClasses = tintMap[tint] || tintMap.info;

    if (loading) {
        return (
            <div className="card-minimal p-6 animate-pulse">
                <div className="h-12 bg-muted rounded" />
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="card-minimal p-6 hover:shadow-lg transition-shadow"
        >
            <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-muted mb-1 truncate">{title}</p>
                    <p className="text-3xl font-bold text-foreground tabular-nums truncate">
                        {value}
                    </p>
                    {subtitle && (
                        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
                    )}
                    {change !== undefined && (
                        <div className="flex items-center gap-1 mt-2">
                            {change >= 0 ? (
                                <TrendingUp className="h-4 w-4 text-success" />
                            ) : (
                                <TrendingDown className="h-4 w-4 text-destructive" />
                            )}
                            <span className={`text-sm font-medium ${change >= 0 ? 'text-success' : 'text-destructive'}`}>
                                {Math.abs(change)}%
                            </span>
                            <span className="text-xs text-muted-foreground">vs yesterday</span>
                        </div>
                    )}
                </div>
                <div className={`p-3 rounded-lg ${tintClasses} shrink-0`}>
                    <Icon className="h-8 w-8" />
                </div>
            </div>
        </motion.div>
    );
};

export default StatCard;
```

---

### 7. DateRangePicker

**Location**: `src/Components/superadmin/common/DateRangePicker.jsx`

**Implementation**:
```jsx
import React, { useState } from 'react';
import { Calendar, X } from 'lucide-react';

const DateRangePicker = ({ startDate, endDate, onChange, className = '' }) => {
    const [localStart, setLocalStart] = useState(startDate || '');
    const [localEnd, setLocalEnd] = useState(endDate || '');

    const handleApply = () => {
        onChange({
            startDate: localStart,
            endDate: localEnd
        });
    };

    const handleClear = () => {
        setLocalStart('');
        setLocalEnd('');
        onChange({ startDate: '', endDate: '' });
    };

    const presets = [
        {
            label: 'Today',
            getValue: () => {
                const today = new Date().toISOString().split('T')[0];
                return { start: today, end: today };
            }
        },
        {
            label: 'Last 7 days',
            getValue: () => {
                const end = new Date();
                const start = new Date(end);
                start.setDate(start.getDate() - 7);
                return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
            }
        },
        {
            label: 'Last 30 days',
            getValue: () => {
                const end = new Date();
                const start = new Date(end);
                start.setDate(start.getDate() - 30);
                return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
            }
        },
        {
            label: 'This month',
            getValue: () => {
                const now = new Date();
                const start = new Date(now.getFullYear(), now.getMonth(), 1);
                const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
            }
        }
    ];

    const applyPreset = (preset) => {
        const { start, end } = preset.getValue();
        setLocalStart(start);
        setLocalEnd(end);
        onChange({ startDate: start, endDate: end });
    };

    return (
        <div className={`card p-4 ${className}`}>
            <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-medium text-foreground">Date Range</h3>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                        Start Date
                    </label>
                    <input
                        type="date"
                        value={localStart}
                        onChange={(e) => setLocalStart(e.target.value)}
                        className="input text-sm"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                        End Date
                    </label>
                    <input
                        type="date"
                        value={localEnd}
                        onChange={(e) => setLocalEnd(e.target.value)}
                        className="input text-sm"
                        min={localStart}
                    />
                </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
                {presets.map((preset, index) => (
                    <button
                        key={index}
                        onClick={() => applyPreset(preset)}
                        className="btn-ghost text-xs px-2 py-1"
                    >
                        {preset.label}
                    </button>
                ))}
            </div>

            <div className="flex justify-end gap-2">
                <button
                    onClick={handleClear}
                    className="btn-ghost text-sm"
                    disabled={!localStart && !localEnd}
                >
                    <X className="h-4 w-4 mr-1" />
                    Clear
                </button>
                <button
                    onClick={handleApply}
                    className="btn-primary text-sm"
                    disabled={!localStart || !localEnd}
                >
                    Apply
                </button>
            </div>
        </div>
    );
};

export default DateRangePicker;
```

---

## Responsive Design Patterns

### Mobile-First Approach

**Breakpoints**:
```css
/* Tailwind default breakpoints */
sm: 640px   /* Small devices */
md: 768px   /* Tablets */
lg: 1024px  /* Laptops */
xl: 1280px  /* Desktops */
2xl: 1536px /* Large screens */
```

**Grid Layouts**:
```jsx
// Dashboard KPIs
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
    {/* Cards */}
</div>

// Restaurant Cards
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
    {/* Cards */}
</div>

// Two-column layout
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div className="lg:col-span-2">{/* Main content */}</div>
    <div>{/* Sidebar */}</div>
</div>
```

**Hidden on Mobile**:
```jsx
// Desktop-only actions
<div className="hidden md:flex items-center gap-2">
    <button>...</button>
</div>

// Mobile-only menu
<div className="md:hidden">
    <MobileMenu />
</div>
```

**Responsive Typography**:
```jsx
<h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">Title</h1>
<p className="text-sm md:text-base">Content</p>
```

---

## Animation Patterns

### Framer Motion Variants

```jsx
// Page transitions
const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.2 } }
};

// Stagger children
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

// Usage
<motion.div variants={containerVariants} initial="hidden" animate="visible">
    {items.map(item => (
        <motion.div key={item.id} variants={itemVariants}>
            {item.content}
        </motion.div>
    ))}
</motion.div>
```

---

**End of Component Implementation Guide**

For complete page implementations, refer to the main design document.
