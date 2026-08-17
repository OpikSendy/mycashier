'use client';

import React, { useState, useEffect, useTransition } from 'react';
import {
  X,
  ArrowRightLeft,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  Plus,
  RefreshCw,
  Building2,
  AlertTriangle,
  Layers,
  Search,
  Package,
  Calendar,
  UserCheck,
  FileText,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { TransferRecord, TransferStatus, StockMutationRecord, Branch } from '@/lib/inventoryEngine';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onStockUpdated?: () => void;
}

export default function TransferHubModal({ isOpen, onClose, onStockUpdated }: Props) {
  const { language, authSession, activeBranch } = useApp();
  const isEn = language === 'EN';

  const [activeTab, setActiveTab] = useState<'transfers' | 'ledger' | 'create'>('transfers');
  const [transfers, setTransfers] = useState<TransferRecord[]>([]);
  const [mutations, setMutations] = useState<StockMutationRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Form State for New Transfer
  const [sourceBranch, setSourceBranch] = useState('b-1');
  const [destBranch, setDestBranch] = useState('b-3');
  const [selectedItemId, setSelectedItemId] = useState('inv-coffee');
  const [itemQuantity, setItemQuantity] = useState<number>(10);
  const [itemUnit, setItemUnit] = useState('kg');
  const [transferNotes, setTransferNotes] = useState('');
  const [availableSourceStock, setAvailableSourceStock] = useState<number>(50);

  const BRANCH_LABELS: Record<string, { name: string; city: string; badge: string }> = {
    'b-1': { name: 'Cabang Jakarta Pusat', city: 'Jakarta', badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    'b-2': { name: 'Cabang Bandung Dago', city: 'Bandung', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    'b-3': { name: 'Cabang Bali Seminyak', city: 'Bali', badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
    'branch-jkt': { name: 'Cabang Jakarta Pusat', city: 'Jakarta', badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    'branch-bdg': { name: 'Cabang Bandung Dago', city: 'Bandung', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    'branch-bali': { name: 'Cabang Bali Seminyak', city: 'Bali', badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  };

  const ITEMS_CATALOG = [
    { id: 'inv-coffee', name: 'Biji Kopi House Blend Arabica', unit: 'kg' },
    { id: 'inv-milk', name: 'Susu Fresh Milk Pasteurisasi', unit: 'liter' },
    { id: 'inv-syrup', name: 'Sirup Gula Aren Organik', unit: 'liter' },
    { id: 'inv-wagyu', name: 'Daging Sapi Wagyu Slide SL', unit: 'kg' },
    { id: 'inv-matcha', name: 'Uji Matcha Powder Impor', unit: 'kg' },
    { id: 'inv-cup', name: 'Paper Cup Takeaway 12oz', unit: 'pcs' },
  ];

  // Fetch Transfers & Ledger
  const fetchTransferData = async () => {
    setLoading(true);
    setActionError(null);
    try {
      const res = await fetch('/api/inventory/transfers');
      const json = await res.json();
      if (json.data && Array.isArray(json.data)) {
        setTransfers(json.data);
      }

      // Also check source branch stock
      const invRes = await fetch(`/api/inventory?branchId=${sourceBranch}`);
      const invJson = await invRes.json();
      if (invJson.data && Array.isArray(invJson.data)) {
        const found = invJson.data.find((it: any) => it.id === selectedItemId);
        if (found) {
          setAvailableSourceStock(found.stock);
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch transfers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTransferData();
    }
  }, [isOpen, sourceBranch, selectedItemId]);

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);

    if (sourceBranch === destBranch) {
      setActionError(isEn ? 'Source and destination branches must differ.' : 'Cabang asal dan tujuan tidak boleh sama.');
      return;
    }

    if (itemQuantity <= 0) {
      setActionError(isEn ? 'Transfer quantity must be greater than 0.' : 'Jumlah transfer harus lebih dari 0.');
      return;
    }

    try {
      const res = await fetch('/api/inventory/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceBranchId: sourceBranch,
          destBranchId: destBranch,
          items: [{ itemId: selectedItemId, quantity: itemQuantity, unit: itemUnit }],
          requestedBy: authSession?.name || 'Store Admin',
          notes: transferNotes || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        setActionError(json.error || 'Failed to create transfer');
        return;
      }

      setActionSuccess(isEn ? 'Transfer request created in PENDING status!' : 'Permintaan transfer berhasil dibuat (Status: PENDING)!');
      setTransferNotes('');
      setActiveTab('transfers');
      fetchTransferData();
      onStockUpdated?.();
    } catch (err: any) {
      setActionError(err.message || 'Network error creating transfer');
    }
  };

  const handleTransferAction = async (transferId: string, action: string, reason?: string) => {
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await fetch(`/api/inventory/transfers/${transferId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          userId: authSession?.userId || 'admin-user',
          userName: authSession?.name || 'Store Director',
          userRole: authSession?.role || 'admin',
          notes: reason,
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        setActionError(json.error || `Failed to execute action ${action}`);
        return;
      }

      setActionSuccess(
        action === 'APPROVE'
          ? 'Transfer disetujui (APPROVED)!'
          : action === 'SHIP'
          ? 'Barang dalam pengiriman (IN_TRANSIT)!'
          : action === 'RECEIVE' || action === 'COMPLETE'
          ? 'Transfer SELESAI (COMPLETED) & Stok berhasil diperbarui secara atomik!'
          : action === 'REJECT'
          ? 'Transfer DITOLAK (REJECTED).'
          : 'Transfer DIBATALKAN (CANCELLED).'
      );

      fetchTransferData();
      onStockUpdated?.();
    } catch (err: any) {
      setActionError(err.message || `Error updating transfer`);
    }
  };

  if (!isOpen) return null;

  const filteredTransfers = transfers.filter((t) => {
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    const matchesSearch =
      t.transferNumber.toLowerCase().includes(search.toLowerCase()) ||
      (t.requestedBy && t.requestedBy.toLowerCase().includes(search.toLowerCase())) ||
      (t.notes && t.notes.toLowerCase().includes(search.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const pendingCount = transfers.filter((t) => t.status === 'PENDING').length;
  const inTransitCount = transfers.filter((t) => t.status === 'IN_TRANSIT').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in text-slate-100">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <ArrowRightLeft className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight">
                  {isEn ? 'Inter-Branch Inventory Transfer Hub' : 'Hub Transfer Stok Antar Cabang'}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Multi-Branch ERP
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isEn
                  ? 'Jakarta Pusat • Bandung Dago • Bali Seminyak stock logistics & atomic transactions'
                  : 'Distribusi bahan baku antar cabang Jakarta, Bandung, dan Bali dengan mutasi atomik realtime'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {pendingCount > 0 && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center gap-1.5 animate-pulse">
                <Clock className="w-3.5 h-3.5" />
                {pendingCount} {isEn ? 'Pending Approval' : 'Menunggu Approval'}
              </span>
            )}
            {inTransitCount > 0 && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5" />
                {inTransitCount} {isEn ? 'In Transit' : 'Dalam Pengiriman'}
              </span>
            )}
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Alerts */}
        {actionError && (
          <div className="mx-6 mt-4 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2 animate-fade-in">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{actionError}</span>
          </div>
        )}
        {actionSuccess && (
          <div className="mx-6 mt-4 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Nav Tabs */}
        <div className="px-6 pt-4 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('transfers')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'transfers'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>{isEn ? 'Active Transfers & Shipments' : 'Daftar Transfer & Pengiriman'} ({transfers.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('create')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'create'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>{isEn ? 'Create Transfer Request' : 'Buat Permintaan Transfer'}</span>
            </button>
          </div>

          <button
            onClick={fetchTransferData}
            disabled={loading}
            className="px-3 py-2 text-xs rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{isEn ? 'Sync' : 'Sinkron'}</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB 1: TRANSFERS LIST */}
          {activeTab === 'transfers' && (
            <div className="space-y-4">
              {/* Filter Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-800/40 border border-slate-800">
                <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder={isEn ? 'Search TRF number or requester...' : 'Cari nomor TRF atau nama pemohon...'}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="py-2 px-3 text-xs rounded-xl bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="ALL">Semua Status</option>
                    <option value="PENDING">PENDING (Menunggu Approval)</option>
                    <option value="APPROVED">APPROVED (Disetujui)</option>
                    <option value="IN_TRANSIT">IN_TRANSIT (Dalam Pengiriman)</option>
                    <option value="COMPLETED">COMPLETED (Selesai)</option>
                    <option value="REJECTED">REJECTED (Ditolak)</option>
                    <option value="CANCELLED">CANCELLED (Dibatalkan)</option>
                  </select>
                </div>
              </div>

              {/* Transfers Cards */}
              {filteredTransfers.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-xs border border-dashed border-slate-800 rounded-3xl">
                  <ArrowRightLeft className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                  Belum ada catatan transfer stock yang sesuai filter.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3.5">
                  {filteredTransfers.map((trf) => {
                    const srcInfo = BRANCH_LABELS[trf.sourceBranchId] || { name: trf.sourceBranchId, city: 'Origin', badge: 'bg-slate-800 text-slate-300' };
                    const dstInfo = BRANCH_LABELS[trf.destBranchId] || { name: trf.destBranchId, city: 'Destination', badge: 'bg-slate-800 text-slate-300' };

                    return (
                      <div
                        key={trf.id}
                        className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/90 hover:border-slate-700 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                      >
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span className="font-mono text-xs font-black text-indigo-400 tracking-wider">
                              {trf.transferNumber}
                            </span>

                            {/* Status Badge */}
                            {trf.status === 'PENDING' && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> PENDING
                              </span>
                            )}
                            {trf.status === 'APPROVED' && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3" /> APPROVED
                              </span>
                            )}
                            {trf.status === 'IN_TRANSIT' && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center gap-1">
                                <Truck className="w-3 h-3" /> IN TRANSIT
                              </span>
                            )}
                            {trf.status === 'COMPLETED' && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> COMPLETED
                              </span>
                            )}
                            {trf.status === 'REJECTED' && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                                <XCircle className="w-3 h-3" /> REJECTED
                              </span>
                            )}
                            {trf.status === 'CANCELLED' && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1">
                                <XCircle className="w-3 h-3" /> CANCELLED
                              </span>
                            )}

                            <span className="text-[11px] text-slate-500">
                              {new Date(trf.requestedAt).toLocaleString('id-ID')}
                            </span>
                          </div>

                          {/* Branch Route Diagram */}
                          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                            <span className={`px-2 py-0.5 rounded-lg border text-[11px] ${srcInfo.badge}`}>
                              {srcInfo.name}
                            </span>
                            <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                            <span className={`px-2 py-0.5 rounded-lg border text-[11px] ${dstInfo.badge}`}>
                              {dstInfo.name}
                            </span>
                          </div>

                          {/* Items List */}
                          <div className="flex flex-wrap gap-2 pt-1">
                            {trf.items.map((item, idx) => (
                              <span
                                key={idx}
                                className="px-2.5 py-1 rounded-xl bg-slate-800 border border-slate-700/80 text-xs font-medium text-slate-200"
                              >
                                📦 {item.quantity} {item.unit} — <strong className="text-white">{item.itemId}</strong>
                              </span>
                            ))}
                          </div>

                          {trf.notes && (
                            <p className="text-[11px] text-slate-400 italic">
                              Catatan: &ldquo;{trf.notes}&rdquo; (Pemohon: {trf.requestedBy})
                            </p>
                          )}
                        </div>

                        {/* Action Workflow Controls */}
                        <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 self-end md:self-center">
                          {trf.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleTransferAction(trf.id, 'APPROVE')}
                                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                              >
                                <ShieldCheck className="w-3.5 h-3.5" />
                                Setujui (Admin)
                              </button>
                              <button
                                onClick={() => handleTransferAction(trf.id, 'REJECT', 'Stok tidak mencukupi atau kendala logistik')}
                                className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-xs border border-rose-500/30 transition-all cursor-pointer"
                              >
                                Tolak
                              </button>
                              <button
                                onClick={() => handleTransferAction(trf.id, 'CANCEL')}
                                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 font-bold text-xs transition-all cursor-pointer"
                              >
                                Batalkan
                              </button>
                            </>
                          )}

                          {trf.status === 'APPROVED' && (
                            <>
                              <button
                                onClick={() => handleTransferAction(trf.id, 'SHIP')}
                                className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                              >
                                <Truck className="w-3.5 h-3.5" />
                                Kirim Barang
                              </button>
                              <button
                                onClick={() => handleTransferAction(trf.id, 'CANCEL')}
                                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 font-bold text-xs transition-all cursor-pointer"
                              >
                                Batalkan
                              </button>
                            </>
                          )}

                          {trf.status === 'IN_TRANSIT' && (
                            <button
                              onClick={() => handleTransferAction(trf.id, 'RECEIVE')}
                              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              Terima &amp; Selesaikan Transfer
                            </button>
                          )}

                          {trf.status === 'COMPLETED' && (
                            <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Berhasil Dimutasi
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CREATE TRANSFER REQUEST */}
          {activeTab === 'create' && (
            <form onSubmit={handleCreateTransfer} className="max-w-2xl mx-auto space-y-5 bg-slate-800/40 p-6 rounded-3xl border border-slate-800">
              <div className="border-b border-slate-700 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4 text-indigo-400" />
                  Form Permintaan Transfer Bahan Antar Cabang
                </h3>
                <p className="text-[11px] text-slate-400">
                  Pindahkan stok bahan baku dari cabang berlebih ke cabang yang membutuhkan.
                </p>
              </div>

              {/* Branch Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Cabang Asal (Pengirim) *</label>
                  <select
                    value={sourceBranch}
                    onChange={(e) => setSourceBranch(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="b-1">🏢 Cabang Jakarta Pusat (Grand Indonesia)</option>
                    <option value="b-2">🏢 Cabang Bandung Dago (Jl. Juanda)</option>
                    <option value="b-3">🏢 Cabang Bali Seminyak (Jl. Kayu Aya)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Cabang Tujuan (Penerima) *</label>
                  <select
                    value={destBranch}
                    onChange={(e) => setDestBranch(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="b-3">🏢 Cabang Bali Seminyak (Jl. Kayu Aya)</option>
                    <option value="b-2">🏢 Cabang Bandung Dago (Jl. Juanda)</option>
                    <option value="b-1">🏢 Cabang Jakarta Pusat (Grand Indonesia)</option>
                  </select>
                </div>
              </div>

              {/* Item Selector & Available Stock */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Pilih Bahan Baku *</label>
                  <select
                    value={selectedItemId}
                    onChange={(e) => {
                      setSelectedItemId(e.target.value);
                      const cat = ITEMS_CATALOG.find((it) => it.id === e.target.value);
                      if (cat) setItemUnit(cat.unit);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-medium focus:outline-none focus:border-indigo-500"
                  >
                    {ITEMS_CATALOG.map((it) => (
                      <option key={it.id} value={it.id}>
                        {it.name} ({it.unit})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Jumlah Transfer *</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      required
                      value={itemQuantity}
                      onChange={(e) => setItemQuantity(Number(e.target.value))}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
                    />
                    <span className="px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-400 font-mono flex items-center">
                      {itemUnit}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stock Availability Info */}
              <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/20 flex items-center justify-between text-xs">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-indigo-400" />
                  Stok Tersedia di Cabang Asal:
                </span>
                <span className="font-bold text-indigo-300">
                  {availableSourceStock} {itemUnit}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Alasan / Catatan Transfer</label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Stok menipis menjelang weekend festival / Restock darurat"
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('transfers')}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  Ajukan Permintaan Transfer
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex justify-between items-center text-xs text-slate-400">
          <div>
            Total Transaksi Transfer: <span className="font-semibold text-slate-200">{transfers.length}</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors cursor-pointer"
          >
            {isEn ? 'Close' : 'Tutup'}
          </button>
        </div>

      </div>
    </div>
  );
}
