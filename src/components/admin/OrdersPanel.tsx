import { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, Package, Search, RefreshCw, Phone, Copy, Trash2, AlertTriangle, Lock, CreditCard, Timer, Truck, MessageCircle, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from "@/components/ui/input";
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
  order_number: number;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  payment_method: string;
  payment_status: 'pending' | 'verified' | 'failed' | 'locked' | 'payment_submitted' | 'paid' | 'cancelled' | 'expired';
  razorpay_payment_id: string | null;
  payment_payer_name?: string | null;
  payment_proof_url?: string | null;
  reserved_at?: string | null;
  reservation_expires_at?: string | null;
  locked_product_ids?: string[] | null;
  shipping_status: string;
  courier_name?: string | null;
  tracking_url?: string | null;
  awb_number?: string | null;
  created_at: string;
  updated_at: string;
}

const SHIPPING_STATUSES = [
  { value: 'none', label: 'Not Started' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'packed', label: 'Packed' },
  { value: 'dispatched', label: 'Dispatched' },
  { value: 'in_transit', label: 'In Transit' },
  { value: 'out_for_delivery', label: 'Out for Delivery' },
  { value: 'delivered', label: 'Delivered' },
];

const getWhatsAppMessage = (order: Order, shippingStatus: string) => {
  const statusMessages: Record<string, string> = {
    accepted: `Hi ${order.customer_name}! ✅ Your order #${order.order_number} (${order.order_id}) has been accepted and is being processed.`,
    packed: `Hi ${order.customer_name}! 📦 Your order #${order.order_number} has been packed and is ready for dispatch.`,
    dispatched: `Hi ${order.customer_name}! 🚚 Your order #${order.order_number} has been dispatched!${order.courier_name ? `\n\nCourier: ${order.courier_name}` : ''}${order.awb_number ? `\nTracking No: ${order.awb_number}` : ''}${order.tracking_url ? `\nTrack here: ${order.tracking_url}` : ''}`,
    in_transit: `Hi ${order.customer_name}! 📍 Your order #${order.order_number} is in transit and on its way to you.${order.tracking_url ? `\nTrack here: ${order.tracking_url}` : ''}`,
    out_for_delivery: `Hi ${order.customer_name}! 🎉 Your order #${order.order_number} is out for delivery! Please be available to receive it.`,
    delivered: `Hi ${order.customer_name}! ✅ Your order #${order.order_number} has been delivered! Thank you for shopping with us. 🙏`,
  };
  return statusMessages[shippingStatus] || `Hi ${order.customer_name}! Your order #${order.order_number} status has been updated.`;
};

