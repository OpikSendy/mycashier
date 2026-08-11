'use client';

import React, { useState } from 'react';
import { X, MapPin, QrCode, Printer, Copy, Check, Users, Plus, LayoutGrid, CheckCircle2, AlertCircle } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Order } from '@/data/initialData';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
}

interface TableInfo {
  id: string;
  name: string;
  capacity: number;
  section: 'Indoor VIP' | 'Main Hall' | 'Outdoor Terrace';
}

const DEFAULT_TABLES: TableInfo[] = Array.from({ length: 12 }, (_, i) => ({
  id: `tbl-${i + 1}`,
  name: `Meja ${String(i + 1).padStart(2, '0')}`,
  capacity: i % 3 === 0 ? 6 : i % 2 === 0 ? 4 : 2,
  section: i < 4 ? 'Main Hall' : i < 8 ? 'Indoor VIP' : 'Outdoor Terrace',
}));

export default function TableMapModal({ isOpen, onClose, orders }: Props) {
  const { language, storeSettings } = useApp();
  const isEn = language === 'EN';

  const [tablesList, setTablesList] = useState<TableInfo[]>(DEFAULT_TABLES);
  const [selectedTableForQr, setSelectedTableForQr] = useState<TableInfo | null>(null);
  const [copiedTable, setCopiedTable] = useState<string | null>(null);
  const [newTableName, setNewTableName] = useState('');
  const [activeSectionFilter, setActiveSectionFilter] = useState<string>('all');

  if (!isOpen) return null;

  const handleCopyLink = (tableName: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://mycashier-five.vercel.app';
    const link = `${origin}/?table=${encodeURIComponent(tableName)}`;
    navigator.clipboard.writeText(link);
    setCopiedTable(tableName);
    setTimeout(() => setCopiedTable(null), 2000);
  };

  const handlePrintStandee = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleAddTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableName) return;
    const newTbl: TableInfo = {
      id: `tbl-${Date.now()}`,
      name: newTableName.startsWith('Meja') ? newTableName : `Meja ${newTableName}`,
      capacity: 4,
      section: 'Main Hall',
    };
    setTablesList((prev) => [...prev, newTbl]);
    setNewTableName('');
  };

  const filteredTables = tablesList.filter(
    (t) => activeSectionFilter === 'all' || t.section === activeSectionFilter
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in print:bg-white print:p-0">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100 print:border-none print:shadow-none print:max-w-none print:max-h-none print:bg-white print:text-black">
        
        {/* Header (Hidden when printing) */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/80 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <LayoutGrid className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">
                {isEn ? 'Table Floor Map & QR Standee' : 'Visual Peta Denah Meja & Cetak Standee QR'}
              </h2>
              <p className="text-xs text-slate-400">
                {isEn
                  ? 'Manage store table layout & print self-ordering QR codes'
                  : 'Kelola denah area resto, cek status meja terisi & cetak QR Code Meja'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Section & Add Form (Hidden when printing) */}
        <div className="p-4 bg-slate-900/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2">
            {['all', 'Main Hall', 'Indoor VIP', 'Outdoor Terrace'].map((sec) => (
              <button
                key={sec}
                onClick={() => setActiveSectionFilter(sec)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeSectionFilter === sec
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {sec === 'all' ? (isEn ? 'All Areas' : 'Semua Area') : sec}
              </button>
            ))}
          </div>

          <form onSubmit={handleAddTable} className="flex items-center gap-2">
            <input
              type="text"
              placeholder={isEn ? 'New table name (e.g. 13)' : 'Nama meja baru (cth. 13)'}
              value={newTableName}
              onChange={(e) => setNewTableName(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              {isEn ? 'Add Table' : 'Tambah'}
            </button>
          </form>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Printable Standee View (Triggered when table selected) */}
          {selectedTableForQr ? (
            <div className="p-8 rounded-3xl bg-white text-slate-900 border border-slate-200 shadow-xl max-w-md mx-auto text-center space-y-6 animate-fade-in print:shadow-none print:border-none print:w-full print:max-w-none">
              <div className="flex items-center justify-between border-b pb-4 print:hidden">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">QR Code Standee Preview</span>
                <button
                  onClick={() => setSelectedTableForQr(null)}
                  className="text-xs text-slate-500 hover:text-slate-900 font-semibold"
                >
                  ← kembali ke peta
                </button>
              </div>

              {/* Store Branding */}
              <div className="space-y-1">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-xl shadow-md">
                  MC
                </div>
                <h3 className="text-xl font-black tracking-tight text-slate-900 pt-2">
                  {storeSettings.name || 'MyCashier Resto'}
                </h3>
                <p className="text-xs text-slate-500 font-medium">Self-Service Table Scan & Order</p>
              </div>

              {/* Table Badge */}
              <div className="inline-block px-6 py-2 rounded-2xl bg-emerald-600 text-white font-black text-2xl shadow-lg shadow-emerald-500/30">
                {selectedTableForQr.name}
              </div>

              {/* QR Code Container */}
              <div className="p-4 bg-slate-50 border-2 border-dashed border-slate-300 rounded-3xl inline-block shadow-inner">
                {/* Embedded Dynamic QR Image */}
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                    typeof window !== 'undefined'
                      ? `${window.location.origin}/?table=${encodeURIComponent(selectedTableForQr.name)}`
                      : `https://mycashier-five.vercel.app/?table=${encodeURIComponent(selectedTableForQr.name)}`
                  )}`}
                  alt={`QR ${selectedTableForQr.name}`}
                  className="w-48 h-48 mx-auto"
                />
              </div>

              <div className="space-y-1 text-xs text-slate-600 font-medium">
                <p className="font-bold text-slate-900">📲 Pindai QR ini untuk Memesan Menu</p>
                <p className="text-[11px] text-slate-500">Scan using camera or QR scanner to view menu & order directly from table.</p>
              </div>

              {/* Actions (Print & Copy) */}
              <div className="flex items-center justify-center gap-3 pt-2 print:hidden">
                <button
                  onClick={() => handleCopyLink(selectedTableForQr.name)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5"
                >
                  {copiedTable === selectedTableForQr.name ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>Link Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Salin Link QR</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handlePrintStandee}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/30"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Standee Meja</span>
                </button>
              </div>
            </div>
          ) : (
            /* Table Grid View */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {filteredTables.map((t) => {
                const activeOrder = orders.find(
                  (o) => o.tableNumber === t.name && o.status !== 'SERVED' && o.status !== 'COMPLETED'
                );
                const isOccupied = Boolean(activeOrder);

                return (
                  <div
                    key={t.id}
                    className={`p-5 rounded-3xl border transition-all flex flex-col justify-between space-y-4 relative overflow-hidden ${
                      isOccupied
                        ? 'bg-rose-950/30 border-rose-500/40 text-rose-100'
                        : 'bg-slate-800/40 border-slate-800 hover:border-slate-700 text-slate-100'
                    }`}
                  >
                    {/* Header Table */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                        {t.section}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                          isOccupied
                            ? 'bg-rose-500/20 text-rose-400 border-rose-500/30 animate-pulse'
                            : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        }`}
                      >
                        {isOccupied ? 'Terisi / Active' : 'Kosong'}
                      </span>
                    </div>

                    {/* Table Title & Seat info */}
                    <div>
                      <h4 className="text-2xl font-black text-white tracking-tight">{t.name}</h4>
                      <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>Kapasitas {t.capacity} Kursi</span>
                      </div>
                    </div>

                    {/* Active Order Summary if occupied */}
                    {isOccupied && activeOrder && (
                      <div className="p-2.5 rounded-xl bg-slate-900/80 border border-rose-500/30 text-[11px] space-y-0.5">
                        <div className="font-bold text-rose-300 truncate">{activeOrder.customerName}</div>
                        <div className="text-[10px] text-slate-400">
                          {activeOrder.items.length} item • Rp {activeOrder.totalAmount.toLocaleString('id-ID')}
                        </div>
                      </div>
                    )}

                    {/* Standee QR Button */}
                    <button
                      onClick={() => setSelectedTableForQr(t)}
                      className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 flex items-center justify-center gap-1.5 transition-colors border border-slate-700"
                    >
                      <QrCode className="w-4 h-4 text-emerald-400" />
                      <span>Lihat QR Standee</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex justify-between items-center text-xs text-slate-400 print:hidden">
          <div>
            Total Meja Resto: <span className="font-semibold text-slate-200">{tablesList.length} Meja</span>
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
