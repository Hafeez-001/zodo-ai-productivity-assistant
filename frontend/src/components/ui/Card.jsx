import React from 'react';
import { cn } from '../../lib/utils';

export const Card = ({ className, children, ...props }) => (
  <div className={cn('bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm transition-colors duration-300', className)} {...props}>
    {children}
  </div>
);
