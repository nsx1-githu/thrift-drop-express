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

  // Hide on admin pages
  const isAdminPage = location.pathname.startsWith('/admin');
  if (isAdminPage) return null;

  const navItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/products', icon: Grid, label: 'Shop' },
    { to: '/track-order', icon: Package, label: 'Track' },
    ...(canInstall ? [{ to: '/install', icon: Download, label: 'Get App' }] : []),
    { to: '/cart', icon: ShoppingBag, label: 'Cart', badge: itemCount },
  ];

  return (
    <motion.nav 
      className="fixed bottom-4 left-4 right-4 z-50 md:hidden"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.5, duration: 0.5, ease: 'easeOut' }}
    >
      <div className="bg-card/80 backdrop-blur-xl border border-primary/20 rounded-2xl shadow-2xl shadow-primary/10 px-2 py-2">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className="flex flex-col items-center justify-center flex-1 py-1 px-1"
              >
                <motion.div 
                  className="relative"
                  variants={navItemVariants}
                  whileTap="tap"
                >
                  {/* Active Glow Background */}
                  <AnimatePresence mode="wait">
                    {isActive && (
                      <motion.span
                        className="absolute inset-0 -m-3 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 blur-sm"
                        variants={indicatorVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        layoutId="navGlow"
                      />
                    )}
                  </AnimatePresence>

                  <motion.div
                    animate={{ 
                      scale: isActive ? 1.15 : 1,
                      y: isActive ? -2 : 0
                    }}
                    transition={{ duration: 0.25, type: 'spring', stiffness: 400 }}
                    className={`relative z-10 p-2 rounded-xl transition-colors duration-200 ${
                      isActive 
                        ? 'text-primary bg-primary/10' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <item.icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                  </motion.div>

                  {/* Cart Badge */}
                  <AnimatePresence>
                    {item.badge !== undefined && item.badge > 0 && (
                      <motion.span 
                        className="absolute -top-0.5 -right-0.5 w-5 h-5 flex items-center justify-center text-[11px] font-bold bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-full shadow-lg shadow-primary/30 ring-2 ring-card"
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
                <motion.span 
                  animate={{ 
                    opacity: isActive ? 1 : 0.6,
                    fontWeight: isActive ? 600 : 500
                  }}
                  className={`text-[10px] mt-1 tracking-wide ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
                >
                  {item.label}
                </motion.span>
              </Link>
            );
          })}
        </div>
      </div>
    </motion.nav>
  );
};
