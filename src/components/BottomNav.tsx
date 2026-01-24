import { Home, Grid, Package, Download, ShoppingBag } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useCartStore } from '@/store/cartStore';
import { usePwaInstallAvailable } from '@/hooks/usePwaInstallAvailable';

const navItemVariants: Variants = {
  tap: { scale: 0.85, transition: { duration: 0.1 } }
};

const indicatorVariants: Variants = {
  initial: { scale: 0, opacity: 0 },
  animate: { 
    scale: 1, 
    opacity: 1,
    transition: { type: 'spring', stiffness: 500, damping: 30 }
  },
  exit: { 
    scale: 0, 
    opacity: 0,
    transition: { duration: 0.15 }
  }
};

const badgeVariants: Variants = {
  initial: { scale: 0 },
  animate: { 
    scale: 1,
    transition: { type: 'spring', stiffness: 500, damping: 25 }
  }
};

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
    <motion.nav 
      className="nav-floating md:hidden"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.5, duration: 0.5, ease: 'easeOut' }}
    >
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`nav-item flex-1 ${isActive ? 'active' : ''}`}
            >
              <motion.div 
                className="relative"
                variants={navItemVariants}
                whileTap="tap"
              >
                {/* Active Indicator Dot */}
                <AnimatePresence mode="wait">
                  {isActive && (
                    <motion.span
                      className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary"
                      variants={indicatorVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      layoutId="navIndicator"
                    />
                  )}
                </AnimatePresence>

                <motion.div
                  animate={{ 
                    scale: isActive ? 1.1 : 1
                  }}
                  transition={{ duration: 0.2 }}
                  className={isActive ? 'text-primary' : 'text-muted-foreground'}
                >
                  <item.icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 1.5} />
                </motion.div>

                {/* Cart Badge */}
                <AnimatePresence>
                  {item.badge !== undefined && item.badge > 0 && (
                    <motion.span 
                      className="absolute -top-1.5 -right-2.5 w-4 h-4 flex items-center justify-center text-[10px] font-bold bg-primary text-primary-foreground rounded-full"
                      variants={badgeVariants}
                      initial="initial"
                      animate="animate"
                      exit={{ scale: 0 }}
                      key={item.badge}
                    >
                      {item.badge}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
              <span 
                className={`text-[10px] mt-1.5 tracking-wide ${isActive ? 'font-semibold opacity-100' : 'font-medium opacity-70'}`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </motion.nav>
  );
};
