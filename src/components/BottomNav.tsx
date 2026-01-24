import { Home, Grid, Package, Download, ShoppingBag } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useCartStore } from '@/store/cartStore';
import { usePwaInstallAvailable } from '@/hooks/usePwaInstallAvailable';

export const BottomNav = () => {
  const location = useLocation();
  const itemCount = useCartStore((state) => state.getItemCount());
  const canInstall = usePwaInstallAvailable();

  const navItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/products', icon: Grid, label: 'Shop' },
    { to: '/track-order', icon: Package, label: 'Track' },
    ...(canInstall ? [{ to: '/install', icon: Download, label: 'Get App' }] : []),
    { to: '/cart', icon: ShoppingBag, label: 'Cart', badge: itemCount },
  ];

  return (
    <nav className="nav-floating md:hidden">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`nav-item flex-1 ${isActive ? 'active' : ''}`}
            >
              <div className="relative">
                <item.icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 1.5} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 w-4 h-4 flex items-center justify-center text-[10px] font-bold bg-primary text-primary-foreground rounded-full">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1.5 font-medium tracking-wide">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
