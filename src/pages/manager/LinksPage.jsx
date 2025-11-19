import React from 'react';
import { ExternalLink, ChefHat, Users, QrCode, ArrowRight } from 'lucide-react';
import { useRestaurant } from '@/shared/hooks/useRestaurant';

// Manager > Links: quick access to staff portals (Waiter, Chef)
const Links = () => {
  const { restaurantSlug } = useRestaurant();

  const withSlug = (path) => {
    return restaurantSlug ? `${path}?restaurant=${encodeURIComponent(restaurantSlug)}` : path;
  };

  const links = [
    {
      label: 'Waiter Login',
      href: withSlug('/waiter/login'),
      icon: Users,
      desc: 'Login page for waiters',
    },
    {
      label: 'Waiter Dashboard',
      href: withSlug('/waiter'),
      icon: Users,
      desc: 'Operational view for waiters',
    },
    {
      label: 'Chef Login',
      href: withSlug('/chef/login'),
      icon: ChefHat,
      desc: 'Login page for chefs',
    },
    {
      label: 'Chef Dashboard',
      href: withSlug('/chef'),
      icon: ChefHat,
      desc: 'Kitchen orders view',
    },
    {
      label: 'QR Generator',
      href: withSlug('/manager/qr-generator'),
      icon: QrCode,
      desc: 'Generate and download table QR codes',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Links</h1>
          <p className="text-muted-foreground mt-1">Quick access to staff portals and utilities.</p>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {links.map((l) => {
            const Icon = l.icon;
            return (
              <a
                key={l.label}
                href={l.href}
                target="_blank"
                rel="noreferrer"
                className="group block border border-border rounded-lg p-4 hover:border-primary hover:bg-primary-tint transition-colors"
              >
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground group-hover:bg-primary-tint group-hover:text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground truncate">{l.label}</h3>
                      <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground">{l.desc}</p>
                    <div className="mt-2 text-xs text-muted-foreground break-all">
                      {l.href}
                    </div>
                  </div>
                </div>
              </a>
            );
          })}
        </div>

        <div className="mt-6 text-sm text-muted-foreground">
          Links open in a new tab. You can copy and share them with your staff. The current restaurant context is appended automatically when available.
        </div>
      </div>

      <div className="bg-primary-tint border border-primary/40 text-primary rounded-lg p-4 flex items-start gap-3">
        <ArrowRight className="h-5 w-5 mt-0.5" />
        <p className="text-sm">
          Tip: add these links to your bookmarks or home screen for quick access during service.
        </p>
      </div>
    </div>
  );
};

export default Links;
