import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'order' | 'payment' | 'info';
  read: boolean;
  createdAt: string;
  orderId?: string;
}

export interface CustomerOrderWatch {
  orderId: string;
  phone: string;
  lastStatus: 'pending' | 'verified' | 'failed' | null;
  lastCheckedAt: string | null;
}

interface NotificationStore {
  notifications: Notification[];
  customerOrders: CustomerOrderWatch[];
  addNotification: (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => void;
  upsertCustomerOrder: (order: { orderId: string; phone: string; status?: CustomerOrderWatch['lastStatus'] }) => void;
  setCustomerOrderStatus: (orderId: string, status: CustomerOrderWatch['lastStatus']) => void;
  markCustomerOrderChecked: (orderId: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  getUnreadCount: () => number;
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      notifications: [],
      customerOrders: [],
      
      addNotification: (notification) => {
        const newNotification: Notification = {
          ...notification,
          id: `notif_${Date.now()}`,
          read: false,
          createdAt: new Date().toISOString(),
        };
        
        set((state) => ({
          notifications: [newNotification, ...state.notifications].slice(0, 50), // Keep last 50
        }));
      },

      upsertCustomerOrder: ({ orderId, phone, status }) => {
        const cleanOrderId = (orderId ?? '').trim().toUpperCase();
        const cleanPhone = (phone ?? '').trim();
        if (!cleanOrderId || !cleanPhone) return;

        set((state) => {
          const existing = state.customerOrders.find((o) => o.orderId === cleanOrderId);
          const next: CustomerOrderWatch = {
            orderId: cleanOrderId,
            phone: cleanPhone,
            lastStatus: status ?? existing?.lastStatus ?? null,
            lastCheckedAt: existing?.lastCheckedAt ?? null,
          };
          const rest = state.customerOrders.filter((o) => o.orderId !== cleanOrderId);
          return { customerOrders: [next, ...rest].slice(0, 10) };
        });
      },

      setCustomerOrderStatus: (orderId, status) => {
        const cleanOrderId = (orderId ?? '').trim().toUpperCase();
        if (!cleanOrderId) return;
        set((state) => ({
          customerOrders: state.customerOrders.map((o) =>
            o.orderId === cleanOrderId ? { ...o, lastStatus: status } : o,
          ),
        }));
      },

      markCustomerOrderChecked: (orderId) => {
        const cleanOrderId = (orderId ?? '').trim().toUpperCase();
        if (!cleanOrderId) return;
        const now = new Date().toISOString();
        set((state) => ({
          customerOrders: state.customerOrders.map((o) =>
            o.orderId === cleanOrderId ? { ...o, lastCheckedAt: now } : o,
          ),
        }));
      },
      
      markAsRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        }));
      },
      
      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        }));
      },
      
      clearNotifications: () => {
        set({ notifications: [] });
      },
      
      getUnreadCount: () => {
        return get().notifications.filter((n) => !n.read).length;
      },
    }),
    {
      name: 'notifications-storage',
    }
  )
);
