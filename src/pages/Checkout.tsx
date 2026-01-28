import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Copy, Check, QrCode, Loader2, Shield, Upload, AlertTriangle, Lock } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useNotificationStore } from '@/store/notificationStore';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useCartAvailability } from '@/hooks/useCartAvailability';
import { ReservationTimer } from '@/components/checkout/ReservationTimer';
import { motion } from 'framer-motion';

interface StoreSettings {
  store_name: string;
  upi_id: string;
  upi_qr_image: string;
}

interface ReservationState {
  orderId: string;
  expiresAt: string;
}

const Checkout = () => {
  const navigate = useNavigate();
  const { items, getTotal, clearCart, removeItem } = useCartStore();
  const { addNotification, upsertCustomerOrder } = useNotificationStore();
  
  // Monitor cart items for real-time availability
  useCartAvailability();
  
  // Step tracking: 'details' or 'payment'
  const [step, setStep] = useState<'details' | 'payment'>('details');
  const [reservation, setReservation] = useState<ReservationState | null>(null);
  const [isReservationExpired, setIsReservationExpired] = useState(false);
  
  const [upiRefNumber, setUpiRefNumber] = useState('');
  const [paymentPayerName, setPaymentPayerName] = useState('');
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    pincode: '',
    state: '',
    city: '',
    area: '',
    landmark: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [settings, setSettings] = useState<StoreSettings>({
    store_name: 'Thrift Store',
    upi_id: 'seller@upi',
    upi_qr_image: '',
  });
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  const total = Math.round(getTotal());
  const shippingCost = 200;
  const finalTotal = total + shippingCost;

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('store_settings')
          .select('key, value');

        if (error) throw error;

        const settingsMap: StoreSettings = {
          store_name: 'Thrift Store',
          upi_id: 'seller@upi',
          upi_qr_image: '',
        };

        data?.forEach((item) => {
          if (item.key in settingsMap) {
            settingsMap[item.key as keyof StoreSettings] = item.value;
          }
        });

        setSettings(settingsMap);
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setIsLoadingSettings(false);
      }
    };

    fetchSettings();
  }, []);

  useEffect(() => {
    if (items.length === 0 && !reservation) navigate('/cart');
  }, [items.length, navigate, reservation]);

  if (items.length === 0 && !reservation) return null;

  const copyUpiId = async () => {
    await navigator.clipboard.writeText(settings.upi_id);
    setCopied(true);
    toast.success('UPI ID copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const validateDeliveryForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[6-9]\d{9}$/.test(formData.phone.trim())) {
      newErrors.phone = 'Enter a valid 10-digit phone number';
    }
    if (!formData.pincode.trim()) {
      newErrors.pincode = 'Pincode is required';
    } else if (!/^\d{6}$/.test(formData.pincode.trim())) {
      newErrors.pincode = 'Enter a valid 6-digit pincode';
    }
    if (!formData.state.trim()) newErrors.state = 'State is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.area.trim()) {
      newErrors.area = 'Area/Locality is required';
    } else if (formData.area.trim().length < 5) {
      newErrors.area = 'Please enter a complete address';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePaymentForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!upiRefNumber.trim()) {
      newErrors.upiRef = 'UPI reference number is required';
    } else if (upiRefNumber.trim().length < 8) {
      newErrors.upiRef = 'Enter a valid UPI transaction reference';
    }
    if (!paymentPayerName.trim()) {
      newErrors.payerName = 'Payer name is required';
    } else if (paymentPayerName.trim().length > 120) {
      newErrors.payerName = 'Payer name is too long';
    }
    if (!paymentProof) {
      newErrors.paymentProof = 'Payment screenshot is required';
    } else if (!paymentProof.type.startsWith('image/')) {
      newErrors.paymentProof = 'Please upload an image file';
    } else if (paymentProof.size > 2 * 1024 * 1024) {
      newErrors.paymentProof = 'Image must be less than 2MB';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  // Step 1: Reserve order and lock products
  const handleReserveOrder = async () => {
    if (!validateDeliveryForm()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsProcessing(true);

    try {
      const orderItems = items.map(item => ({
        product_id: item.product.id,
        name: item.product.name,
        price: Math.round(item.product.price),
        quantity: item.quantity,
        image: item.product.images[0],
      }));

      // Build full address from parts
      const fullAddress = [
        formData.area.trim(),
        formData.landmark.trim() ? `Near ${formData.landmark.trim()}` : '',
        formData.city.trim(),
        formData.state.trim(),
        formData.pincode.trim(),
      ].filter(Boolean).join(', ');

      // Get product IDs (filter to valid UUIDs)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      const productIds = items
        .map(item => item.product.id)
        .filter(id => uuidRegex.test(id));

      // Call the reservation RPC function
      const { data, error } = await supabase.rpc('create_order_reservation', {
        _customer_name: formData.name.trim(),
        _customer_phone: formData.phone.trim(),
        _customer_address: fullAddress,
        _pincode: formData.pincode.trim(),
        _state: formData.state.trim(),
        _city: formData.city.trim(),
        _area: formData.area.trim(),
        _landmark: formData.landmark.trim() || '',
        _items: orderItems,
        _subtotal: total,
        _shipping: Math.round(shippingCost),
        _total: Math.round(finalTotal),
        _payment_method: 'UPI',
        _product_ids: productIds,
      });

      if (error) throw error;

      const result = data?.[0];
      
      if (!result?.success) {
        // Products unavailable
        const unavailable = result?.unavailable_products as Array<{ id: string; name: string }> | null;
        if (unavailable && unavailable.length > 0) {
          unavailable.forEach(p => removeItem(p.id));
          toast.error(`Some items are no longer available: ${unavailable.map(p => p.name).join(', ')}`, {
            duration: 5000,
            icon: <AlertTriangle className="w-4 h-4" />,
          });
        } else {
          toast.error('Unable to reserve order. Please try again.');
        }
        return;
      }

      // Success! Store reservation and move to payment step
      setReservation({
        orderId: result.order_id,
        expiresAt: result.expires_at,
      });
      setStep('payment');
      toast.success('Order reserved! Complete payment within 10 minutes.');
    } catch (error) {
      console.error('Reservation error:', error);
      const message =
        (error as any)?.message ||
        (error as any)?.error_description ||
        'Failed to reserve order. Please try again.';
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Step 2: Submit payment details via edge function (server-side upload)
  const handleSubmitPayment = async () => {
    if (!reservation) {
      toast.error('No active reservation');
      return;
    }

    if (!validatePaymentForm()) {
      toast.error('Please fill in all payment details');
      return;
    }

    setIsProcessing(true);

    try {
      // Convert payment proof to base64 for server-side upload
      let paymentProofBase64 = '';
      if (paymentProof) {
        const arrayBuffer = await paymentProof.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        paymentProofBase64 = btoa(binary);
      }

      // Submit payment via edge function (handles server-side image upload)
      const { data, error } = await supabase.functions.invoke('submit-payment', {
        body: {
          order_id: reservation.orderId,
          customer_phone: formData.phone.trim(),
          payment_reference: upiRefNumber.trim(),
          payment_payer_name: paymentPayerName.trim(),
          payment_proof_base64: paymentProofBase64,
          payment_proof_mime: paymentProof?.type,
        },
      });

      if (error) throw error;

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to submit payment');
      }

      // Success!
      addNotification({
        title: 'Payment Submitted!',
        message: `Your order ${reservation.orderId} is being verified. You'll be notified once confirmed.`,
        type: 'order',
        orderId: reservation.orderId,
      });

      upsertCustomerOrder({
        orderId: reservation.orderId,
        phone: formData.phone.trim(),
        status: 'pending',
      });

      sessionStorage.setItem('lastOrder', JSON.stringify({
        orderId: reservation.orderId,
        items,
        total: finalTotal,
        customerName: formData.name,
        paymentMethod: 'UPI (Pending Verification)',
      }));

      clearCart();
      navigate('/order-confirmation');
    } catch (error) {
      console.error('Payment submission error:', error);
      const message =
        (error as any)?.message ||
        (error as any)?.error_description ||
        'Failed to submit payment. Please try again.';
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReservationExpire = () => {
    setIsReservationExpired(true);
    toast.error('Reservation expired. Please place the order again.');
  };

  const handleStartOver = () => {
    setReservation(null);
    setStep('details');
    setIsReservationExpired(false);
    setUpiRefNumber('');
    setPaymentPayerName('');
    setPaymentProof(null);
    setErrors({});
  };

  const upiPaymentLink = `upi://pay?pa=${settings.upi_id}&pn=${encodeURIComponent(settings.store_name)}&am=${finalTotal}&cu=INR`;
  const generatedQrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiPaymentLink)}`;
  const qrCodeUrl = settings.upi_qr_image || generatedQrCodeUrl;

  return (
    <div className="min-h-screen pb-40">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center gap-4 px-5 h-16">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl hover:bg-muted/50 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest">Secure</p>
            <h1 className="font-semibold">Checkout</h1>
          </div>
          {/* Step indicator */}
          <div className="ml-auto flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${step === 'details' ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`w-2 h-2 rounded-full ${step === 'payment' ? 'bg-primary' : 'bg-muted'}`} />
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-8">
        {/* Order Summary */}
        <section>
          <p className="section-title mb-3">Order Summary</p>
          <div className="section-floating p-5 space-y-3">
            {items.map((item) => (
              <div key={item.product.id} className="flex justify-between text-sm">
                <span className="text-muted-foreground line-clamp-1 flex-1 mr-4">
                  {item.product.name}
                </span>
                <span className="font-medium tabular-nums"><span className="font-bold">₹</span>{item.product.price.toLocaleString()}</span>
              </div>
            ))}
            <div className="flex justify-between text-sm pt-3 border-t border-border">
              <span className="text-muted-foreground">Shipping</span>
              <span className="font-bold"><span className="font-bold">₹</span>{shippingCost}</span>
            </div>
            <div className="flex justify-between pt-3 border-t border-border">
              <span className="font-medium">Total</span>
              <span className="price-tag-lg"><span className="font-bold text-xl">₹</span>{finalTotal.toLocaleString()}</span>
            </div>
          </div>
        </section>

        {/* Step 1: Delivery Details */}
        {step === 'details' && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="section-title mb-3">Delivery Details</p>
            <div className="space-y-4">
              <div>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Full Name"
                  className={`input-field ${errors.name ? 'border-destructive focus:border-destructive' : ''}`}
                />
                {errors.name && <p className="text-xs text-destructive mt-2">{errors.name}</p>}
              </div>
              
              <div>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Phone Number (10 digits)"
                  maxLength={10}
                  className={`input-field ${errors.phone ? 'border-destructive focus:border-destructive' : ''}`}
                />
                {errors.phone && <p className="text-xs text-destructive mt-2">{errors.phone}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleChange}
                    placeholder="Pincode"
                    maxLength={6}
                    className={`input-field ${errors.pincode ? 'border-destructive focus:border-destructive' : ''}`}
                  />
                  {errors.pincode && <p className="text-xs text-destructive mt-2">{errors.pincode}</p>}
                </div>
                <div>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="State"
                    className={`input-field ${errors.state ? 'border-destructive focus:border-destructive' : ''}`}
                  />
                  {errors.state && <p className="text-xs text-destructive mt-2">{errors.state}</p>}
                </div>
              </div>

              <div>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="City"
                  className={`input-field ${errors.city ? 'border-destructive focus:border-destructive' : ''}`}
                />
                {errors.city && <p className="text-xs text-destructive mt-2">{errors.city}</p>}
              </div>
              
              <div>
                <textarea
                  name="area"
                  value={formData.area}
                  onChange={handleChange}
                  placeholder="Area / Locality / House No. / Street"
                  rows={2}
                  className={`input-field resize-none ${errors.area ? 'border-destructive focus:border-destructive' : ''}`}
                />
                {errors.area && <p className="text-xs text-destructive mt-2">{errors.area}</p>}
              </div>

              <div>
                <input
                  type="text"
                  name="landmark"
                  value={formData.landmark}
                  onChange={handleChange}
                  placeholder="Landmark (optional)"
                  className="input-field"
                />
              </div>
            </div>

            {/* No Refund Policy */}
            <div className="mt-6 p-4 bg-destructive/10 rounded-xl border border-destructive/20">
              <p className="text-sm font-semibold text-destructive">⚠️ No Refund Policy</p>
              <p className="text-xs text-muted-foreground mt-1">
                All sales are final. Please review your order carefully before completing payment.
              </p>
            </div>
          </motion.section>
        )}

        {/* Step 2: Payment Section (only shown after reservation) */}
        {step === 'payment' && reservation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Reservation Timer */}
            <ReservationTimer 
              expiresAt={reservation.expiresAt} 
              onExpire={handleReservationExpire}
            />

            {/* Order ID Display */}
            <div className="p-4 bg-primary/10 rounded-xl border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="w-4 h-4 text-primary" />
                <p className="text-xs text-muted-foreground uppercase tracking-widest">Your Order ID</p>
              </div>
              <p className="font-mono text-xl font-bold text-primary">{reservation.orderId}</p>
              <p className="text-xs text-muted-foreground mt-2">
                📝 Please mention this Order ID in the payment note if possible.
              </p>
            </div>

            {/* UPI Payment Section - only if not expired */}
            {!isReservationExpired && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <QrCode className="w-4 h-4 text-primary" />
                  <p className="section-title">Pay via UPI</p>
                </div>
                
                <div className="section-floating p-5 space-y-5">
                  {/* Amount Display */}
                  <div className="text-center py-4 border-b border-border">
                    <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Amount to Pay</p>
                    <p className="price-tag-lg"><span className="font-bold text-2xl">₹</span>{finalTotal.toLocaleString()}</p>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    {/* QR Code */}
                    <div className="flex justify-center">
                      {isLoadingSettings ? (
                        <div className="w-48 h-48 flex items-center justify-center">
                          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        </div>
                      ) : (
                        <img
                          src={qrCodeUrl}
                          alt="UPI QR Code"
                          className="w-48 h-48 rounded-2xl bg-white p-3 object-contain"
                        />
                      )}
                    </div>

                    {/* UPI Details */}
                    <div className="space-y-4">
                      <div className="p-4 bg-muted/30 rounded-xl">
                        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">UPI Name</p>
                        <p className="font-medium">{settings.store_name}</p>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">UPI ID</p>
                          <p className="font-mono text-sm">{settings.upi_id}</p>
                        </div>
                        <button
                          onClick={copyUpiId}
                          className="p-3 rounded-xl bg-card hover:bg-muted transition-colors"
                        >
                          {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Instructions */}
                  <div className="text-sm text-muted-foreground space-y-1.5 p-4 bg-muted/20 rounded-xl">
                    <p>1. Scan the QR code or copy UPI ID</p>
                    <p>2. Pay ₹{finalTotal.toLocaleString()} using any UPI app</p>
                    <p>3. Enter the transaction reference number below</p>
                  </div>

                  {/* Transaction Reference */}
                  <div>
                    <input
                      type="text"
                      value={upiRefNumber}
                      onChange={(e) => {
                        setUpiRefNumber(e.target.value);
                        if (errors.upiRef) setErrors(prev => ({ ...prev, upiRef: '' }));
                      }}
                      placeholder="UPI Transaction Reference Number"
                      className={`input-field ${errors.upiRef ? 'border-destructive focus:border-destructive' : ''}`}
                    />
                    {errors.upiRef && <p className="text-xs text-destructive mt-2">{errors.upiRef}</p>}
                    <p className="text-xs text-muted-foreground mt-2">Find this in your UPI app's transaction history</p>
                  </div>

                  {/* Payer Name */}
                  <div>
                    <input
                      type="text"
                      value={paymentPayerName}
                      onChange={(e) => {
                        setPaymentPayerName(e.target.value);
                        if (errors.payerName) setErrors(prev => ({ ...prev, payerName: '' }));
                      }}
                      placeholder="Payer Name (as shown in UPI app)"
                      className={`input-field ${errors.payerName ? 'border-destructive focus:border-destructive' : ''}`}
                    />
                    {errors.payerName && <p className="text-xs text-destructive mt-2">{errors.payerName}</p>}
                  </div>

                  {/* Payment Screenshot */}
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">Payment Screenshot</p>
                    <label className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                      errors.paymentProof ? 'border-destructive' : 'border-border hover:border-primary/30 hover:bg-primary/5'
                    }`}>
                      <Upload className="w-6 h-6 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">
                        {paymentProof ? paymentProof.name : 'Tap to upload screenshot'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const f = e.target.files?.[0] ?? null;
                          setPaymentProof(f);
                          if (errors.paymentProof) setErrors(prev => ({ ...prev, paymentProof: '' }));
                        }}
                        className="hidden"
                      />
                    </label>
                    {errors.paymentProof && <p className="text-xs text-destructive mt-2">{errors.paymentProof}</p>}
                  </div>
                </div>
              </section>
            )}

            {/* Expired state - show start over button */}
            {isReservationExpired && (
              <div className="text-center py-8">
                <button
                  onClick={handleStartOver}
                  className="btn-secondary"
                >
                  Start Over
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* Trust Badge */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Shield className="w-3.5 h-3.5" />
          <span>Secure checkout • Verified within 24 hours</span>
        </div>
      </div>

      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-20 md:bottom-0 left-0 right-0 p-5 bg-background/80 backdrop-blur-xl border-t border-border/50">
        {step === 'details' ? (
          <button 
            onClick={handleReserveOrder}
            disabled={isProcessing}
            className="w-full btn-primary flex items-center justify-center gap-3"
          >
            {isProcessing ? (
              <>
                <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Reserving Order...
              </>
            ) : (
              <>
                <Lock className="w-5 h-5" />
                Reserve Order & Proceed to Payment
              </>
            )}
          </button>
        ) : reservation && !isReservationExpired ? (
          <button 
            onClick={handleSubmitPayment}
            disabled={isProcessing}
            className="w-full btn-primary flex items-center justify-center gap-3"
          >
            {isProcessing ? (
              <>
                <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Submitting Payment...
              </>
            ) : (
              'Submit Payment Details'
            )}
          </button>
        ) : null}
      </div>
    </div>
  );
};

export default Checkout;
