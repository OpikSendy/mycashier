'use client';

import React, { useState, useEffect } from 'react';
import { X, Package, AlertTriangle, Plus, RefreshCw, Search, CheckCircle2, TrendingDown } from 'lucide-react';
import { InventoryItem, INITIAL_INVENTORY } from '@/data/initialData';
import { useApp } from '@/context/AppContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function InventoryManagerModal({ isOpen, onClose }: Props) {
  const { language } = useApp();
  const isEn = language === 'EN';

  const [items, setItems] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);

  // New Item State
  const [newItem, setNewItem] = useState<Partial<InventoryItem>>({
    name: '',
    nameEn: '',
    category: 'raw_material',
    stock: 10,
    unit: 'kg',
    minThreshold: 3,
    costPerUnit: 50000,
  });

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/inventory');
      const json = await res.json();
      if (json.data && Array.isArray(json.data)) {
        setItems(json.data);
      }
    } catch (_) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchInventory();
    }
  }, [isOpen]);

  const handleAdjustStock = async (id: string, delta: number) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, stock: Math.max(0, item.stock + delta) } : item))
    );

    try {
      await fetch('/api/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, delta }),
      });
    } catch (_) {}
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name) return;

    const itemToSave: InventoryItem = {
      id: `inv-${Date.now()}`,
      name: newItem.name,
      nameEn: newItem.nameEn || newItem.name,
      category: (newItem.category as any) || 'raw_material',
      stock: Number(newItem.stock) || 0,
      unit: (newItem.unit as any) || 'kg',
      minThreshold: Number(newItem.minThreshold) || 1,
      costPerUnit: Number(newItem.costPerUnit) || 0,
      lastRestocked: new Date().toISOString().split('T')[0],
    };

    setItems((prev) => [itemToSave, ...prev]);
    setShowAddForm(false);
    setNewItem({
      name: '',
      nameEn: '',
      category: 'raw_material',
      stock: 10,
      unit: 'kg',
      minThreshold: 3,
      costPerUnit: 50000,
    });

    try {
      await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemToSave),
      });
    } catch (_) {}
  };

  if (!isOpen) return null;

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.nameEn && item.nameEn.toLowerCase().includes(search.toLowerCase()));
    const matchesCat = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const lowStockCount = items.filter((i) => i.stock <= i.minThreshold).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">
                {isEn ? 'Raw Material & Inventory Stock' : 'Manajemen Stok & Bahan Baku'}
              </h2>
              <p className="text-xs text-slate-400">
                {isEn
                  ? 'Real-time inventory tracking & auto-deduction alerts'
                  : 'Pantau stok bahan baku, kemasan & alert pengingat otomatis'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {lowStockCount > 0 && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center gap-1.5 animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5" />
                {lowStockCount} {isEn ? 'Low Stock Items' : 'Item Stok Menipis'}
              </span>
            )}
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="p-4 bg-slate-900/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[240px]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={isEn ? 'Search raw material name...' : 'Cari nama bahan baku...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-800/80 border border-slate-700 focus:outline-none focus:border-amber-500 text-slate-100"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="py-2 px-3 text-xs rounded-xl bg-slate-800 border border-slate-700 focus:outline-none focus:border-amber-500 text-slate-200"
            >
              <option value="all">{isEn ? 'All Categories' : 'Semua Kategori'}</option>
              <option value="raw_material">{isEn ? 'Raw Materials' : 'Bahan Utam/Daging/Biji'}</option>
              <option value="beverage_base">{isEn ? 'Beverage Base/Dairy' : 'Base Minuman/Susu'}</option>
              <option value="packaging">{isEn ? 'Packaging' : 'Kemasan/Cup/Pouch'}</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchInventory}
              disabled={loading}
              className="px-3 py-2 text-xs rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              {isEn ? 'Refresh' : 'Muat Ulang'}
            </button>

            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-4 py-2 text-xs font-medium rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              {isEn ? 'Add Material' : 'Tambah Bahan'}
            </button>
          </div>
        </div>

        {/* Form Modal / Add View */}
        {showAddForm && (
          <form onSubmit={handleCreateItem} className="p-4 bg-slate-800/50 border-b border-slate-700/80 grid grid-cols-1 md:grid-cols-4 gap-3 animate-fade-in">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Nama Bahan (ID)</label>
              <input
                type="text"
                required
                placeholder="cth. Syrup Vanila Monin"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Nama Bahan (EN)</label>
              <input
                type="text"
                placeholder="cth. Monin Vanilla Syrup"
                value={newItem.nameEn}
                onChange={(e) => setNewItem({ ...newItem, nameEn: e.target.value })}
                className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Kategori</label>
              <select
                value={newItem.category}
                onChange={(e) => setNewItem({ ...newItem, category: e.target.value as any })}
                className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white"
              >
                <option value="raw_material">Bahan Utama</option>
                <option value="beverage_base">Base Minuman / Dairy</option>
                <option value="packaging">Packaging / Cup</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Stok & Satuan</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.1"
                  required
                  placeholder="Jumlah"
                  value={newItem.stock}
                  onChange={(e) => setNewItem({ ...newItem, stock: Number(e.target.value) })}
                  className="w-1/2 px-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white"
                />
                <select
                  value={newItem.unit}
                  onChange={(e) => setNewItem({ ...newItem, unit: e.target.value as any })}
                  className="w-1/2 px-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white"
                >
                  <option value="kg">kg</option>
                  <option value="liter">liter</option>
                  <option value="pcs">pcs</option>
                  <option value="pack">pack</option>
                </select>
              </div>
            </div>
            <div className="md:col-span-4 flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 text-xs rounded-lg bg-slate-800 text-slate-300"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-amber-500 text-slate-950 hover:bg-amber-400"
              >
                Simpan Bahan Baru
              </button>
            </div>
          </form>
        )}

        {/* Content Table */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/40">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-800/80 text-[11px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-700">
                  <th className="py-3.5 px-4">{isEn ? 'Item Name' : 'Bahan Baku'}</th>
                  <th className="py-3.5 px-4">{isEn ? 'Category' : 'Kategori'}</th>
                  <th className="py-3.5 px-4">{isEn ? 'Current Stock' : 'Stok Tersedia'}</th>
                  <th className="py-3.5 px-4">{isEn ? 'Status' : 'Status Alert'}</th>
                  <th className="py-3.5 px-4 text-right">{isEn ? 'Adjust Stock' : 'Aksi Restok'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {filteredItems.map((item) => {
                  const isLow = item.stock <= item.minThreshold;

                  return (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-200">
                          {isEn && item.nameEn ? item.nameEn : item.name}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Restock: {item.lastRestocked} • Min Threshold: {item.minThreshold} {item.unit}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                          {item.category === 'raw_material'
                            ? 'Bahan Utama'
                            : item.category === 'beverage_base'
                            ? 'Base Minuman'
                            : 'Packaging'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-sm text-slate-100">
                          {item.stock} <span className="text-xs font-normal text-slate-400">{item.unit}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {isLow ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center w-fit gap-1">
                            <TrendingDown className="w-3 h-3" />
                            {isEn ? 'Low Stock Warning' : 'Stok Menipis!'}
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center w-fit gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            {isEn ? 'Safe' : 'Stok Aman'}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleAdjustStock(item.id, -1)}
                            className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold flex items-center justify-center border border-slate-700 transition-colors"
                          >
                            -
                          </button>
                          <button
                            onClick={() => handleAdjustStock(item.id, 1)}
                            className="w-7 h-7 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 font-bold flex items-center justify-center border border-amber-500/30 transition-colors"
                          >
                            +
                          </button>
                          <button
                            onClick={() => handleAdjustStock(item.id, 5)}
                            className="px-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-[10px] font-semibold border border-emerald-500/30 transition-colors"
                          >
                            +5 {item.unit}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex justify-between items-center text-xs text-slate-400">
          <div>
            Total Jenis Bahan: <span className="font-semibold text-slate-200">{items.length}</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors"
          >
            {isEn ? 'Close' : 'Tutup'}
          </button>
        </div>

      </div>
    </div>
  );
}
