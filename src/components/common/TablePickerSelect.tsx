'use client';

import React, { useState, useRef, useEffect } from 'react';
import { QrCode, ChevronDown, Check } from 'lucide-react';

interface TablePickerSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  className?: string;
}

export default function TablePickerSelect({
  value,
  onChange,
  options,
  className = '',
}: TablePickerSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-extrabold text-slate-800 dark:text-slate-100 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 transition-all active:scale-95 shadow-2xs cursor-pointer"
        aria-expanded={isOpen}
      >
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
        <span>{value}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* React Custom Dropdown Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-44 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xl shadow-slate-900/10 z-50 p-1.5 animate-in fade-in zoom-in-95 duration-150 max-h-60 overflow-y-auto no-scrollbar">
          <div className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 px-3 py-1.5 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 mb-1 flex items-center justify-between">
            <span>Pilih Meja</span>
            <QrCode className="w-3 h-3 text-emerald-500" />
          </div>

          <div className="space-y-0.5">
            {options.map((tableNum) => {
              const isSelected = tableNum === value;
              return (
                <button
                  key={tableNum}
                  onClick={() => {
                    onChange(tableNum);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-500 text-white dark:bg-emerald-500 dark:text-slate-950 shadow-2xs'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{tableNum}</span>
                  {isSelected && <Check className="w-3.5 h-3.5" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
