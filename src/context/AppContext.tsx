'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { MenuItem, Order, INITIAL_MENU, INITIAL_ORDERS, OrderStatus, PaymentMethod } from '@/data/initialData';

export type UserRole = 'user_pwa' | 'cashier_pos' | 'admin_cms';
export type Theme = 'dark' | 'light';
export type Language = 'ID' | 'EN';

export interface CartItem {
  item: MenuItem;
  quantity: number;
  notes: string;
}

interface AppContextType {
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
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
  menu: MenuItem[];
  toggleProductAvailability: (productId: string) => void;
  addNewMenuItem: (newItem: Omit<MenuItem, 'id'>) => void;
  deleteMenuItem: (productId: string) => void;
  orders: Order[];
  createOrder: (customerName: string, paymentMethod?: PaymentMethod, isDirectPaid?: boolean) => Order;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  markOrderPaid: (orderId: string, method: PaymentMethod) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [activeRole, setActiveRoleState] = useState<UserRole>('user_pwa');
  const [theme, setTheme] = useState<Theme>('dark');
  const [language, setLanguageState] = useState<Language>('ID');
  const [selectedTable, setSelectedTable] = useState<string>('Meja 04');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>(INITIAL_MENU);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedRole = localStorage.getItem('mycashier_role') as UserRole;
    const savedTheme = localStorage.getItem('mycashier_theme') as Theme;
    const savedLang = localStorage.getItem('mycashier_lang') as Language;
    if (savedRole) setActiveRoleState(savedRole);
    if (savedTheme) setTheme(savedTheme);
    if (savedLang) setLanguageState(savedLang);
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

  const setActiveRole = (role: UserRole) => {
    if (typeof document !== 'undefined' && 'startViewTransition' in document) {
      // @ts-ignore
      document.startViewTransition(() => {
        setActiveRoleState(role);
      });
    } else {
      setActiveRoleState(role);
    }
    localStorage.setItem('mycashier_role', role);
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    if (typeof document !== 'undefined' && 'startViewTransition' in document) {
      // @ts-ignore
      document.startViewTransition(() => {
        setTheme(nextTheme);
      });
    } else {
      setTheme(nextTheme);
    }
  };

  const toggleLanguage = () => {
    const nextLang = language === 'ID' ? 'EN' : 'ID';
    setLanguageState(nextLang);
    localStorage.setItem('mycashier_lang', nextLang);
  };

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
    setCart((prev) => {
      return prev
        .map((c) => {
          if (c.item.id === itemId) {
            const newQty = c.quantity + delta;
            return newQty > 0 ? { ...c, quantity: newQty } : null;
          }
          return c;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const clearCart = () => setCart([]);

  const toggleProductAvailability = (productId: string) => {
    setMenu((prev) =>
      prev.map((item) =>
        item.id === productId ? { ...item, isAvailable: !item.isAvailable } : item
      )
    );
  };

  const addNewMenuItem = (newItem: Omit<MenuItem, 'id'>) => {
    const id = `prod-${Date.now()}`;
    setMenu((prev) => [{ id, ...newItem }, ...prev]);
  };

  const deleteMenuItem = (productId: string) => {
    setMenu((prev) => prev.filter((item) => item.id !== productId));
  };

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
    const tax = subtotal * 0.1;
    const totalAmount = subtotal + tax;

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
    return newOrder;
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o))
    );
  };

  const markOrderPaid = (orderId: string, method: PaymentMethod) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, paymentStatus: 'PAID', paymentMethod: method } : o
      )
    );
  };

  return (
    <AppContext.Provider
      value={{
        activeRole,
        setActiveRole,
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
        toggleProductAvailability,
        addNewMenuItem,
        deleteMenuItem,
        orders,
        createOrder,
        updateOrderStatus,
        markOrderPaid,
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
