import React from 'react';
import { cn } from '../../lib/utils';

export const Avatar = ({ src, name, size = 'md', className }) => {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-xl',
  };

  return (
    <div className={cn(
      'relative flex items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold overflow-hidden border border-blue-100 dark:border-blue-800',
      sizes[size],
      className
    )}>
      {src ? (
        <img src={src} alt={name} className="w-full h-full object-cover" />
      ) : (
        <span>{name?.charAt(0).toUpperCase()}</span>
      )}
    </div>
  );
};
