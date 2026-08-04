'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { TRANSLATIONS } from '@/data/translations';
import { ShieldCheck, Plus, Trash2, DollarSign, ShoppingBag, TrendingUp, Layers, Package, Users, X, Check, AlertTriangle } from 'lucide-react';
import Image from 'next/image';

export default function AdminCmsApp() {
  const { language, menu, orders, toggleProductAvailability, addNewMenuItem, deleteMenuItem } = useApp();
  const t = TRANSLATIONS[language].manager;

  const [activeTab, setActiveTab] = useState<'dashboard' | 'menu_master' | 'orders_log'>('dashboard');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'food' | 'drinks' | 'dessert' | 'snack'>('food');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');

  const paidOrders = orders.filter((o) => o.paymentStatus === 'PAID');
  const totalRevenue = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) return;

    addNewMenuItem({
      name,
      category,
      price: Number(price),
      description: description || 'Menu berkualitas pilihan restoran.',
      image: image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
      isAvailable: true,
      isPopular: false,
    });

    setIsAddModalOpen(false);
    setName('');
    setPrice('');
    setDescription('');
    setImage('');
  };

  return (
    <div className="py-6 px-4 max-w-7xl mx-auto select-none pb-24">
      {/* Admin Header */}
      <div className="mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Admin CMS Master Control</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
            Pusat Pengelolaan Data Master & Omzet Resto
          </h2>
          <p className="text-xs text-slate-500">
            Full control master data menu, manajemen stok inventory, & log laporan transaksi.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Menu Master</span>
        </button>
      </div>

      {/* Admin Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 mb-8 overflow-x-auto pb-1">
        {[
          { id: 'dashboard', label: 'Ringkasan Omzet', icon: <TrendingUp className="w-4 h-4" /> },
          { id: 'menu_master', label: `Master Menu (${menu.length})`, icon: <Package className="w-4 h-4" /> },
          { id: 'orders_log', label: `Log Transaksi (${orders.length})`, icon: <Layers className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === tab.id
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: DASHBOARD ANALYTICS */}
      {activeTab === 'dashboard' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex justify-between items-center text-xs text-slate-400 mb-2 font-medium">
                <span>Total Omzet Lunas</span>
                <DollarSign className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-3xl font-black text-slate-900 dark:text-white">
                Rp {totalRevenue.toLocaleString('id-ID')}
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex justify-between items-center text-xs text-slate-400 mb-2 font-medium">
                <span>Transaksi Lunas</span>
                <ShoppingBag className="w-4 h-4 text-cyan-500" />
              </div>
              <div className="text-3xl font-black text-slate-900 dark:text-white">
                {paidOrders.length} Pesanan
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex justify-between items-center text-xs text-slate-400 mb-2 font-medium">
                <span>Menu Favorit Resto</span>
                <TrendingUp className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-xl font-black text-emerald-500">
                Kopi Susu Aren Premium
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MASTER MENU CRUD */}
      {activeTab === 'menu_master' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {menu.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-800 flex-shrink-0 relative">
                  <Image src={item.image} alt={item.name} width={60} height={60} className="object-cover w-full h-full" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">{item.name}</h4>
                  <div className="text-emerald-500 text-xs font-black">
                    Rp {item.price.toLocaleString('id-ID')}
                  </div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">{item.category}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleProductAvailability(item.id)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold ${
                    item.isAvailable
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {item.isAvailable ? 'Tersedia' : 'Stok Habis'}
                </button>
                <button
                  onClick={() => deleteMenuItem(item.id)}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-rose-500 hover:bg-rose-500 hover:text-white transition-colors"
                  title="Hapus Menu"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: MASTER ORDERS LOG */}
      {activeTab === 'orders_log' && (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
              <div>
                <div className="font-bold text-slate-900 dark:text-white">{order.id} — {order.tableNumber} ({order.customerName})</div>
                <div className="text-slate-400 text-[11px] mt-0.5">{order.createdAt} • {order.paymentMethod}</div>
              </div>
              <div className="text-right">
                <div className="font-black text-emerald-500">Rp {order.totalAmount.toLocaleString('id-ID')}</div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${order.paymentStatus === 'PAID' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-500'}`}>
                  {order.paymentStatus}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add New Master Menu Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleAddSubmit} className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Tambah Menu Master Resto
              </h3>
              <button type="button" onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Nama Menu</label>
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Nasi Goreng Special..." className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs focus:outline-none focus:border-emerald-500" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Kategori</label>
              <select value={category} onChange={(e) => setCategory(e.target.value as any)} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs focus:outline-none focus:border-emerald-500">
                <option value="food">Makanan</option>
                <option value="drinks">Minuman</option>
                <option value="snack">Snack</option>
                <option value="dessert">Dessert</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Harga (Rp)</label>
              <input type="number" required value={price} onChange={(e) => setPrice(e.target.value)} placeholder="35000" className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs focus:outline-none focus:border-emerald-500" />
            </div>

            <button type="submit" className="w-full py-3 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20">
              Simpan Master Data
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
