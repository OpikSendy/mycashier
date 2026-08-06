'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { MenuItem, Order, INITIAL_MENU, INITIAL_ORDERS, OrderStatus, PaymentMethod } from '@/data/initialData';

export type UserRole = 'customer' | 'cashier' | 'admin';
export type Theme = 'dark' | 'light';
export type Language = 'ID' | 'EN';

export interface CartItem {
  item: MenuItem;
  quantity: number;
  notes: string;
}

export interface StoreSettings {
  id?: number;
  name: string;
  logoUrl: string;
  address: string;
  taxRate: number; // percentage e.g. 10 = 10%
}

interface AppContextType {
  authRole: UserRole;
  loginAs: (role: UserRole, pin: string) => boolean;
  logout: () => void;
  theme: Theme;
  toggleTheme: () => void;
  language: Language;
  toggleLanguage: () => void;
  selectedTable: string;
  setSelectedTable: (table: string) => void;
  cart: CartItem[];
  addToCart: (item: MenuItem, notes?: string) => void;
  updateCartQuantity: (itemId: string, delta: number) => void;
  clearCart: () => void;
  // Menu
  menu: MenuItem[];
  menuLoading: boolean;
  toggleProductAvailability: (productId: string) => void;
  addNewMenuItem: (newItem: Omit<MenuItem, 'id'>) => Promise<void>;
  updateMenuItem: (id: string, updates: Partial<Omit<MenuItem, 'id'>>) => Promise<void>;
  deleteMenuItem: (productId: string) => void;
  // Orders
  orders: Order[];
  ordersLoading: boolean;
  createOrder: (customerName: string, paymentMethod?: PaymentMethod, isDirectPaid?: boolean) => Order;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  markOrderPaid: (orderId: string, method: PaymentMethod) => void;
  // Store Settings
  storeSettings: StoreSettings;
  settingsLoading: boolean;
  updateStoreSettings: (updates: Partial<StoreSettings>) => Promise<void>;
  isDbConnected: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Demo PIN credentials for RBAC
export const ROLE_PINS = {
  cashier: '1234',
  admin: '8888',
};

const DEFAULT_STORE_SETTINGS: StoreSettings = {
  name: 'MyCashier Resto',
  logoUrl: '/icon.jpg',
  address: 'Jl. Raya No. 1, Jakarta',
  taxRate: 10,
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [authRole, setAuthRole] = useState<UserRole>('customer');
  const [theme, setTheme] = useState<Theme>('light');
  const [language, setLanguageState] = useState<Language>('ID');
  const [selectedTable, setSelectedTable] = useState<string>('Meja 04');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);

  // ── DB-backed state ──────────────────────────────────────────────
  const [menu, setMenu] = useState<MenuItem[]>(INITIAL_MENU);
  const [menuLoading, setMenuLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [isDbConnected, setIsDbConnected] = useState(false);

  // ── Hydration & localStorage ─────────────────────────────────────
  useEffect(() => {
    setMounted(true);
    try {
      const savedRole = localStorage.getItem('mycashier_auth_role') as UserRole;
      const savedTheme = localStorage.getItem('mycashier_theme') as Theme;
      const savedLang = localStorage.getItem('mycashier_lang') as Language;
      if (savedRole) setAuthRole(savedRole);
      if (savedTheme) setTheme(savedTheme);
      if (savedLang) setLanguageState(savedLang);
    } catch (_) {}
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
    }
    localStorage.setItem('mycashier_theme', theme);
  }, [theme, mounted]);

  // ── Fetch Menu from DB ───────────────────────────────────────────
  const fetchMenu = useCallback(async () => {
    try {
      const res = await fetch('/api/menu');
      const json = await res.json();
      if (json.data && Array.isArray(json.data)) {
        setMenu(json.data);
        setIsDbConnected(json.source === 'database');
      }
    } catch (_) {
      // Keep INITIAL_MENU as fallback
    } finally {
      setMenuLoading(false);
    }
  }, []);

