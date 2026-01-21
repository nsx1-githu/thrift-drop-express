import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, CreditCard, Smartphone } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { toast } from 'sonner';

const upiApps = [
  { id: 'gpay', name: 'Google Pay', icon: '🟢' },
  { id: 'phonepe', name: 'PhonePe', icon: '🟣' },
  { id: 'paytm', name: 'Paytm', icon: '🔵' },
  { id: 'bhim', name: 'BHIM UPI', icon: '🟠' },
];

const Checkout = () => {
  const navigate = useNavigate();
  const { items, getTotal, clearCart } = useCartStore();
  const [selectedUpi, setSelectedUpi] = useState('gpay');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);

  const total = getTotal();
  const shippingFree = total >= 999;
  const shippingCost = shippingFree ? 0 : 79;
  const finalTotal = total + shippingCost;

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[6-9]\d{9}$/.test(formData.phone.trim())) {
      newErrors.phone = 'Enter a valid 10-digit phone number';
    }
    
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    } else if (formData.address.trim().length < 20) {
      newErrors.address = 'Please enter a complete address';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsProcessing(true);

    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Generate order ID
    const orderId = `THR${Date.now().toString(36).toUpperCase()}`;
    
    // Store order details for confirmation page
    sessionStorage.setItem('lastOrder', JSON.stringify({
      orderId,
      items,
      total: finalTotal,
      customerName: formData.name,
      paymentMethod: upiApps.find(app => app.id === selectedUpi)?.name,
    }));

    clearCart();
    navigate('/order-confirmation');
  };

  return (
    <div className="min-h-screen pb-32">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center gap-3 px-4 h-14">
          <button 
            onClick={() => navigate(-1)}
            className="p-1"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="font-semibold">Checkout</h1>
        </div>
      </div>

      <div className="px-4 py-4 space-y-6">
        {/* Order Summary */}
        <section>
          <h2 className="text-sm font-semibold mb-3">Order Summary</h2>
          <div className="space-y-2 p-4 bg-card rounded-sm border border-border">
            {items.map((item) => (
              <div key={item.product.id} className="flex justify-between text-sm">
                <span className="text-muted-foreground line-clamp-1 flex-1 mr-2">
                  {item.product.name}
                </span>
                <span>₹{item.product.price.toLocaleString()}</span>
              </div>
            ))}
            <div className="flex justify-between text-sm pt-2 border-t border-border">
              <span className="text-muted-foreground">Shipping</span>
              <span className={shippingFree ? 'text-success' : ''}>
                {shippingFree ? 'Free' : `₹${shippingCost}`}
              </span>
            </div>
            <div className="flex justify-between font-semibold text-cream pt-2 border-t border-border">
              <span>Total</span>
              <span className="price-tag">₹{finalTotal.toLocaleString()}</span>
            </div>
          </div>
        </section>

        {/* Delivery Details */}
        <section>
          <h2 className="text-sm font-semibold mb-3">Delivery Details</h2>
          <div className="space-y-3">
            <div>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Full Name"
                className={`input-field ${errors.name ? 'border-destructive' : ''}`}
              />
              {errors.name && (
                <p className="text-xs text-destructive mt-1">{errors.name}</p>
              )}
            </div>
            
            <div>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Phone Number (10 digits)"
                maxLength={10}
                className={`input-field ${errors.phone ? 'border-destructive' : ''}`}
              />
              {errors.phone && (
                <p className="text-xs text-destructive mt-1">{errors.phone}</p>
              )}
            </div>
            
            <div>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Complete Address (House/Flat, Street, City, State, Pincode)"
                rows={3}
                className={`input-field resize-none ${errors.address ? 'border-destructive' : ''}`}
              />
              {errors.address && (
                <p className="text-xs text-destructive mt-1">{errors.address}</p>
              )}
            </div>
          </div>
        </section>

        {/* Payment Method */}
        <section>
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Smartphone className="w-4 h-4" />
            Pay via UPI
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {upiApps.map((app) => (
              <button
                key={app.id}
                onClick={() => setSelectedUpi(app.id)}
                className={`upi-button ${selectedUpi === app.id ? 'selected' : ''}`}
              >
                <span className="text-lg">{app.icon}</span>
                <span className="text-sm">{app.name}</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            You'll be redirected to complete payment after placing the order.
          </p>
        </section>
      </div>

      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border">
        <button 
          onClick={handleSubmit}
          disabled={isProcessing}
          className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isProcessing ? (
            <>
              <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4" />
              Pay ₹{finalTotal.toLocaleString()}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Checkout;
