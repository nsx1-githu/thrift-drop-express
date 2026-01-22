import { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, Package, Search, RefreshCw, Phone, Copy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface OrderItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface Order {
  id: string;
  order_id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  payment_method: string;
  payment_status: 'pending' | 'verified' | 'failed';
  razorpay_payment_id: string | null;
  created_at: string;
  updated_at: string;
}

export const OrdersPanel = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const copyText = async (text: string, label: string) => {
    const value = (text ?? '').trim();
    if (!value) {
      toast.error(`${label} not available`);
      return;
    }

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const el = document.createElement('textarea');
        el.value = value;
        el.style.position = 'fixed';
        el.style.opacity = '0';
        document.body.appendChild(el);
        el.focus();
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
      }
      toast.success(`${label} copied`);
    } catch (e) {
      console.error('Copy failed:', e);
      toast.error('Copy failed');
    }
  };

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders((data as unknown as Order[]) || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    // Set up realtime subscription
    const channel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          fetchOrders();
          toast.info('Orders updated');
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const updateOrderStatus = async (orderId: string, status: 'verified' | 'failed') => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ payment_status: status })
        .eq('id', orderId);

      if (error) throw error;
      
      toast.success(`Order marked as ${status}`);
      fetchOrders();
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Failed to update order');
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesFilter = filter === 'all' || order.payment_status === filter;
    const matchesSearch = 
      order.order_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_phone.includes(searchQuery);
    return matchesFilter && matchesSearch;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'verified': return <CheckCircle className="w-4 h-4" />;
      case 'failed': return <XCircle className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-status-pending/10 text-status-pending border-status-pending/20';
      case 'verified': return 'bg-status-verified/10 text-status-verified border-status-verified/20';
      case 'failed': return 'bg-status-failed/10 text-status-failed border-status-failed/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.payment_status === 'pending').length,
    verified: orders.filter(o => o.payment_status === 'verified').length,
    failed: orders.filter(o => o.payment_status === 'failed').length,
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        <div className="p-3 bg-card rounded-lg border border-border text-center">
          <p className="text-xl font-bold">{stats.total}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </div>
        <div className="p-3 bg-status-pending/5 rounded-lg border border-status-pending/20 text-center">
          <p className="text-xl font-bold text-status-pending">{stats.pending}</p>
          <p className="text-xs text-status-pending/80">Pending</p>
        </div>
        <div className="p-3 bg-status-verified/5 rounded-lg border border-status-verified/20 text-center">
          <p className="text-xl font-bold text-status-verified">{stats.verified}</p>
          <p className="text-xs text-status-verified/80">Verified</p>
        </div>
        <div className="p-3 bg-status-failed/5 rounded-lg border border-status-failed/20 text-center">
          <p className="text-xl font-bold text-status-failed">{stats.failed}</p>
          <p className="text-xs text-status-failed/80">Failed</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search orders..."
            className="input-field pl-9"
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={fetchOrders}>
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No orders found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => (
            <div 
              key={order.id} 
              className="bg-card rounded-lg border border-border overflow-hidden"
            >
              {/* Order Header */}
              <button
                onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                className="w-full p-4 text-left"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm font-semibold">{order.order_id}</span>
                      <Badge className={`${getStatusColor(order.payment_status)} border`}>
                        {getStatusIcon(order.payment_status)}
                        <span className="ml-1 capitalize">{order.payment_status}</span>
                      </Badge>
                    </div>
                    <p className="text-sm">{order.customer_name}</p>
                    <p className="text-xs text-muted-foreground">{order.customer_phone}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">₹{order.total.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </button>

              {/* Expanded Details */}
              {expandedOrder === order.id && (
                <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
                  {/* Quick actions */}
                  <div className="flex flex-wrap gap-2">
                    <Button asChild variant="outline" size="sm" className="h-9">
                      <a href={`tel:${order.customer_phone}`}>
                        <Phone className="w-4 h-4 mr-2" />
                        Call customer
                      </a>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9"
                      onClick={() => copyText(order.customer_phone, 'Phone')}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy phone
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9"
                      onClick={() => copyText(order.customer_address, 'Address')}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy address
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9"
                      onClick={() => copyText(order.razorpay_payment_id || '', 'UTR')}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy UTR
                    </Button>
                  </div>

                  {/* Items */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2">ITEMS</p>
                    <div className="space-y-2">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <img 
                            src={item.image} 
                            alt={item.name}
                            className="w-12 h-12 rounded object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate">{item.name}</p>
                            <p className="text-xs text-muted-foreground">
                              ₹{item.price.toLocaleString()} × {item.quantity}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">ADDRESS</p>
                    <p className="text-sm">{order.customer_address}</p>
                  </div>

                  {/* UPI Reference */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">UPI REFERENCE</p>
                    <p className="font-mono text-sm bg-muted/50 px-2 py-1 rounded">
                      {order.razorpay_payment_id || 'Not provided'}
                    </p>
                  </div>

                  {/* Payment Summary */}
                  <div className="flex justify-between text-sm pt-2 border-t border-border">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>₹{order.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>{order.shipping === 0 ? 'Free' : `₹${order.shipping}`}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>₹{order.total.toLocaleString()}</span>
                  </div>

                  {/* Actions */}
                  {order.payment_status === 'pending' && (
                    <div className="flex gap-2 pt-2">
                      <Button 
                        onClick={() => updateOrderStatus(order.id, 'verified')}
                        className="flex-1 bg-status-verified hover:bg-status-verified/90 text-status-verified-foreground"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                         Accept Order
                      </Button>
                      <Button 
                        onClick={() => updateOrderStatus(order.id, 'failed')}
                        variant="destructive"
                        className="flex-1"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                         Reject Order
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
