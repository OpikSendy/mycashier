'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[MyCashier ErrorBoundary Caught]:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] w-full p-6 flex flex-col items-center justify-center text-center select-none">
          <div className="max-w-md p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center border border-rose-500/20">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {this.props.fallbackTitle || 'Terjadi Kesalahan Aplikasi'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Aplikasi mengalami kendala tak terduga. Klik tombol di bawah untuk memuat ulang halaman secara aman.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-rose-500 text-left overflow-x-auto max-h-24">
                {this.state.error.message}
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="w-full py-3 px-4 rounded-2xl bg-slate-900 text-white dark:bg-emerald-500 dark:text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-md hover:bg-slate-800 cursor-pointer active:scale-95 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Muat Ulang Komponen</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
