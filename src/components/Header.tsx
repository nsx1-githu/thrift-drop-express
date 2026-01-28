import { useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, ShoppingBag, Bell, Menu, X, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '@/store/cartStore';
import { useNotificationStore } from '@/store/notificationStore';
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { usePwaInstallAvailable } from "@/hooks/usePwaInstallAvailable";

const REQUIRED_TAPS = 5;
const TAP_TIME_WINDOW = 2000;

// Product categories for the sidebar
const categories = [
  { to: '/products?category=jackets', label: 'Jackets' },
  { to: '/products?category=hoodies', label: 'Hoodies' },
  { to: '/products?category=jeans', label: 'Jeans' },
  { to: '/products?category=shoes', label: 'Shoes' },
  { to: '/products?category=vintage', label: 'Vintage' },
  { to: '/products?category=streetwear', label: 'Streetwear' },
  { to: '/products?category=bags', label: 'Bags' },
  { to: '/products?category=caps', label: 'Caps' },
];

export const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const tapTimestamps = useRef<number[]>([]);
  const itemCount = useCartStore((state) => state.getItemCount());
  const unreadCount = useNotificationStore((state) => state.getUnreadCount());
  const canInstall = usePwaInstallAvailable();

  const { get } = useStoreSettings();
  const storeName = get("store_name", "THRIFT DROPS");
  const logoUrl = get("theme_logo_url", "");

  const handleLogoTap = (e: React.MouseEvent) => {
    const now = Date.now();
    tapTimestamps.current = [...tapTimestamps.current.filter(t => now - t < TAP_TIME_WINDOW), now];
    if (tapTimestamps.current.length >= REQUIRED_TAPS) {
      e.preventDefault();
      tapTimestamps.current = [];
      navigate('/admin/login');
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center justify-between h-16 sm:h-20 px-3 sm:px-5 lg:px-8 max-w-7xl mx-auto">
          {/* Left Side - Search & Menu */}
          <div className="flex items-center gap-1 sm:gap-2">
            <Link
              to="/search"
              className="p-2 sm:p-3 rounded-xl sm:rounded-2xl hover:bg-primary/10 transition-all duration-200 text-muted-foreground hover:text-primary"
            >
              <Search className="w-5 h-5 sm:w-6 sm:h-6" />
            </Link>

            <motion.button
              onClick={() => setSidebarOpen(true)}
              className="p-2 sm:p-3 rounded-xl sm:rounded-2xl hover:bg-primary/10 transition-all duration-200 text-muted-foreground hover:text-primary"
              whileTap={{ scale: 0.9 }}
            >
              <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
            </motion.button>
          </div>

          {/* Center - Logo */}
          <Link to="/" onClick={handleLogoTap} className="flex items-center gap-3 group absolute left-1/2 -translate-x-1/2">
            {logoUrl ? (
              <motion.div
                className="relative overflow-hidden rounded-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <img 
                  src={logoUrl} 
                  alt={storeName} 
                  className="h-10 sm:h-12 w-auto object-contain relative z-10"
                />
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"
                />
              </motion.div>
            ) : (
              <motion.span 
                className="relative text-lg sm:text-xl font-bold tracking-tight overflow-hidden"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="relative z-10 bg-gradient-to-r from-foreground via-primary to-foreground bg-[length:200%_100%] bg-clip-text text-transparent animate-shimmer">
                  {storeName}
                </span>
              </motion.span>
            )}
          </Link>

          {/* Right Side - Notifications, Cart, Install */}
          <div className="flex items-center gap-1 sm:gap-2">
            {canInstall && (
              <Link
                to="/install"
                className="hidden sm:flex p-2 sm:p-3 rounded-xl sm:rounded-2xl hover:bg-primary/10 transition-all duration-200 text-muted-foreground hover:text-primary"
              >
                <Download className="w-5 h-5 sm:w-6 sm:h-6" />
              </Link>
            )}

            <Link
              to="/notifications"
              className="relative p-2 sm:p-3 rounded-xl sm:rounded-2xl hover:bg-primary/10 transition-all duration-200 text-muted-foreground hover:text-primary"
            >
              <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
              {unreadCount > 0 && (
                <motion.span 
                  className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-gradient-to-br from-primary to-primary/80 rounded-full ring-2 ring-background shadow-lg shadow-primary/40"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500 }}
                />
              )}
            </Link>

            <Link
              to="/cart"
              className="relative p-2 sm:p-3 rounded-xl sm:rounded-2xl hover:bg-primary/10 transition-all duration-200 text-muted-foreground hover:text-primary"
            >
              <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" />
              {itemCount > 0 && (
                <motion.span 
                  className="absolute -top-0.5 -right-0.5 w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-[10px] sm:text-xs font-bold bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-full shadow-lg shadow-primary/30 ring-2 ring-background"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500 }}
                  key={itemCount}
                >
                  {itemCount}
                </motion.span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Sliding Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/50 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
            />

            {/* Sidebar */}
            <motion.div
              className="fixed top-0 left-0 h-full w-72 sm:w-80 bg-background z-50 shadow-2xl"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
              {/* Sidebar Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <span className="text-lg font-semibold text-foreground">Categories</span>
                <motion.button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 rounded-xl hover:bg-muted transition-colors"
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Category Links */}
              <nav className="flex flex-col p-4 gap-1">
                {categories.map((category, index) => (
                  <motion.div
                    key={category.to}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      to={category.to}
                      onClick={() => setSidebarOpen(false)}
                      className={`block px-4 py-3.5 rounded-xl text-base font-medium transition-colors ${
                        location.search.includes(category.label.toLowerCase())
                          ? 'bg-primary/10 text-primary'
                          : 'text-foreground hover:bg-muted/50'
                      }`}
                    >
                      {category.label}
                    </Link>
                  </motion.div>
                ))}

                {/* Divider */}
                <div className="my-4 border-t border-border" />

                {/* Additional Links */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: categories.length * 0.05 }}
                >
                  <Link
                    to="/products"
                    onClick={() => setSidebarOpen(false)}
                    className="block px-4 py-3.5 rounded-xl text-base font-medium text-foreground hover:bg-muted/50 transition-colors"
                  >
                    All Products
                  </Link>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (categories.length + 1) * 0.05 }}
                >
                  <Link
                    to="/track-order"
                    onClick={() => setSidebarOpen(false)}
                    className="block px-4 py-3.5 rounded-xl text-base font-medium text-foreground hover:bg-muted/50 transition-colors"
                  >
                    Track Order
                  </Link>
                </motion.div>

                {canInstall && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (categories.length + 2) * 0.05 }}
                  >
                    <Link
                      to="/install"
                      onClick={() => setSidebarOpen(false)}
                      className="block px-4 py-3.5 rounded-xl text-base font-medium text-foreground hover:bg-muted/50 transition-colors"
                    >
                      Get App
                    </Link>
                  </motion.div>
                )}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
