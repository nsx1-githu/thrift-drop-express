import { useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, ShoppingBag, Bell, Menu, X, Download } from 'lucide-react';
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
      <div className="flex items-center justify-between h-16 px-5">
        {/* Logo */}
        <Link to="/" onClick={handleLogoTap} className="flex items-center gap-3">
          {logoUrl ? (
            <img src={logoUrl} alt={storeName} className="h-8 w-auto object-contain" />
          ) : (
            <span className="text-lg font-semibold tracking-tight text-foreground">
              {storeName}
            </span>
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
        <div className="flex items-center gap-1">
          {canInstall && (
            <Link
              to="/install"
              className="hidden md:flex p-2.5 rounded-xl hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
            >
              <Download className="w-5 h-5" />
            </Link>
          )}
          
          <Link
            to="/search"
            className="p-2.5 rounded-xl hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
          >
            <Search className="w-5 h-5" />
          </Link>

          <Link
            to="/notifications"
            className="relative p-2.5 rounded-xl hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
            )}
          </Link>

          <Link
            to="/cart"
            className="relative p-2.5 rounded-xl hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
          >
            <ShoppingBag className="w-5 h-5" />
            {itemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 flex items-center justify-center text-[10px] font-bold bg-primary text-primary-foreground rounded-full">
                {itemCount}
              </span>
            )}
          </Link>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2.5 rounded-xl hover:bg-muted/50 transition-colors text-muted-foreground"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-background/95 backdrop-blur-xl border-b border-border animate-fade-in">
          <nav className="flex flex-col p-4 gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className={`px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  location.pathname === link.to
                    ? 'bg-primary/10 text-primary'
                    : 'text-foreground hover:bg-muted/50'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
};
