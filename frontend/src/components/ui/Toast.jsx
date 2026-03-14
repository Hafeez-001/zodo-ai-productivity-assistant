import React, { useEffect } from 'react';
import { cn } from '../../lib/utils';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';

const icons = {
  success: <CheckCircle2 className="w-5 h-5 text-green-500" />,
  error: <AlertCircle className="w-5 h-5 text-red-500" />,
  info: <Info className="w-5 h-5 text-blue-500" />,
};

const styles = {
  success: "bg-green-50 border-green-100 text-green-800 shadow-green-500/10",
  error: "bg-red-50 border-red-100 text-red-800 shadow-red-500/10",
  info: "bg-blue-50 border-blue-100 text-blue-800 shadow-blue-500/10",
};

export const Toast = ({ message, type = 'info', onClose, duration = 3000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div className={cn(
      "flex items-center gap-3 p-4 rounded-2xl border shadow-xl animate-in fade-in slide-in-from-top-4 duration-300 max-w-md w-full pointer-events-auto",
      styles[type]
    )}>
      <div className="shrink-0">
        {icons[type]}
      </div>
      <p className="flex-1 text-sm font-bold">{message}</p>
      <button 
        onClick={onClose}
        className="p-1 hover:bg-black/5 rounded-full transition-colors shrink-0"
      >
        <X className="w-4 h-4 opacity-50" />
      </button>
    </div>
  );
};
