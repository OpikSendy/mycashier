'use client';

import React, { useState, useEffect } from 'react';
import { X, Split, Users, ShoppingBag, CheckCircle2, QrCode, CreditCard, DollarSign, Calculator } from 'lucide-react';
import { Order, PaymentMethod } from '@/data/initialData';
import { useApp } from '@/context/AppContext';
import { calculateEqualSplit, calculateOrderTotals, formatRupiah } from '@/lib/taxEngine';

interface Props {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (orderId: string, method: PaymentMethod) => void;
}

type SplitMode = 'equal' | 'itemized';

export default function SplitBillModal({ order, isOpen, onClose, onSuccess }: Props) {
  const { language, storeSettings } = useApp();
  const isEn = language === 'EN';

  const [mode, setMode] = useState<SplitMode>('equal');
  const [guestCount, setGuestCount] = useState<number>(2);
  const [paidGuests, setPaidGuests] = useState<boolean[]>([]);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('QRIS');

  useEffect(() => {
    if (order) {
      setGuestCount(2);
      setPaidGuests([false, false]);
      setSelectedItemIds([]);
    }
  }, [order]);

  useEffect(() => {
    setPaidGuests(Array(guestCount).fill(false));
  }, [guestCount]);

  if (!isOpen || !order) return null;

  const equalSplit = calculateEqualSplit(order.totalAmount, guestCount, storeSettings?.cashRoundingRule || 'NONE');
  const perPersonAmount = equalSplit.perGuestAmount;
  const paidCount = paidGuests.filter(Boolean).length;

  const handleToggleGuestPaid = (index: number) => {
    setPaidGuests((prev) => {
      const updated = [...prev];
      updated[index] = !updated[index];
      return updated;
    });
  };

  const handleToggleItemSelect = (itemId: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  const handleSelectAllItems = () => {
    if (selectedItemIds.length === order.items.length) {
      setSelectedItemIds([]);
    } else {
      setSelectedItemIds(order.items.map((i) => i.id));
    }
  };

  const selectedItemsSubtotal = order.items
    .filter((item) => selectedItemIds.includes(item.id))
    .reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Calculate dynamic tax, service charge, and cash rounding for itemized partial payment
  const itemizedTotals = calculateOrderTotals(
    selectedItemsSubtotal,
    0,
    storeSettings,
    selectedMethod === 'CASH'
  );

  const handleFinalize = () => {
    onSuccess(order.id, selectedMethod);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col text-slate-100">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Split className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">
                {isEn ? 'Split Bill Calculator' : 'Fasilitas Split Bill / Bagi Bayar'}
              </h3>
              <p className="text-xs text-slate-400">
                {order.id} • {order.tableNumber} ({order.customerName})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="p-4 bg-slate-900/60 border-b border-slate-800 flex items-center justify-center gap-3">
          <button
            onClick={() => setMode('equal')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              mode === 'equal'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>{isEn ? 'Equal Split (Bagi Rata)' : 'Bagi Rata (Per Orang)'}</span>
          </button>
          <button
            onClick={() => setMode('itemized')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              mode === 'itemized'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{isEn ? 'Itemized Split (Per Item)' : 'Bagi per Item Menu'}</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto max-h-[60vh] space-y-6">
          {mode === 'equal' ? (
            <div className="space-y-5">
              {/* Stepper for Guest Count */}
              <div className="bg-slate-800/40 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-400">{isEn ? 'Number of Guests' : 'Jumlah Orang'}</div>
                  <div className="text-xl font-black text-white">{guestCount} {isEn ? 'People' : 'Orang'}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setGuestCount(Math.max(2, guestCount - 1))}
                    className="w-10 h-10 rounded-xl bg-slate-800 text-slate-200 font-bold text-lg hover:bg-slate-700 active:scale-95 cursor-pointer"
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-bold text-indigo-400 text-base">{guestCount}</span>
                  <button
                    onClick={() => setGuestCount(Math.min(10, guestCount + 1))}
                    className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-bold text-lg hover:bg-indigo-500 active:scale-95 cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Per Person Breakdown Card */}
              <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-indigo-500/30 rounded-2xl p-5 text-center">
                <div className="text-xs text-indigo-300 font-medium uppercase tracking-wider mb-1">
                  {isEn ? 'Amount Per Person' : 'Nominal Per Orang (Bagi Rata)'}
                </div>
                <div className="text-3xl font-black text-indigo-400">
                  {formatRupiah(perPersonAmount)}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Total Tagihan: {formatRupiah(order.totalAmount)} ({guestCount} bagian)
                </div>
              </div>

              {/* Guest Payment Checklist */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-2">
                  {isEn ? 'Guest Payment Tracker' : 'Status Pembayaran Per Orang'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {paidGuests.map((isPaid, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleToggleGuestPaid(idx)}
                      className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                        isPaid
                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                          : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold">Orang #{idx + 1}</div>
                        <div className="text-[11px] opacity-80">{formatRupiah(perPersonAmount)}</div>
                      </div>
                      <CheckCircle2 className={`w-5 h-5 ${isPaid ? 'text-emerald-400' : 'text-slate-600'}`} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">
                  {isEn
                    ? 'Select items for this partial payment:'
                    : 'Pilih item menu yang akan dibayar pada sub-pembayaran ini:'}
                </p>
                <button
                  type="button"
                  onClick={handleSelectAllItems}
                  className="text-[11px] text-indigo-400 hover:underline font-bold cursor-pointer"
                >
                  {selectedItemIds.length === order.items.length ? (isEn ? 'Deselect All' : 'Batalkan Semua') : (isEn ? 'Select All' : 'Pilih Semua')}
                </button>
              </div>

              <div className="space-y-2">
                {order.items.map((item) => {
                  const isSelected = selectedItemIds.includes(item.id);
                  const itemTotal = item.price * item.quantity;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleToggleItemSelect(item.id)}
                      className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-200'
                          : 'bg-slate-800/40 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                          isSelected ? 'bg-indigo-500 border-indigo-400 text-white' : 'border-slate-600'
                        }`}>
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-200">{item.productName}</div>
                          <div className="text-[10px] text-slate-400">
                            {item.quantity}x @ {formatRupiah(item.price)}
                          </div>
                        </div>
                      </div>

                      <div className="text-xs font-black text-white">
                        {formatRupiah(itemTotal)}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Itemized Tax & Fee Breakdown Card */}
              <div className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700 space-y-2 text-xs font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>{isEn ? 'Selected Subtotal:' : 'Subtotal Item Terpilih:'}</span>
                  <span className="text-slate-200 font-bold">{formatRupiah(itemizedTotals.subtotal)}</span>
                </div>

                {itemizedTotals.serviceChargeAmount > 0 && (
                  <div className="flex justify-between text-slate-400">
                    <span>Service Charge ({itemizedTotals.serviceChargeRate}%):</span>
                    <span className="text-indigo-400">{formatRupiah(itemizedTotals.serviceChargeAmount)}</span>
                  </div>
                )}

                {itemizedTotals.taxAmount > 0 && (
                  <div className="flex justify-between text-slate-400">
                    <span>Pajak Resto PB1 ({itemizedTotals.taxRate}%):</span>
                    <span className="text-amber-400">{formatRupiah(itemizedTotals.taxAmount)}</span>
                  </div>
                )}

                {itemizedTotals.roundingAdjustment !== 0 && (
                  <div className="flex justify-between text-slate-400">
                    <span>Pembulatan:</span>
                    <span className="text-cyan-400">
                      {itemizedTotals.roundingAdjustment > 0 ? '+' : ''}{formatRupiah(itemizedTotals.roundingAdjustment)}
                    </span>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-700 flex justify-between items-center text-sm font-black text-white font-sans">
                  <span>{isEn ? 'Total for Selected Items:' : 'Total Tagihan Bagian Ini:'}</span>
                  <span className="text-emerald-400 text-base">{formatRupiah(itemizedTotals.finalTotal)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Payment Method Selector */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-2">
              {isEn ? 'Select Payment Method' : 'Pilih Metode Pembayaran'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'QRIS', label: 'QRIS Instant', icon: <QrCode className="w-4 h-4 text-cyan-400" /> },
                { id: 'CASH', label: 'Tunai / Cash', icon: <DollarSign className="w-4 h-4 text-emerald-400" /> },
                { id: 'DEBIT', label: 'EDC / Debit', icon: <CreditCard className="w-4 h-4 text-indigo-400" /> },
              ].map((pm) => (
                <button
                  key={pm.id}
                  onClick={() => setSelectedMethod(pm.id as PaymentMethod)}
                  className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                    selectedMethod === pm.id
                      ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-lg'
                      : 'bg-slate-800/40 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {pm.icon}
                  <span>{pm.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            {mode === 'equal' ? (
              <span>Terbayar: <strong className="text-emerald-400">{paidCount}/{guestCount} orang</strong></span>
            ) : (
              <span>Item terpilih: <strong className="text-indigo-400">{selectedItemIds.length} menu</strong></span>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
            >
              {isEn ? 'Cancel' : 'Batal'}
            </button>
            <button
              onClick={handleFinalize}
              disabled={mode === 'itemized' && selectedItemIds.length === 0}
              className="px-5 py-2 text-xs font-extrabold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isEn ? 'Confirm Split Payment' : 'Konfirmasi Pelunasan Split Bill'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
