import { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, Package, Search, RefreshCw, Phone, Copy, Trash2, AlertTriangle, Lock, CreditCard, Timer } from 'lucide-react';
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
  created_at: string;
  updated_at: string;
}

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

  // Helper function to delete product images from storage
  const deleteProductImages = async (imageUrls: string[]) => {
    const BUCKET = 'product-images';
    const pathsToDelete: string[] = [];
    
    for (const url of imageUrls) {
      // Extract path from URL (e.g., products/1234-abc.webp)
      const match = url.match(/\/product-images\/(.+)$/);
      if (match) {
        pathsToDelete.push(match[1].split('?')[0]); // Remove query params
      }
    }
    
    if (pathsToDelete.length === 0) return;
    
    // Check if any other products use these images
    const { data: allProducts } = await supabase
      .from('products')
      .select('images');
    
    const allUsedImages = new Set(
      (allProducts ?? []).flatMap(p => p.images ?? [])
    );
    
    // Only delete images not used by other products
    const unusedPaths = pathsToDelete.filter(path => {
      const fullUrl = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
      return !allUsedImages.has(fullUrl);
    });
    
    if (unusedPaths.length > 0) {
      const { error } = await supabase.storage.from(BUCKET).remove(unusedPaths);
      if (error) {
        console.error('Error deleting images:', error);
      } else {
        console.log(`Deleted ${unusedPaths.length} unused image(s)`);
      }
    }
  };

  // Helper function to delete a product and its unused images
  const deleteProductWithImages = async (productId: string) => {
    try {
      // First, get the product to retrieve its images
      const { data: product, error: fetchError } = await supabase
        .from('products')
        .select('id, name, images')
        .eq('id', productId)
        .maybeSingle();
      
      if (fetchError || !product) {
        console.error('Error fetching product for deletion:', fetchError);
        return false;
      }
      
      const imagesToCheck = product.images ?? [];
      
      // Delete the product first
      const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);
      
      if (deleteError) {
        console.error('Error deleting product:', deleteError);
        return false;
      }
      
      // Then delete unused images
      if (imagesToCheck.length > 0) {
        await deleteProductImages(imagesToCheck);
      }
      
      console.log(`Product ${product.name} deleted with images cleanup`);
      return true;
    } catch (error) {
      console.error('Error in deleteProductWithImages:', error);
      return false;
    }
  };

  const updateOrderStatus = async (orderId: string, status: 'paid' | 'cancelled' | 'verified' | 'failed') => {
    try {
      const order = orders.find(o => o.id === orderId);
      
      const { error } = await supabase
        .from('orders')
        .update({ payment_status: status })
        .eq('id', orderId);

      if (error) throw error;

      // Get product IDs from locked_product_ids or order items
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      const productIds = order?.locked_product_ids?.filter((id): id is string => Boolean(id) && uuidRegex.test(id)) 
        ?? order?.items?.map(item => item.product_id).filter((id): id is string => Boolean(id) && uuidRegex.test(id)) 
        ?? [];
      
      // If order is approved (paid/verified), delete products and their unused images
      if ((status === 'paid' || status === 'verified') && productIds.length > 0) {
        let deletedCount = 0;
        
        for (const productId of productIds) {
          const success = await deleteProductWithImages(productId);
          if (success) deletedCount++;
        }
        
        if (deletedCount > 0) {
          toast.success(`Order approved! ${deletedCount} product(s) sold & removed with images cleanup`);
        } else {
          toast.success('Order approved');
        }
        
        fetchOrders();
        return;
      }
      
      // If order is rejected/cancelled/failed, release products
      if ((status === 'cancelled' || status === 'failed') && productIds.length > 0) {
        // Use the RPC function to release products
        const { error: releaseError } = await supabase.rpc('release_products_from_order', {
          _product_ids: productIds
        });
        
        if (releaseError) {
          console.error('Error releasing products:', releaseError);
          toast.warning('Order rejected, but failed to restore product availability');
        } else {
          toast.success(`Order rejected & ${productIds.length} product(s) restored to available`);
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

  // Calculate orders eligible for cleanup
  const calculateOrdersToDelete = () => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - cleanupDays);
    
    return orders.filter(order => {
      const orderDate = new Date(order.created_at);
      const statusMatch = cleanupStatuses.includes(order.payment_status);
      return orderDate < cutoffDate && statusMatch;
    });
  };

  const handleBulkDelete = async () => {
    const toDelete = calculateOrdersToDelete();
    if (toDelete.length === 0) {
      toast.error('No orders match the cleanup criteria');
      return;
    }
    
    setIsDeleting(true);
    try {
      const ids = toDelete.map(o => o.id);
      const { error } = await supabase
        .from('orders')
        .delete()
        .in('id', ids);
      
      if (error) throw error;
      
      toast.success(`Deleted ${toDelete.length} old orders`);
      setShowCleanupModal(false);
      fetchOrders();
    } catch (error) {
      console.error('Error deleting orders:', error);
      toast.error('Failed to delete orders');
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmBulkDelete = async () => {
    if (ordersToDelete.length === 0) return;
    
    setIsDeleting(true);
    try {
      const ids = ordersToDelete.map(o => o.id);
      const { error } = await supabase
        .from('orders')
        .delete()
        .in('id', ids);
      
      if (error) throw error;
      
      toast.success(`Deleted ${ordersToDelete.length} old orders`);
      setOrdersToDelete([]);
      setShowCleanupModal(false);
      fetchOrders();
    } catch (error) {
      console.error('Error deleting orders:', error);
      toast.error('Failed to delete orders');
    } finally {
      setIsDeleting(false);
    }
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
      case 'paid':
      case 'verified': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
      case 'failed': return <XCircle className="w-4 h-4" />;
      case 'expired': return <Timer className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-status-pending/10 text-status-pending border-status-pending/20';
      case 'locked': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'payment_submitted': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'paid':
      case 'verified': return 'bg-status-verified/10 text-status-verified border-status-verified/20';
      case 'cancelled':
      case 'failed': return 'bg-status-failed/10 text-status-failed border-status-failed/20';
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

  // Calculate time remaining for locked orders
  const getTimeRemaining = (expiresAt: string | null | undefined) => {
    if (!expiresAt) return null;
    const now = new Date().getTime();
    const expiry = new Date(expiresAt).getTime();
    const diff = Math.max(0, Math.floor((expiry - now) / 1000));
    if (diff <= 0) return 'Expired';
    const minutes = Math.floor(diff / 60);
    const seconds = diff % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
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
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search orders..."
            className="input-field pl-9"
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
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
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => setShowCleanupModal(true)}
          title="Delete old orders"
        >
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
            
            <p className="text-sm text-muted-foreground">
              Remove old orders to free up database space. This action cannot be undone.
            </p>
            
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Orders older than</label>
                <Select value={cleanupDays.toString()} onValueChange={(v) => setCleanupDays(Number(v))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
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
                      <input
                        type="checkbox"
                        checked={cleanupStatuses.includes(status)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setCleanupStatuses([...cleanupStatuses, status]);
                          } else {
                            setCleanupStatuses(cleanupStatuses.filter(s => s !== status));
                          }
                        }}
                        className="rounded"
                      />
                      <span className="capitalize">{status}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowCleanupModal(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleBulkDelete}
                disabled={cleanupStatuses.length === 0 || isDeleting}
              >
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
            <div 
              key={order.id} 
              className="bg-card rounded-lg border border-border overflow-hidden"
            >
              {/* Order Header */}
              <button
                onClick={() => {
                  const next = expandedOrder === order.id ? null : order.id;
                  setExpandedOrder(next);
                }}
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
                          <a
                            href={order.payment_proof_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm underline text-primary"
                          >
                            View screenshot
                          </a>
                        ) : (
                          <p className="text-sm">Not provided</p>
                        )}
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

                  {/* Actions for payment_submitted orders */}
                  {order.payment_status === 'payment_submitted' && (
                    <div className="flex gap-2 pt-2">
                      <Button 
                        onClick={() => updateOrderStatus(order.id, 'paid')}
                        className="flex-1 bg-status-verified hover:bg-status-verified/90 text-status-verified-foreground"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve Payment
                      </Button>
                      <Button 
                        onClick={() => updateOrderStatus(order.id, 'cancelled')}
                        variant="destructive"
                        className="flex-1"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject Payment
                      </Button>
                    </div>
                  )}

                  {/* Legacy actions for pending orders */}
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

                  {/* Info for locked orders */}
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
