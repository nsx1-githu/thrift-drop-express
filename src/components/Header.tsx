import { useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, ShoppingBag, Bell, Menu, X, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCartStore } from '@/store/cartStore';
import { useNotificationStore } from '@/store/notificationStore';
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { usePwaInstallAvailable } from "@/hooks/usePwaInstallAvailable";

const REQUIRED_TAPS = 5;
const TAP_TIME_WINDOW = 2000;

export const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
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

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/products', label: 'Shop' },
    { to: '/track-order', label: 'Track Order' },
    ...(canInstall ? [{ to: '/install', label: 'Get App' }] : []),
  ];

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="flex items-center justify-between h-20 px-5">
        {/* Logo */}
        <Link to="/" onClick={handleLogoTap} className="flex items-center gap-3 group">
          {logoUrl ? (
            <motion.div
              className="relative overflow-hidden rounded-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <img 
                src={logoUrl} 
                alt={storeName} 
                className="h-12 w-auto object-contain relative z-10"
              />
              <motion.div 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"
              />
            </motion.div>
          ) : (
            <motion.span 
              className="relative text-xl font-bold tracking-tight overflow-hidden"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="relative z-10 bg-gradient-to-r from-foreground via-primary to-foreground bg-[length:200%_100%] bg-clip-text text-transparent animate-shimmer">
                {storeName}
              </span>
            </motion.span>
          )}
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`text-sm font-medium transition-colors ${
                location.pathname === link.to 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {canInstall && (
            <Link
              to="/install"
              className="hidden md:flex p-3 rounded-2xl hover:bg-primary/10 transition-all duration-200 text-muted-foreground hover:text-primary"
            >
              <Download className="w-6 h-6" />
            </Link>
          )}
          
          <Link
            to="/search"
            className="p-3 rounded-2xl hover:bg-primary/10 transition-all duration-200 text-muted-foreground hover:text-primary"
          >
            <Search className="w-6 h-6" />
          </Link>

          <Link
            to="/notifications"
            className="relative p-3 rounded-2xl hover:bg-primary/10 transition-all duration-200 text-muted-foreground hover:text-primary"
          >
            <Bell className="w-6 h-6" />
            {unreadCount > 0 && (
              <motion.span 
                className="absolute top-1.5 right-1.5 w-3 h-3 bg-gradient-to-br from-primary to-primary/80 rounded-full ring-2 ring-background shadow-lg shadow-primary/40"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500 }}
              />
            )}
          </Link>

          <Link
            to="/cart"
            className="relative p-3 rounded-2xl hover:bg-primary/10 transition-all duration-200 text-muted-foreground hover:text-primary"
          >
            <ShoppingBag className="w-6 h-6" />
            {itemCount > 0 && (
              <motion.span 
                className="absolute -top-0.5 -right-0.5 w-6 h-6 flex items-center justify-center text-xs font-bold bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-full shadow-lg shadow-primary/30 ring-2 ring-background"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500 }}
                key={itemCount}
              >
                {itemCount}
              </motion.span>
            )}
          </Link>

          {/* Mobile Menu Toggle */}
          <motion.button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-3 rounded-2xl hover:bg-primary/10 transition-all duration-200 text-muted-foreground hover:text-primary"
            whileTap={{ scale: 0.9 }}
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </motion.button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <motion.div 
          className="md:hidden absolute top-20 left-0 right-0 bg-background/95 backdrop-blur-xl border-b border-border"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <nav className="flex flex-col p-4 gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className={`px-4 py-3.5 rounded-xl text-base font-medium transition-colors ${
                  location.pathname === link.to
                    ? 'bg-primary/10 text-primary'
                    : 'text-foreground hover:bg-muted/50'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </motion.div>
      )}
    </header>
  );
};