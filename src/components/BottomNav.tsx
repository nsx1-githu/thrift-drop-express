import { Home, Search, ShoppingBag, Grid } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useCartStore } from '@/store/cartStore';

export const BottomNav = () => {
  const location = useLocation();
  const itemCount = useCartStore((state) => state.getItemCount());

  const navItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/products', icon: Grid, label: 'Shop' },
    { to: '/search', icon: Search, label: 'Search' },
    { to: '/cart', icon: ShoppingBag, label: 'Cart', badge: itemCount },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border md:hidden">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <div className="relative">
                <item.icon className="w-5 h-5" />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-2 w-4 h-4 flex items-center justify-center text-[10px] font-bold bg-primary text-primary-foreground rounded-full">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
