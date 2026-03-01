import React, { useEffect } from 'react';
import { CheckCircle, XCircle, X, Info } from 'lucide-react';
interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}
export function Toast({
  message,
  type,
  onClose
}: ToastProps) {
  useEffect(() => {
    const duration = type === 'info' ? 4000 : 3000;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, type]);
  return <div className="fixed top-24 right-6 z-[100] animate-in slide-in-from-top-5 fade-in duration-300 max-w-sm w-full">
      <div className={`
        flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl border backdrop-blur-sm
        ${type === 'success' ? 'bg-green-50 dark:bg-green-900/40 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300' : ''}
        ${type === 'error' ? 'bg-red-50 dark:bg-red-900/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300' : ''}
        ${type === 'info' ? 'bg-slate-50 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300' : ''}
      `}>

        {type === 'success' && <CheckCircle className="w-5 h-5 flex-shrink-0" />}
        {type === 'error' && <XCircle className="w-5 h-5 flex-shrink-0" />}
        {type === 'info' && <Info className="w-5 h-5 flex-shrink-0 text-[#C8A45D]" />}
        <p className="font-medium text-sm">{message}</p>
        <button onClick={onClose} className="ml-2 p-1 hover:bg-white/50 dark:hover:bg-white/10 rounded-full transition-colors">

          <X className="w-4 h-4" />
        </button>
      </div>
    </div>;
}