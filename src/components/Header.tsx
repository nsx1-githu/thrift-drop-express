import { ShoppingBag, Search, Menu, Bell } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '@/store/cartStore';
import { useNotificationStore } from '@/store/notificationStore';
import { useState, useRef } from 'react';

const REQUIRED_TAPS = 5;
const TAP_TIME_WINDOW = 2000; // 2 seconds

export const Header = () => {
  const navigate = useNavigate();
  const itemCount = useCartStore((state) => state.getItemCount());
  const unreadCount = useNotificationStore((state) => state.getUnreadCount());
  const [menuOpen, setMenuOpen] = useState(false);
  const tapTimestamps = useRef<number[]>([]);

  const handleLogoTap = (e: React.MouseEvent) => {
    const now = Date.now();
    
    // Filter out old taps outside the time window
    tapTimestamps.current = tapTimestamps.current.filter(
      (timestamp) => now - timestamp < TAP_TIME_WINDOW
    );
    
    // Add current tap
    tapTimestamps.current.push(now);

    // Check if we have enough taps
    if (tapTimestamps.current.length >= REQUIRED_TAPS) {
      e.preventDefault();
      tapTimestamps.current = []; // Reset
      navigate('/admin/login');
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container flex items-center justify-between h-14 px-4">
        <Link to="/" className="flex items-center gap-2" onClick={handleLogoTap}>
          <span className="text-xl font-bold tracking-tight text-cream">THRIFT</span>
          <span className="text-xs font-mono text-muted-foreground">DROPS</span>
        </Link>

        <div className="flex items-center gap-2">
          <Link 
            to="/search" 
            className="p-2 rounded-sm hover:bg-secondary transition-colors"
            aria-label="Search"
          >
            <Search className="w-5 h-5 text-muted-foreground" />
          </Link>

          <Link 
            to="/notifications" 
            className="relative p-2 rounded-sm hover:bg-secondary transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 text-muted-foreground" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 flex items-center justify-center text-[10px] font-bold bg-destructive text-destructive-foreground rounded-full">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>

          <Link 
            to="/cart" 
            className="relative p-2 rounded-sm hover:bg-secondary transition-colors"
            aria-label="Cart"
          >
            <ShoppingBag className="w-5 h-5 text-muted-foreground" />
            {itemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 flex items-center justify-center text-[10px] font-bold bg-primary text-primary-foreground rounded-full">
                {itemCount}
              </span>
            )}
          </Link>

          <button 
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-sm hover:bg-secondary transition-colors md:hidden"
            aria-label="Menu"
          >
            <Menu className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <nav className="md:hidden border-t border-border bg-background animate-fade-in">
          <div className="container px-4 py-3 space-y-2">
            <Link 
              to="/" 
              className="block py-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              Home
            </Link>
            <Link 
              to="/products" 
              className="block py-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              All Products
            </Link>
            <Link 
              to="/track-order" 
              className="block py-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              Track Order
            </Link>
            <Link 
              to="/cart" 
              className="block py-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              Cart ({itemCount})
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
};