const openWhatsApp = (phone: string, message: string) => {
  const cleanPhone = phone.replace(/\D/g, '');
  const fullPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
  const url = `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
};

export const OrdersPanel = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [showCleanupModal, setShowCleanupModal] = useState(false);
  const [cleanupDays, setCleanupDays] = useState(90);
  const [cleanupStatuses, setCleanupStatuses] = useState<string[]>(['verified', 'failed', 'paid', 'cancelled', 'expired']);
  const [isDeleting, setIsDeleting] = useState(false);
  const [ordersToDelete, setOrdersToDelete] = useState<Order[]>([]);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [shippingForm, setShippingForm] = useState<Record<string, { courierName: string; trackingUrl: string; awbNumber: string }>>({});

  // Get signed URL for payment proof stored in private bucket
  const getPaymentProofUrl = async (proofUrl: string | null | undefined): Promise<string | null> => {
    if (!proofUrl) return null;
    if (proofUrl.startsWith('http')) return proofUrl;
    const match = proofUrl.match(/^payment-proofs\/(.+)$/);
    if (!match) return null;
    const { data, error } = await supabase.storage
      .from('payment-proofs')
      .createSignedUrl(match[1], 3600);
    if (error) return null;
    return data.signedUrl;
  };

  const fetchSignedUrls = async (ordersToFetch: Order[]) => {
    const newUrls: Record<string, string> = {};
    for (const order of ordersToFetch) {
      if (order.payment_proof_url && !signedUrls[order.id]) {
        const url = await getPaymentProofUrl(order.payment_proof_url);
        if (url) newUrls[order.id] = url;
      }
    }
    if (Object.keys(newUrls).length > 0) {
      setSignedUrls(prev => ({ ...prev, ...newUrls }));
    }
  };

  const copyText = async (text: string, label: string) => {
    const value = (text ?? '').trim();
    if (!value) { toast.error(`${label} not available`); return; }
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const el = document.createElement('textarea');
        el.value = value; el.style.position = 'fixed'; el.style.opacity = '0';
        document.body.appendChild(el); el.focus(); el.select();
        document.execCommand('copy'); document.body.removeChild(el);
      }
      toast.success(`${label} copied`);
    } catch { toast.error('Copy failed'); }
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
    const channel = supabase
      .channel('orders-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders();
        toast.info('Orders updated');
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const deleteProductImages = async (imageUrls: string[]) => {
    const BUCKET = 'product-images';
    const pathsToDelete: string[] = [];
    for (const url of imageUrls) {
      const match = url.match(/\/product-images\/(.+)$/);
      if (match) pathsToDelete.push(match[1].split('?')[0]);
    }
    if (pathsToDelete.length === 0) return;
    const { data: allProducts } = await supabase.from('products').select('images');
    const allUsedImages = new Set((allProducts ?? []).flatMap(p => p.images ?? []));
    const unusedPaths = pathsToDelete.filter(path => {
      const fullUrl = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
      return !allUsedImages.has(fullUrl);
    });
    if (unusedPaths.length > 0) {
      await supabase.storage.from(BUCKET).remove(unusedPaths);
    }
  };

  const deleteProductWithImages = async (productId: string) => {
    try {
      const { data: product, error: fetchError } = await supabase
        .from('products').select('id, name, images').eq('id', productId).maybeSingle();
      if (fetchError || !product) return false;
      const imagesToCheck = product.images ?? [];
      const { error: deleteError } = await supabase.from('products').delete().eq('id', productId);
      if (deleteError) return false;
      if (imagesToCheck.length > 0) await deleteProductImages(imagesToCheck);
      return true;
    } catch { return false; }
  };

  const updateOrderStatus = async (orderId: string, status: 'paid' | 'cancelled' | 'verified' | 'failed') => {
    try {
      const order = orders.find(o => o.id === orderId);
      const { error } = await supabase.from('orders').update({ payment_status: status }).eq('id', orderId);
      if (error) throw error;

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      const productIds = order?.locked_product_ids?.filter((id): id is string => Boolean(id) && uuidRegex.test(id))
        ?? order?.items?.map(item => item.product_id).filter((id): id is string => Boolean(id) && uuidRegex.test(id))
        ?? [];

      if ((status === 'paid' || status === 'verified') && productIds.length > 0) {
        let deletedCount = 0;
        for (const productId of productIds) {
          if (await deleteProductWithImages(productId)) deletedCount++;
        }
        toast.success(deletedCount > 0 ? `Order approved! ${deletedCount} product(s) sold & removed` : 'Order approved');
        fetchOrders();
        return;
      }

      if ((status === 'cancelled' || status === 'failed') && productIds.length > 0) {
        const { error: releaseError } = await supabase.rpc('release_products_from_order', { _product_ids: productIds });
        if (releaseError) {
          toast.warning('Order rejected, but failed to restore product availability');
        } else {
          toast.success(`Order rejected & ${productIds.length} product(s) restored`);
          fetchOrders();
          return;
        }
      }

      toast.success(`Order marked as ${status}`);
      fetchOrders();
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Failed to update order');
    }
  };

  const updateShippingStatus = async (orderId: string, shippingStatus: string) => {
    try {
      const order = orders.find(o => o.id === orderId);
      const form = shippingForm[orderId];
      
      const updateData: Record<string, unknown> = { shipping_status: shippingStatus };
      if (form?.courierName) updateData.courier_name = form.courierName;
      if (form?.trackingUrl) updateData.tracking_url = form.trackingUrl;
      if (form?.awbNumber) updateData.awb_number = form.awbNumber;

      const { error } = await supabase.from('orders').update(updateData).eq('id', orderId);
      if (error) throw error;

      toast.success(`Shipping status updated to "${SHIPPING_STATUSES.find(s => s.value === shippingStatus)?.label}"`);
      
      // Offer to send WhatsApp
      if (order && shippingStatus !== 'none') {
        const updatedOrder = { ...order, ...updateData, shipping_status: shippingStatus } as Order;
        const msg = getWhatsAppMessage(updatedOrder, shippingStatus);
        openWhatsApp(order.customer_phone, msg);
      }

      fetchOrders();
    } catch (error) {
      console.error('Error updating shipping:', error);
      toast.error('Failed to update shipping status');
    }
  };

  const calculateOrdersToDelete = () => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - cleanupDays);
    return orders.filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate < cutoffDate && cleanupStatuses.includes(order.payment_status);
    });
  };

  const handleBulkDelete = async () => {
    const toDelete = calculateOrdersToDelete();
    if (toDelete.length === 0) { toast.error('No orders match criteria'); return; }
    setIsDeleting(true);
    try {
      const { error } = await supabase.from('orders').delete().in('id', toDelete.map(o => o.id));
      if (error) throw error;
      toast.success(`Deleted ${toDelete.length} old orders`);
      setShowCleanupModal(false);
      fetchOrders();
    } catch { toast.error('Failed to delete orders'); }
    finally { setIsDeleting(false); }
  };

  const confirmBulkDelete = async () => {
    if (ordersToDelete.length === 0) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase.from('orders').delete().in('id', ordersToDelete.map(o => o.id));
      if (error) throw error;
      toast.success(`Deleted ${ordersToDelete.length} old orders`);
      setOrdersToDelete([]);
      setShowCleanupModal(false);
      fetchOrders();
    } catch { toast.error('Failed to delete orders'); }
    finally { setIsDeleting(false); }
  };

  const filteredOrders = orders.filter(order => {
    const matchesFilter = filter === 'all' || order.payment_status === filter;
    const matchesSearch =
      order.order_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_phone.includes(searchQuery) ||
      order.order_number.toString().includes(searchQuery);
    return matchesFilter && matchesSearch;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'locked': return <Lock className="w-4 h-4" />;
      case 'payment_submitted': return <CreditCard className="w-4 h-4" />;
      case 'paid': case 'verified': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': case 'failed': return <XCircle className="w-4 h-4" />;
      case 'expired': return <Timer className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-status-pending/10 text-status-pending border-status-pending/20';
      case 'locked': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'payment_submitted': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'paid': case 'verified': return 'bg-status-verified/10 text-status-verified border-status-verified/20';
      case 'cancelled': case 'failed': return 'bg-status-failed/10 text-status-failed border-status-failed/20';
      case 'expired': return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'payment_submitted': return 'Payment Submitted';
      case 'locked': return 'Reserved';
      default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const getShippingBadgeColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'packed': return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      case 'dispatched': case 'in_transit': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'out_for_delivery': return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
      case 'delivered': return 'bg-status-verified/10 text-status-verified border-status-verified/20';
      default: return '';
    }
  };

  const getTimeRemaining = (expiresAt: string | null | undefined) => {
    if (!expiresAt) return null;
    const diff = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
    if (diff <= 0) return 'Expired';
    return `${Math.floor(diff / 60)}:${String(diff % 60).padStart(2, '0')}`;
  };

  const stats = {
    total: orders.length,
    locked: orders.filter(o => o.payment_status === 'locked').length,
    paymentSubmitted: orders.filter(o => o.payment_status === 'payment_submitted').length,
    pending: orders.filter(o => o.payment_status === 'pending').length,
    paid: orders.filter(o => o.payment_status === 'paid' || o.payment_status === 'verified').length,
    cancelled: orders.filter(o => o.payment_status === 'cancelled' || o.payment_status === 'failed').length,
    highestOrderNumber: orders.length > 0 ? Math.max(...orders.map(o => o.order_number || 0)) : 0,
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        <div className="p-3 bg-primary/10 rounded-lg border border-primary/20 text-center">
          <p className="text-xl font-bold text-primary">#{stats.highestOrderNumber}</p>
          <p className="text-xs text-primary/80">Order #</p>
        </div>
        <div className="p-3 bg-card rounded-lg border border-border text-center">
          <p className="text-xl font-bold">{stats.total}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </div>
        <div className="p-3 bg-blue-500/5 rounded-lg border border-blue-500/20 text-center">
          <p className="text-xl font-bold text-blue-600">{stats.locked}</p>
          <p className="text-xs text-blue-600/80">Reserved</p>
        </div>
        <div className="p-3 bg-amber-500/5 rounded-lg border border-amber-500/20 text-center">
          <p className="text-xl font-bold text-amber-600">{stats.paymentSubmitted}</p>
          <p className="text-xs text-amber-600/80">Pending Review</p>
        </div>
        <div className="p-3 bg-status-verified/5 rounded-lg border border-status-verified/20 text-center">
          <p className="text-xl font-bold text-status-verified">{stats.paid}</p>
          <p className="text-xs text-status-verified/80">Paid</p>
        </div>
        <div className="p-3 bg-status-failed/5 rounded-lg border border-status-failed/20 text-center">
          <p className="text-xl font-bold text-status-failed">{stats.cancelled}</p>
          <p className="text-xs text-status-failed/80">Cancelled</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search orders..." className="input-field pl-9" />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="locked">Reserved</SelectItem>
            <SelectItem value="payment_submitted">Pending Review</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="pending">Pending (Legacy)</SelectItem>
            <SelectItem value="verified">Verified (Legacy)</SelectItem>
            <SelectItem value="failed">Failed (Legacy)</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={fetchOrders}>
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
        <Button variant="outline" size="icon" onClick={() => setShowCleanupModal(true)} title="Delete old orders">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Cleanup Modal */}
      {showCleanupModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg border border-border max-w-md w-full p-4 space-y-4">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-semibold">Delete Old Orders</h3>
            </div>
            <p className="text-sm text-muted-foreground">Remove old orders to free up database space. This action cannot be undone.</p>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Orders older than</label>
                <Select value={cleanupDays.toString()} onValueChange={(v) => setCleanupDays(Number(v))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 day</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="60">60 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                    <SelectItem value="180">6 months</SelectItem>
                    <SelectItem value="365">1 year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">With status</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {['paid', 'verified', 'cancelled', 'failed', 'expired', 'pending'].map(status => (
                    <label key={status} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={cleanupStatuses.includes(status)}
                        onChange={(e) => setCleanupStatuses(e.target.checked ? [...cleanupStatuses, status] : cleanupStatuses.filter(s => s !== status))}
                        className="rounded" />
                      <span className="capitalize">{status}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowCleanupModal(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleBulkDelete} disabled={cleanupStatuses.length === 0 || isDeleting}>
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}

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
            <div key={order.id} className="bg-card rounded-lg border border-border overflow-hidden">
              {/* Order Header */}
              <button
                onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                className="w-full p-4 text-left"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-mono">
                        #{order.order_number}
                      </Badge>
                      <span className="font-mono text-sm font-semibold">{order.order_id}</span>
                      <Badge className={`${getStatusColor(order.payment_status)} border`}>
                        {getStatusIcon(order.payment_status)}
                        <span className="ml-1">{getStatusLabel(order.payment_status)}</span>
                      </Badge>
                      {order.shipping_status && order.shipping_status !== 'none' && (
                        <Badge className={`${getShippingBadgeColor(order.shipping_status)} border`}>
                          <Truck className="w-3 h-3 mr-1" />
                          {SHIPPING_STATUSES.find(s => s.value === order.shipping_status)?.label}
                        </Badge>
                      )}
                      {order.payment_status === 'locked' && order.reservation_expires_at && (
                        <Badge variant="outline" className="bg-blue-500/5 text-blue-600 border-blue-500/20">
                          <Timer className="w-3 h-3 mr-1" />
                          {getTimeRemaining(order.reservation_expires_at)}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm">{order.customer_name}</p>
                    <p className="text-xs text-muted-foreground">{order.customer_phone}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">₹{order.total.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </button>

              {/* Expanded Details */}
              {expandedOrder === order.id && (
                <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
                  {/* Quick actions */}
                  <div className="flex flex-wrap gap-2">
                    <Button asChild variant="outline" size="sm" className="h-9">
                      <a href={`tel:${order.customer_phone}`}><Phone className="w-4 h-4 mr-2" />Call</a>
                    </Button>
                    <Button variant="outline" size="sm" className="h-9" onClick={() => copyText(order.customer_phone, 'Phone')}>
                      <Copy className="w-4 h-4 mr-2" />Phone
                    </Button>
                    <Button variant="outline" size="sm" className="h-9" onClick={() => copyText(order.customer_address, 'Address')}>
                      <Copy className="w-4 h-4 mr-2" />Address
                    </Button>
                    <Button variant="outline" size="sm" className="h-9" onClick={() => copyText(order.razorpay_payment_id || '', 'UTR')}>
                      <Copy className="w-4 h-4 mr-2" />UTR
                    </Button>
                    <Button variant="outline" size="sm" className="h-9 text-green-600 border-green-500/30"
                      onClick={() => openWhatsApp(order.customer_phone, `Hi ${order.customer_name}! Regarding your order #${order.order_number}...`)}>
                      <MessageCircle className="w-4 h-4 mr-2" />WhatsApp
                    </Button>
                  </div>

                  {/* Items */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2">ITEMS</p>
                    <div className="space-y-2">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <img src={item.image} alt={item.name} className="w-12 h-12 rounded object-cover" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate">{item.name}</p>
                            <p className="text-xs text-muted-foreground">₹{item.price.toLocaleString()} × {item.quantity}</p>
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
                    <p className="font-mono text-sm bg-muted/50 px-2 py-1 rounded">{order.razorpay_payment_id || 'Not provided'}</p>
                  </div>

                  {/* Payment proof */}
                  <div className="grid gap-2">
                    <p className="text-xs font-semibold text-muted-foreground">PAYMENT PROOF</p>
                    <div className="grid gap-2 md:grid-cols-2">
                      <div className="rounded-md border border-border bg-muted/30 p-2">
                        <p className="text-[11px] text-muted-foreground">Payer name</p>
                        <p className="text-sm">{(order.payment_payer_name ?? '').trim() || 'Not provided'}</p>
                      </div>
                      <div className="rounded-md border border-border bg-muted/30 p-2">
                        <p className="text-[11px] text-muted-foreground">Screenshot</p>
                        {order.payment_proof_url ? (
                          signedUrls[order.id] ? (
                            <a href={signedUrls[order.id]} target="_blank" rel="noreferrer" className="text-sm underline text-primary">View screenshot</a>
                          ) : (
                            <button onClick={async () => {
                              const url = await getPaymentProofUrl(order.payment_proof_url);
                              if (url) { setSignedUrls(prev => ({ ...prev, [order.id]: url })); window.open(url, '_blank'); }
                              else toast.error('Failed to load payment proof');
                            }} className="text-sm underline text-primary">Load screenshot</button>
                          )
                        ) : <p className="text-sm">Not provided</p>}
                      </div>
                    </div>
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

                  {/* Shipping Management - for paid/verified orders */}
                  {(order.payment_status === 'paid' || order.payment_status === 'verified') && (
                    <div className="p-3 bg-muted/30 rounded-lg border border-border space-y-3">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-primary" />
                        <p className="text-sm font-semibold">Shipping & Tracking</p>
                      </div>
                      
                      {/* Courier info fields */}
                      <div className="grid gap-2 sm:grid-cols-3">
                        <Input
                          placeholder="Courier name (e.g. Delhivery)"
                          value={shippingForm[order.id]?.courierName ?? order.courier_name ?? ''}
                          onChange={(e) => setShippingForm(prev => ({
                            ...prev,
                            [order.id]: { ...prev[order.id], courierName: e.target.value, trackingUrl: prev[order.id]?.trackingUrl ?? order.tracking_url ?? '', awbNumber: prev[order.id]?.awbNumber ?? order.awb_number ?? '' }
                          }))}
                          className="text-sm"
                        />
                        <Input
                          placeholder="AWB / Tracking number"
                          value={shippingForm[order.id]?.awbNumber ?? order.awb_number ?? ''}
                          onChange={(e) => setShippingForm(prev => ({
                            ...prev,
                            [order.id]: { ...prev[order.id], awbNumber: e.target.value, courierName: prev[order.id]?.courierName ?? order.courier_name ?? '', trackingUrl: prev[order.id]?.trackingUrl ?? order.tracking_url ?? '' }
                          }))}
                          className="text-sm font-mono"
                        />
                        <Input
                          placeholder="Tracking URL"
                          value={shippingForm[order.id]?.trackingUrl ?? order.tracking_url ?? ''}
                          onChange={(e) => setShippingForm(prev => ({
                            ...prev,
                            [order.id]: { ...prev[order.id], trackingUrl: e.target.value, courierName: prev[order.id]?.courierName ?? order.courier_name ?? '', awbNumber: prev[order.id]?.awbNumber ?? order.awb_number ?? '' }
                          }))}
                          className="text-sm"
                        />
                      </div>

                      {/* Shipping status buttons */}
                      <div className="flex flex-wrap gap-2">
                        {SHIPPING_STATUSES.filter(s => s.value !== 'none').map((status) => (
                          <Button
                            key={status.value}
                            size="sm"
                            variant={order.shipping_status === status.value ? 'default' : 'outline'}
                            className="text-xs h-8"
                            onClick={() => updateShippingStatus(order.id, status.value)}
                          >
                            {status.label}
                          </Button>
                        ))}
                      </div>

                      {/* Current tracking info display */}
                      {order.tracking_url && (
                        <a href={order.tracking_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-sm text-primary underline">
                          <ExternalLink className="w-3 h-3" /> Track on courier website
                        </a>
                      )}
                    </div>
                  )}

                  {/* Payment actions */}
                  {order.payment_status === 'payment_submitted' && (
                    <div className="flex gap-2 pt-2">
                      <Button onClick={() => updateOrderStatus(order.id, 'paid')} className="flex-1 bg-status-verified hover:bg-status-verified/90 text-status-verified-foreground">
                        <CheckCircle className="w-4 h-4 mr-1" />Approve Payment
                      </Button>
                      <Button onClick={() => updateOrderStatus(order.id, 'cancelled')} variant="destructive" className="flex-1">
                        <XCircle className="w-4 h-4 mr-1" />Reject Payment
                      </Button>
                    </div>
                  )}

                  {order.payment_status === 'pending' && (
                    <div className="flex gap-2 pt-2">
                      <Button onClick={() => updateOrderStatus(order.id, 'verified')} className="flex-1 bg-status-verified hover:bg-status-verified/90 text-status-verified-foreground">
                        <CheckCircle className="w-4 h-4 mr-1" />Accept Order
                      </Button>
                      <Button onClick={() => updateOrderStatus(order.id, 'failed')} variant="destructive" className="flex-1">
                        <XCircle className="w-4 h-4 mr-1" />Reject Order
                      </Button>
                    </div>
                  )}

                  {order.payment_status === 'locked' && (
                    <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                      <div className="flex items-center gap-2 text-blue-600">
                        <Lock className="w-4 h-4" />
                        <p className="text-sm font-medium">Order Reserved</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Customer is completing payment. Product is locked until timer expires or payment is submitted.
                      </p>
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
