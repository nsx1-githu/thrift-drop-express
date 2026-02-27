import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, Search, Package, Clock, CheckCircle, XCircle, Truck, PackageCheck, MapPin, ExternalLink } from 'lucide-react';
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
  payment_status: 'pending' | 'verified' | 'failed' | 'locked' | 'payment_submitted' | 'paid' | 'cancelled' | 'expired';
  shipping_status: string;
  courier_name?: string | null;
  tracking_url?: string | null;
  awb_number?: string | null;
  created_at: string;
}

const TIMELINE_STEPS = [
  { key: 'placed', label: 'Order Placed', icon: Package },
  { key: 'accepted', label: 'Accepted', icon: CheckCircle },
  { key: 'packed', label: 'Packed', icon: PackageCheck },
  { key: 'dispatched', label: 'Dispatched', icon: Truck },
  { key: 'in_transit', label: 'In Transit', icon: MapPin },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle },
];

const SHIPPING_ORDER = ['none', 'accepted', 'packed', 'dispatched', 'in_transit', 'out_for_delivery', 'delivered'];

const getStepIndex = (shippingStatus: string) => {
  const idx = SHIPPING_ORDER.indexOf(shippingStatus);
  return idx === -1 ? 0 : idx;
};

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

  const isPaymentAccepted = (status: string) => ['paid', 'verified'].includes(status);
  const isPaymentFailed = (status: string) => ['failed', 'cancelled', 'expired'].includes(status);

  const getStatusMessage = (order: Order) => {
    if (isPaymentFailed(order.payment_status)) {
      return 'Payment verification failed. Please contact support or place a new order.';
    }
    if (order.payment_status === 'locked') return 'Your order is reserved. Please complete payment within the timer.';
    if (order.payment_status === 'payment_submitted') return 'Your payment has been submitted and is being reviewed.';
    if (order.payment_status === 'pending') return 'Your payment is being verified. This usually takes up to 24 hours.';
    
    // Payment accepted — show shipping status message
    switch (order.shipping_status) {
      case 'accepted': return 'Your order has been accepted and is being prepared.';
      case 'packed': return 'Your order is packed and ready for dispatch.';
      case 'dispatched': return `Your order has been dispatched!${order.courier_name ? ` Courier: ${order.courier_name}` : ''}`;
      case 'in_transit': return 'Your order is in transit and on its way to you.';
      case 'out_for_delivery': return '🎉 Your order is out for delivery! Please be available.';
      case 'delivered': return '✅ Your order has been delivered! Thank you for shopping with us.';
      default: return 'Payment verified! Your order is being processed.';
    }
  };

  const currentShippingStep = order ? getStepIndex(order.shipping_status) : 0;

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
            <input type="text" value={orderId} onChange={(e) => setOrderId(e.target.value.toUpperCase())} placeholder="Order ID (e.g., THR123ABC)" className="input-field font-mono" />
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone Number (used during order)" maxLength={10} className="input-field" />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <><div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />Searching...</>
              ) : (
                <><Search className="w-4 h-4 mr-2" />Track Order</>
              )}
            </Button>
          </form>
        </div>

        {/* Order Details */}
        {searched && !isLoading && (
          <>
            {order ? (
              <div className="space-y-4">
                {/* Order Header */}
                <div className="bg-card rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Placed on {new Date(order.created_at).toLocaleDateString()}</p>
                    </div>
                    <p className="font-semibold"><span className="font-bold">₹</span>{order.total.toLocaleString()}</p>
                  </div>

                  {/* Failed/Cancelled State */}
                  {isPaymentFailed(order.payment_status) ? (
                    <div className="flex items-center gap-3 p-3 bg-status-failed/10 rounded-lg border border-status-failed/20">
                      <XCircle className="w-6 h-6 text-status-failed flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-status-failed">
                          {order.payment_status === 'expired' ? 'Order Expired' : 'Payment Failed'}
                        </p>
                        <p className="text-xs text-muted-foreground">{getStatusMessage(order)}</p>
                      </div>
                    </div>
                  ) : (
                    /* Detailed Timeline */
                    <div className="space-y-0">
                      {TIMELINE_STEPS.map((step, idx) => {
                        // Step 0 (placed) is always done if order exists
                        // For payment pending states, only show up to placed
                        const isPlaced = idx === 0;
                        const isCompleted = isPlaced
                          ? true
                          : isPaymentAccepted(order.payment_status) && idx <= currentShippingStep;
                        const isCurrent = isPlaced
                          ? !isPaymentAccepted(order.payment_status) && (order.payment_status === 'pending' || order.payment_status === 'payment_submitted' || order.payment_status === 'locked')
                          : isPaymentAccepted(order.payment_status) && idx === currentShippingStep;
                        const isPending = !isCompleted && !isCurrent;
                        const isLast = idx === TIMELINE_STEPS.length - 1;

                        const Icon = step.icon;

                        return (
                          <div key={step.key} className="flex gap-3">
                            <div className="flex flex-col items-center">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                                isCompleted
                                  ? 'bg-status-verified'
                                  : isCurrent
                                    ? 'bg-amber-500'
                                    : 'bg-muted'
                              }`}>
                                {isCompleted ? (
                                  <CheckCircle className="w-4 h-4 text-status-verified-foreground" />
                                ) : isCurrent ? (
                                  <Clock className="w-4 h-4 text-white" />
                                ) : (
                                  <Icon className="w-4 h-4 text-muted-foreground" />
                                )}
                              </div>
                              {!isLast && (
                                <div className={`w-0.5 h-8 ${isCompleted && !isCurrent ? 'bg-status-verified/50' : 'bg-border'}`} />
                              )}
                            </div>
                            <div className={isLast ? '' : 'pb-4'}>
                              <p className={`font-semibold text-sm ${isPending ? 'text-muted-foreground' : ''}`}>
                                {step.label}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {isPlaced
                                  ? new Date(order.created_at).toLocaleString()
                                  : isCompleted
                                    ? step.key === order.shipping_status ? 'Current' : '✓'
                                    : isCurrent
                                      ? 'In progress...'
                                      : 'Pending'}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Status Message */}
                  <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm">{getStatusMessage(order)}</p>
                  </div>

                  {/* Courier Tracking Link */}
                  {order.tracking_url && (
                    <a
                      href={order.tracking_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 flex items-center justify-center gap-2 p-3 bg-primary/10 rounded-lg border border-primary/20 text-primary font-medium text-sm hover:bg-primary/20 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Track on {order.courier_name || 'Courier'} Website
                    </a>
                  )}

                  {/* AWB Number */}
                  {order.awb_number && (
                    <div className="mt-2 p-2 bg-muted/30 rounded-lg text-center">
                      <p className="text-xs text-muted-foreground">Tracking Number</p>
                      <p className="font-mono font-semibold text-sm">{order.awb_number}</p>
                    </div>
                  )}
                </div>

                {/* Order Items */}
                <div className="bg-card rounded-lg border border-border p-4">
                  <h3 className="text-sm font-semibold mb-3">Order Items</h3>
                  <div className="space-y-3">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <img src={item.image} alt={item.name} className="w-16 h-16 rounded object-cover" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            <span className="font-bold">₹</span>{item.price.toLocaleString()} × {item.quantity}
                          </p>
                        </div>
                        <p className="font-semibold text-sm">
                          <span className="font-bold">₹</span>{(item.price * item.quantity).toLocaleString()}
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
                <p className="text-sm text-muted-foreground">Please check your order ID and phone number and try again.</p>
              </div>
            )}
          </>
        )}

        {!searched && (
          <div className="text-center py-8">
            <Search className="w-16 h-16 mx-auto mb-3 text-muted-foreground/50" />
            <h3 className="font-semibold mb-1">Track Your Order</h3>
            <p className="text-sm text-muted-foreground">Enter your order ID and phone number to see the current status.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackOrder;
