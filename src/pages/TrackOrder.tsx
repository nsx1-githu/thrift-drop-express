import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, Search, Package, Clock, CheckCircle, XCircle, Truck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

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
  created_at: string;
}

const TrackOrder = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialOrderId = searchParams.get('id') || '';
  
  const [orderId, setOrderId] = useState(initialOrderId);
  const [phone, setPhone] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!orderId.trim() || !phone.trim()) {
      toast.error('Please enter order ID and phone number');
      return;
    }

    setIsLoading(true);
    setSearched(true);

    try {
      const { data, error } = await (supabase as any)
        .rpc('track_order', {
          _order_id: orderId.trim().toUpperCase(),
          _customer_phone: phone.trim(),
        });

      if (error) throw error;

      const row = Array.isArray(data) ? data[0] : null;
      if (row) {
        setOrder(row as unknown as Order);
      } else {
        setOrder(null);
        toast.error('Order not found. Please check your details.');
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      toast.error('Failed to fetch order');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusStep = (status: string) => {
    switch (status) {
      case 'pending': return 1;
      case 'verified': return 2;
      case 'failed': return -1;
      default: return 0;
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'pending': 
        return 'Your payment is being verified. This usually takes up to 24 hours.';
      case 'verified': 
        return 'Payment verified! Your order is being processed and will be shipped soon.';
      case 'failed': 
        return 'Payment verification failed. Please contact support or place a new order.';
      default: 
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center gap-3 px-4 h-14">
          <button onClick={() => navigate('/')} className="p-1">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="font-semibold">Track Order</h1>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Search Form */}
        <div className="bg-card rounded-lg border border-border p-4">
          <h2 className="text-sm font-semibold mb-3">Enter Order Details</h2>
          <form onSubmit={handleSearch} className="space-y-3">
            <input
              type="text"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value.toUpperCase())}
              placeholder="Order ID (e.g., THR123ABC)"
              className="input-field font-mono"
            />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone Number (used during order)"
              maxLength={10}
              className="input-field"
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Track Order
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Order Details */}
        {searched && !isLoading && (
          <>
            {order ? (
              <div className="space-y-4">
                {/* Order Status */}
                <div className="bg-card rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Placed on {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="font-semibold">₹{order.total.toLocaleString()}</p>
                  </div>

                  {/* Status Timeline */}
                  <div className="relative">
                    {order.payment_status === 'failed' ? (
                      <div className="flex items-center gap-3 p-3 bg-status-failed/10 rounded-lg border border-status-failed/20">
                        <XCircle className="w-6 h-6 text-status-failed" />
                        <div>
                          <p className="font-semibold text-status-failed">Payment Failed</p>
                          <p className="text-xs text-muted-foreground">{getStatusMessage('failed')}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-0">
                        {/* Step 1: Order Placed */}
                        <div className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className="w-8 h-8 rounded-full bg-status-verified flex items-center justify-center">
                              <CheckCircle className="w-4 h-4 text-status-verified-foreground" />
                            </div>
                            <div className="w-0.5 h-8 bg-border" />
                          </div>
                          <div className="pb-4">
                            <p className="font-semibold text-sm">Order Placed</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(order.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        {/* Step 2: Payment Verification */}
                        <div className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              getStatusStep(order.payment_status) >= 1 
                                ? getStatusStep(order.payment_status) >= 2 
                                  ? 'bg-green-500' 
                                  : 'bg-yellow-500'
                                : 'bg-muted'
                            }`}>
                              {getStatusStep(order.payment_status) >= 2 ? (
                                <CheckCircle className="w-4 h-4 text-white" />
                              ) : getStatusStep(order.payment_status) >= 1 ? (
                                <Clock className="w-4 h-4 text-white" />
                              ) : (
                                <Clock className="w-4 h-4 text-muted-foreground" />
                              )}
                            </div>
                            <div className="w-0.5 h-8 bg-border" />
                          </div>
                          <div className="pb-4">
                            <p className={`font-semibold text-sm ${
                              getStatusStep(order.payment_status) >= 1 ? '' : 'text-muted-foreground'
                            }`}>
                              Payment Verification
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {order.payment_status === 'pending' 
                                ? 'In progress...' 
                                : order.payment_status === 'verified' 
                                  ? 'Verified ✓' 
                                  : 'Pending'}
                            </p>
                          </div>
                        </div>

                        {/* Step 3: Processing */}
                        <div className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              getStatusStep(order.payment_status) >= 2 ? 'bg-green-500' : 'bg-muted'
                            }`}>
                              <Package className={`w-4 h-4 ${
                                getStatusStep(order.payment_status) >= 2 ? 'text-white' : 'text-muted-foreground'
                              }`} />
                            </div>
                            <div className="w-0.5 h-8 bg-border" />
                          </div>
                          <div className="pb-4">
                            <p className={`font-semibold text-sm ${
                              getStatusStep(order.payment_status) >= 2 ? '' : 'text-muted-foreground'
                            }`}>
                              Order Processing
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {getStatusStep(order.payment_status) >= 2 ? 'Being prepared' : 'Pending'}
                            </p>
                          </div>
                        </div>

                        {/* Step 4: Shipped */}
                        <div className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                              <Truck className="w-4 h-4 text-muted-foreground" />
                            </div>
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-muted-foreground">Shipped</p>
                            <p className="text-xs text-muted-foreground">Pending</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Status Message */}
                  <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm">{getStatusMessage(order.payment_status)}</p>
                  </div>
                </div>

                {/* Order Items */}
                <div className="bg-card rounded-lg border border-border p-4">
                  <h3 className="text-sm font-semibold mb-3">Order Items</h3>
                  <div className="space-y-3">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <img 
                          src={item.image} 
                          alt={item.name}
                          className="w-16 h-16 rounded object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            ₹{item.price.toLocaleString()} × {item.quantity}
                          </p>
                        </div>
                        <p className="font-semibold text-sm">
                          ₹{(item.price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Delivery Address */}
                <div className="bg-card rounded-lg border border-border p-4">
                  <h3 className="text-sm font-semibold mb-2">Delivery Address</h3>
                  <p className="text-sm">{order.customer_name}</p>
                  <p className="text-sm text-muted-foreground">{order.customer_phone}</p>
                  <p className="text-sm text-muted-foreground mt-1">{order.customer_address}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="w-16 h-16 mx-auto mb-3 text-muted-foreground/50" />
                <h3 className="font-semibold mb-1">Order Not Found</h3>
                <p className="text-sm text-muted-foreground">
                  Please check your order ID and phone number and try again.
                </p>
              </div>
            )}
          </>
        )}

        {/* Instructions */}
        {!searched && (
          <div className="text-center py-8">
            <Search className="w-16 h-16 mx-auto mb-3 text-muted-foreground/50" />
            <h3 className="font-semibold mb-1">Track Your Order</h3>
            <p className="text-sm text-muted-foreground">
              Enter your order ID and phone number to see the current status.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackOrder;
