import React, { useEffect } from 'react';
import { Card } from './Card';
import { cn } from '../../lib/utils';
import { X } from 'lucide-react';

export const Modal = ({ isOpen, onClose, title, subtitle, children, className }) => {
  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      <Card className={cn("relative w-full max-w-md p-6 space-y-6 animate-in fade-in zoom-in-95 duration-200 z-10 shadow-2xl dark:bg-gray-900 dark:border-gray-800", className)}>
        {onClose && (
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        {(title || subtitle) && (
          <div>
            {title && <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 pr-8">{title}</h2>}
            {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>}
          </div>
        )}
        {children}
      </Card>
    </div>
  );
};

