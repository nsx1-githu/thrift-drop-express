import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Copy, Check, QrCode } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Seller UPI details - update these with your actual details
const SELLER_UPI_ID = 'seller@upi';
const SELLER_NAME = 'Thrift Store';

const Checkout = () => {
  const navigate = useNavigate();
  const { items, getTotal, clearCart } = useCartStore();
  const [upiRefNumber, setUpiRefNumber] = useState('');
  const [copied, setCopied] = useState(false);
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

  const copyUpiId = async () => {
    await navigator.clipboard.writeText(SELLER_UPI_ID);
    setCopied(true);
    toast.success('UPI ID copied!');
    setTimeout(() => setCopied(false), 2000);
  };

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

    if (!upiRefNumber.trim()) {
      newErrors.upiRef = 'UPI reference number is required';
    } else if (upiRefNumber.trim().length < 8) {
      newErrors.upiRef = 'Enter a valid UPI transaction reference';
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

    try {
      // Generate order ID
      const orderId = `THR${Date.now().toString(36).toUpperCase()}`;
      
      // Prepare order items for database
      const orderItems = items.map(item => ({
        product_id: item.product.id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        image: item.product.images[0],
      }));

      // Save order to database
      const { error } = await supabase.from('orders').insert({
        order_id: orderId,
        customer_name: formData.name.trim(),
        customer_phone: formData.phone.trim(),
        customer_address: formData.address.trim(),
        items: orderItems,
        subtotal: total,
        shipping: shippingCost,
        total: finalTotal,
        payment_method: 'UPI',
        payment_status: 'pending', // Pending verification
        razorpay_payment_id: upiRefNumber.trim(), // Using this field for UPI reference
      });

      if (error) throw error;

      // Store order details for confirmation page
      sessionStorage.setItem('lastOrder', JSON.stringify({
        orderId,
        items,
        total: finalTotal,
        customerName: formData.name,
        paymentMethod: 'UPI (Pending Verification)',
      }));

      clearCart();
      navigate('/order-confirmation');
    } catch (error) {
      console.error('Order error:', error);
      toast.error('Failed to place order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Generate UPI payment link for QR code
  const upiPaymentLink = `upi://pay?pa=${SELLER_UPI_ID}&pn=${encodeURIComponent(SELLER_NAME)}&am=${finalTotal}&cu=INR`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiPaymentLink)}`;

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

        {/* UPI Payment Section */}
        <section>
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <QrCode className="w-4 h-4" />
            Pay via UPI
          </h2>
          
          <div className="p-4 bg-card rounded-sm border border-border space-y-4">
            {/* Amount to pay */}
            <div className="text-center pb-3 border-b border-border">
              <p className="text-sm text-muted-foreground">Amount to Pay</p>
              <p className="text-2xl font-bold text-primary">₹{finalTotal.toLocaleString()}</p>
            </div>

            {/* QR Code */}
            <div className="flex justify-center">
              <img 
                src={qrCodeUrl} 
                alt="UPI QR Code" 
                className="w-48 h-48 rounded-lg bg-white p-2"
              />
            </div>

            {/* UPI ID */}
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="text-xs text-muted-foreground">UPI ID</p>
                <p className="font-mono text-sm">{SELLER_UPI_ID}</p>
              </div>
              <button 
                onClick={copyUpiId}
                className="p-2 hover:bg-muted rounded-md transition-colors"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-success" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Instructions */}
            <div className="text-xs text-muted-foreground space-y-1">
              <p>1. Scan the QR code or copy UPI ID</p>
              <p>2. Pay ₹{finalTotal.toLocaleString()} using any UPI app</p>
              <p>3. Enter the transaction reference number below</p>
            </div>

            {/* Transaction Reference Input */}
            <div>
              <input
                type="text"
                value={upiRefNumber}
                onChange={(e) => {
                  setUpiRefNumber(e.target.value);
                  if (errors.upiRef) {
                    setErrors(prev => ({ ...prev, upiRef: '' }));
                  }
                }}
                placeholder="Enter UPI Transaction Reference Number"
                className={`input-field ${errors.upiRef ? 'border-destructive' : ''}`}
              />
              {errors.upiRef && (
                <p className="text-xs text-destructive mt-1">{errors.upiRef}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                You can find this in your UPI app's transaction history
              </p>
            </div>
          </div>
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
              Placing Order...
            </>
          ) : (
            'Confirm Order'
          )}
        </button>
        <p className="text-xs text-center text-muted-foreground mt-2">
          Order will be verified within 24 hours
        </p>
      </div>
    </div>
  );
};

export default Checkout;