  // ── Fetch Orders from DB ─────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/orders');
      const json = await res.json();
      if (json.data && Array.isArray(json.data)) {
        setOrders(json.data);
      }
    } catch (_) {
      // Keep INITIAL_ORDERS as fallback
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  // ── Fetch Store Settings ─────────────────────────────────────────
  const fetchStoreSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/store-settings');
      const json = await res.json();
      if (json.data) {
        setStoreSettings({
          ...DEFAULT_STORE_SETTINGS,
          ...json.data,
          taxRate: Number(json.data.taxRate ?? 10),
        });
      }
    } catch (_) {
      // Keep defaults
    } finally {
      setSettingsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    fetchMenu();
    fetchOrders();
    fetchStoreSettings();
  }, [mounted, fetchMenu, fetchOrders, fetchStoreSettings]);

  // ── Auth ─────────────────────────────────────────────────────────
  const loginAs = (role: UserRole, pin: string): boolean => {
    if (role === 'customer') {
      setAuthRole('customer');
      localStorage.setItem('mycashier_auth_role', 'customer');
      return true;
    }
    const validPin = ROLE_PINS[role as 'cashier' | 'admin'];
    if (pin === validPin) {
      setAuthRole(role);
      localStorage.setItem('mycashier_auth_role', role);
      return true;
    }
    return false;
  };

  const logout = () => {
    setAuthRole('customer');
    localStorage.setItem('mycashier_auth_role', 'customer');
  };

  // ── Theme & Language ─────────────────────────────────────────────
  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    if (typeof document !== 'undefined' && 'startViewTransition' in document) {
      // @ts-ignore
      document.startViewTransition(() => setTheme(nextTheme));
    } else {
      setTheme(nextTheme);
    }
  };

  const toggleLanguage = () => {
    const nextLang = language === 'ID' ? 'EN' : 'ID';
    setLanguageState(nextLang);
    localStorage.setItem('mycashier_lang', nextLang);
  };

  // ── Cart ─────────────────────────────────────────────────────────
  const addToCart = (item: MenuItem, notes: string = '') => {
    setCart((prev) => {
      const existingIdx = prev.findIndex((c) => c.item.id === item.id && c.notes === notes);
      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx].quantity += 1;
        return updated;
      }
      return [...prev, { item, quantity: 1, notes }];
    });
  };

  const updateCartQuantity = (itemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => {
          if (c.item.id === itemId) {
            const newQty = c.quantity + delta;
            return newQty > 0 ? { ...c, quantity: newQty } : null;
          }
          return c;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const clearCart = () => setCart([]);

  // ── Menu Mutations ───────────────────────────────────────────────
  const toggleProductAvailability = async (productId: string) => {
    const item = menu.find((m) => m.id === productId);
    if (!item) return;
    const newAvailability = !item.isAvailable;

    // Optimistic UI update
    setMenu((prev) =>
      prev.map((m) => (m.id === productId ? { ...m, isAvailable: newAvailability } : m))
    );

    // Persist to DB (fire-and-forget, fallback gracefully)
    if (isDbConnected) {
      try {
        await fetch(`/api/menu/${productId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isAvailable: newAvailability }),
        });
      } catch (_) {}
    }
  };

  const addNewMenuItem = async (newItem: Omit<MenuItem, 'id'>) => {
    if (isDbConnected) {
      try {
        const res = await fetch('/api/menu', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newItem),
        });
        const json = await res.json();
        if (json.data) {
          setMenu((prev) => [json.data, ...prev]);
          return;
        }
      } catch (_) {}
    }
    // Fallback: local state only
    const id = `prod-${Date.now()}`;
    setMenu((prev) => [{ id, ...newItem }, ...prev]);
  };

  const updateMenuItem = async (id: string, updates: Partial<Omit<MenuItem, 'id'>>) => {
    if (isDbConnected) {
      try {
        const res = await fetch(`/api/menu/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });
        const json = await res.json();
        if (json.data) {
          setMenu((prev) => prev.map((m) => (m.id === id ? { ...m, ...json.data } : m)));
          return;
        }
      } catch (_) {}
    }
    // Fallback: local state only
    setMenu((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates } : m)));
  };

  const deleteMenuItem = async (productId: string) => {
    // Optimistic UI
    setMenu((prev) => prev.filter((item) => item.id !== productId));

    if (isDbConnected) {
      try {
        await fetch(`/api/menu/${productId}`, { method: 'DELETE' });
      } catch (_) {}
    }
  };

  // ── Order Mutations ──────────────────────────────────────────────
  const createOrder = (
    customerName: string,
    paymentMethod: PaymentMethod = 'CASH',
    isDirectPaid: boolean = false
  ): Order => {
    const timeStr = new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const items = cart.map((c, i) => ({
      id: `item-${Date.now()}-${i}`,
      productId: c.item.id,
      productName: c.item.name,
      price: c.item.price,
      quantity: c.quantity,
      notes: c.notes,
    }));

    const subtotal = cart.reduce((sum, c) => sum + c.item.price * c.quantity, 0);
    const taxMultiplier = 1 + (storeSettings.taxRate || 10) / 100;
    const totalAmount = Math.round(subtotal * taxMultiplier);

    const newOrder: Order = {
      id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      tableNumber: selectedTable,
      customerName: customerName || 'Pengunjung',
      items,
      totalAmount,
      status: 'PENDING',
      paymentStatus: isDirectPaid ? 'PAID' : 'UNPAID',
      paymentMethod,
      createdAt: timeStr,
    };

    setOrders((prev) => [newOrder, ...prev]);
    clearCart();

    // Persist to DB asynchronously
    if (isDbConnected) {
      fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: newOrder, items }),
      }).catch(() => {});
    }

    return newOrder;
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));

    if (isDbConnected) {
      fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      }).catch(() => {});
    }
  };

  const markOrderPaid = (orderId: string, method: PaymentMethod) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, paymentStatus: 'PAID', paymentMethod: method } : o
      )
    );

    if (isDbConnected) {
      fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus: 'PAID', paymentMethod: method }),
      }).catch(() => {});
    }
  };

  // ── Store Settings Mutations ─────────────────────────────────────
  const updateStoreSettings = async (updates: Partial<StoreSettings>) => {
    setStoreSettings((prev) => ({ ...prev, ...updates }));

    if (isDbConnected) {
      try {
        await fetch('/api/store-settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });
      } catch (_) {}
    }
  };

  return (
    <AppContext.Provider
      value={{
        authRole,
        loginAs,
        logout,
        theme,
        toggleTheme,
        language,
        toggleLanguage,
        selectedTable,
        setSelectedTable,
        cart,
        addToCart,
        updateCartQuantity,
        clearCart,
        menu,
        menuLoading,
        toggleProductAvailability,
        addNewMenuItem,
        updateMenuItem,
        deleteMenuItem,
        orders,
        ordersLoading,
        createOrder,
        updateOrderStatus,
        markOrderPaid,
        storeSettings,
        settingsLoading,
        updateStoreSettings,
        isDbConnected,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
