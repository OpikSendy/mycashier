'use client';

import React, { useState } from 'react';
import { AuditLogEntry } from '@/lib/audit';
import {
  X,
  ShieldCheck,
  AlertTriangle,
  User,
  Clock,
  Globe,
  Laptop,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Layers,
  FileCode,
  ArrowRight,
} from 'lucide-react';

export interface AuditDiffModalProps {
  isOpen: boolean;
  onClose: () => void;
  log: AuditLogEntry | null;
}

export default function AuditDiffModal({ isOpen, onClose, log }: AuditDiffModalProps) {
  const [copied, setCopied] = useState(false);
  const [showRawJson, setShowRawJson] = useState(false);

  if (!isOpen || !log) return null;

  const diffKeys = log.diff ? Object.keys(log.diff) : [];
  const hasDiff = diffKeys.length > 0;

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(log, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30';
      case 'cashier':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
      case 'kitchen':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';
      default:
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30';
    }
  };

  const getActionBadgeClass = (action: string) => {
    if (action.includes('DELETE') || action.includes('FAILURE') || action.includes('ATTEMPT')) {
      return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30';
    }
    if (action.includes('UPDATE') || action.includes('OVERRIDE')) {
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';
    }
    if (action.includes('CREATE') || action.includes('LOGIN') || action.includes('APPROVE')) {
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
    }
    return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30';
  };

  const formatValue = (val: any): string => {
    if (val === undefined) return '— (Tidak ada)';
    if (val === null) return 'null';
    if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
    if (typeof val === 'object') return JSON.stringify(val, null, 2);
    return String(val);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Inspeksi Diff Mutasi Audit
                </h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getActionBadgeClass(
                    log.actionType
                  )}`}
                >
                  {log.actionType}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-mono">ID: {log.id}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Aktor */}
            <div className="p-3 rounded-2xl bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
              <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold mb-1">
                <User className="w-3.5 h-3.5 text-indigo-500" />
                <span>AKTOR</span>
              </div>
              <div className="font-bold text-slate-900 dark:text-white truncate">
                {log.userName || log.userId}
              </div>
              <div className="mt-1 flex items-center gap-1">
                <span
                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${getRoleBadgeClass(
                    log.userRole
                  )}`}
                >
                  {log.userRole.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Waktu */}
            <div className="p-3 rounded-2xl bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
              <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold mb-1">
                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                <span>WAKTU KEJADIAN</span>
              </div>
              <div className="font-bold text-slate-900 dark:text-white truncate">
                {new Date(log.timestamp).toLocaleDateString('id-ID', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                {new Date(log.timestamp).toLocaleTimeString('id-ID')}
              </div>
            </div>

            {/* Target Entitas */}
            <div className="p-3 rounded-2xl bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
              <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold mb-1">
                <Layers className="w-3.5 h-3.5 text-indigo-500" />
                <span>TARGET RESOURCE</span>
              </div>
              <div className="font-bold text-slate-900 dark:text-white truncate capitalize">
                {log.entityType}
              </div>
              <div className="text-[10px] text-slate-500 font-mono truncate">
                {log.entityId || 'Global / Config'}
              </div>
            </div>

            {/* Status & IP */}
            <div className="p-3 rounded-2xl bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
              <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold mb-1">
                <Globe className="w-3.5 h-3.5 text-indigo-500" />
                <span>STATUS &amp; IP</span>
              </div>
              <div className="flex items-center gap-1.5">
                {log.status === 'FAILURE' ? (
                  <span className="inline-flex items-center gap-1 text-rose-500 font-bold">
                    <XCircle className="w-3.5 h-3.5" /> GAGAL
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-emerald-500 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> SUKSES
                  </span>
                )}
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">
                {log.ipAddress || '127.0.0.1'}
              </div>
            </div>
          </div>

          {/* Deskripsi Mutasi */}
          <div className="p-4 rounded-2xl bg-indigo-500/5 dark:bg-indigo-950/20 border border-indigo-500/20">
            <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 mb-1 flex items-center gap-1.5">
              <span>Ringkasan Aktivitas</span>
            </div>
            <p className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
              {log.description}
            </p>
            {log.userAgent && (
              <div className="mt-2 pt-2 border-t border-indigo-500/10 flex items-center gap-1.5 text-[10px] text-slate-400 truncate">
                <Laptop className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">{log.userAgent}</span>
              </div>
            )}
          </div>

          {/* Property-Level Payload Diff */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <span>Perubahan Nilai Field (Property-Level Diff)</span>
                {hasDiff && (
                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold">
                    {diffKeys.length} field berubah
                  </span>
                )}
              </h4>
              <button
                type="button"
                onClick={() => setShowRawJson(!showRawJson)}
                className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>{showRawJson ? 'Sembunyikan Raw JSON' : 'Lihat Raw JSON'}</span>
              </button>
            </div>

            {hasDiff ? (
              <div className="space-y-3">
                {diffKeys.map((key) => {
                  const item = log.diff![key];
                  return (
                    <div
                      key={key}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-xs">
                          {key}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {/* Old Value */}
                        <div className="p-2.5 rounded-xl bg-rose-500/5 dark:bg-rose-950/30 border border-rose-500/20 text-[11px]">
                          <div className="text-[10px] font-bold text-rose-500 mb-1 uppercase tracking-wider">
                            Nilai Lama (Sebelumnya)
                          </div>
                          <pre className="font-mono text-rose-700 dark:text-rose-300 line-through whitespace-pre-wrap break-all">
                            {formatValue(item.old)}
                          </pre>
                        </div>

                        {/* New Value */}
                        <div className="p-2.5 rounded-xl bg-emerald-500/5 dark:bg-emerald-950/30 border border-emerald-500/20 text-[11px]">
                          <div className="text-[10px] font-bold text-emerald-500 mb-1 uppercase tracking-wider flex items-center gap-1">
                            <ArrowRight className="w-3 h-3 text-emerald-500" />
                            Nilai Baru (Sekarang)
                          </div>
                          <pre className="font-mono font-bold text-emerald-700 dark:text-emerald-300 whitespace-pre-wrap break-all">
                            {formatValue(item.new)}
                          </pre>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-300 dark:border-slate-700 text-center text-slate-500">
                <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-slate-400" />
                <p className="font-medium">Tidak ada perbedaan nilai field secara spesifik.</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Event ini tercatat sebagai mutasi atomik atau otentikasi sesi.
                </p>
              </div>
            )}
          </div>

          {/* Raw JSON View */}
          {showRawJson && (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] font-mono space-y-3">
              <div className="text-slate-400 font-bold">Raw Audit Log Object:</div>
              <pre className="text-emerald-400 overflow-x-auto max-h-60 p-2 bg-slate-900 rounded-xl">
                {JSON.stringify(log, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={handleCopyJson}
            className="px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>Tersalin ke Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Salin Data JSON</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-100 font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            Tutup Inspeksi
          </button>
        </div>
      </div>
    </div>
  );
}
