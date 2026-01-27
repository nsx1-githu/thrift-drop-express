import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Copy, Check, QrCode, Loader2, Shield, Upload } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useNotificationStore } from '@/store/notificationStore';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface StoreSettings {
  store_name: string;
  upi_id: string;
  upi_qr_image: string;
}

const Checkout = () => {
  const navigate = useNavigate();
  const { items, getTotal, clearCart } = useCartStore();
  const { addNotification, upsertCustomerOrder } = useNotificationStore();
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
    if (items.length === 0) navigate('/cart');
  }, [items.length, navigate]);

  if (items.length === 0) return null;

  const copyUpiId = async () => {
    await navigator.clipboard.writeText(settings.upi_id);
    setCopied(true);
    toast.success('UPI ID copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const validateForm = () => {
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

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsProcessing(true);

    try {
      // Convert payment proof to base64 for server-side upload
      let paymentProofBase64 = '';
      let paymentProofMime = '';
      if (paymentProof) {
        const arrayBuffer = await paymentProof.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        paymentProofBase64 = btoa(binary);
        paymentProofMime = paymentProof.type;
      }

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

      const { data, error } = await supabase.functions.invoke('create-order', {
        body: {
          customer_name: formData.name.trim(),
          customer_phone: formData.phone.trim(),
          customer_address: fullAddress,
          pincode: formData.pincode.trim(),
          state: formData.state.trim(),
          city: formData.city.trim(),
          area: formData.area.trim(),
          landmark: formData.landmark.trim() || null,
          items: orderItems,
          subtotal: total,
          shipping: Math.round(shippingCost),
          total: Math.round(finalTotal),
          payment_method: 'UPI',
          payment_reference: upiRefNumber.trim(),
          payment_payer_name: paymentPayerName.trim(),
          payment_proof_base64: paymentProofBase64,
          payment_proof_mime: paymentProofMime,
        },
      });
      if (error) throw error;

      const payloadError = (data as any)?.error as string | undefined;
      if (payloadError) throw new Error(payloadError);
      const orderId = (data as any)?.orderId as string | undefined;
      if (!orderId) throw new Error('Missing orderId');

      addNotification({
        title: 'Order Placed Successfully!',
        message: `Your order ${orderId} has been placed. Payment verification is pending.`,
        type: 'order',
        orderId,
      });

      upsertCustomerOrder({
        orderId,
        phone: formData.phone.trim(),
        status: 'pending',
      });

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
      const message =
        (error as any)?.message ||
        (error as any)?.error_description ||
        'Failed to place order. Please try again.';
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
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

        {/* Delivery Details */}
        <section>
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
        </section>

        {/* UPI Payment Section */}
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

        {/* Trust Badge */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Shield className="w-3.5 h-3.5" />
          <span>Secure checkout • Verified within 24 hours</span>
        </div>
      </div>

      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-20 md:bottom-0 left-0 right-0 p-5 bg-background/80 backdrop-blur-xl border-t border-border/50">
        <button 
          onClick={handleSubmit}
          disabled={isProcessing}
          className="w-full btn-primary flex items-center justify-center gap-3"
        >
          {isProcessing ? (
            <>
              <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              Placing Order...
            </>
          ) : (
            'Confirm Order'
          )}
        </button>
      </div>
    </div>
  );
};

export default Checkout;
