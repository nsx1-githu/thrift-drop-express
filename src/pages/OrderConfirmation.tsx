import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle, Package, Home } from 'lucide-react';

interface OrderData {
  orderId: string;
  items: Array<{
    product: {
      id: string;
      name: string;
      price: number;
      images: string[];
    };
    quantity: number;
  }>;
  total: number;
  customerName: string;
  paymentMethod: string;
}

const OrderConfirmation = () => {
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderData | null>(null);

  useEffect(() => {
    const orderData = sessionStorage.getItem('lastOrder');
    if (orderData) {
      setOrder(JSON.parse(orderData));
      // Clear after reading
      sessionStorage.removeItem('lastOrder');
    } else {
      // No order data, redirect home
      navigate('/');
    }
  }, [navigate]);

  if (!order) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 pb-20">
      <div className="w-full max-w-md text-center animate-slide-up">
        {/* Success Icon */}
        <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-success" />
        </div>

        <h1 className="text-2xl font-bold text-cream mb-2">Order Confirmed!</h1>
        <p className="text-muted-foreground mb-6">
          Thank you, {order.customerName.split(' ')[0]}! Your order has been placed.
        </p>

        {/* Order ID */}
        <div className="p-4 bg-card rounded-sm border border-border mb-6">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Order ID</p>
          <p className="font-mono text-lg text-primary">{order.orderId}</p>
        </div>

        {/* Order Details */}
        <div className="p-4 bg-card rounded-sm border border-border mb-6 text-left">
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Package className="w-4 h-4" />
            Order Details
          </h2>
          
          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.product.id} className="flex gap-3">
                <img 
                  src={item.product.images[0]} 
                  alt={item.product.name}
                  className="w-12 h-14 object-cover rounded-sm"
                />
                <div className="flex-1">
                  <p className="text-sm line-clamp-1">{item.product.name}</p>
                  <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                </div>
                <p className="text-sm font-mono"><span className="font-bold">₹</span>{item.product.price.toLocaleString()}</p>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center mt-4 pt-3 border-t border-border">
            <span className="font-semibold">Total Paid</span>
            <span className="price-tag text-lg"><span className="font-bold text-xl">₹</span>{order.total.toLocaleString()}</span>
          </div>
        </div>

        {/* Payment Info */}
        <div className="p-3 bg-success/10 rounded-sm border border-success/20 mb-6">
          <p className="text-sm text-success">
            ✓ Payment received via {order.paymentMethod}
          </p>
        </div>

        {/* What's Next */}
        <div className="text-left mb-8">
          <h2 className="text-sm font-semibold mb-2">What's Next?</h2>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• You'll receive an SMS confirmation shortly</li>
            <li>• Your order will be dispatched within 24 hours</li>
            <li>• Tracking details will be shared via SMS</li>
          </ul>
        </div>

        {/* CTAs */}
        <Link to="/" className="btn-primary w-full flex items-center justify-center gap-2">
          <Home className="w-4 h-4" />
          Continue Shopping
        </Link>
      </div>
    </div>
  );
};

export default OrderConfirmation;
