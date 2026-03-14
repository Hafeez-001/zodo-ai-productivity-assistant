import React, { useState } from 'react';
import { Card, Button } from './ui';
import { cn } from '../lib/utils';
import { AlertCircle, CheckCircle2, Clock, Wand2 } from 'lucide-react';

export default function WorkloadMeter({ totalMinutes, capacityPercentage, overloadFlag, onPlanCleanup }) {
  const isHigh = capacityPercentage > 80;
  const isModerate = capacityPercentage > 50;

  return (
    <Card className="p-6 space-y-5 border-gray-100 dark:border-gray-800 dark:bg-gray-900 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">Cognitive Load</h3>
        {overloadFlag ? (
          <div className="flex items-center gap-1.5 text-red-600 bg-red-50 dark:bg-red-950/30 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border border-red-100 dark:border-red-900">
            <AlertCircle className="w-3 h-3" /> Overloaded
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border border-green-100 dark:border-green-900">
            <CheckCircle2 className="w-3 h-3" /> Healthy
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="h-3 w-full rounded-full bg-gray-50 dark:bg-gray-800 overflow-hidden border border-gray-100 dark:border-gray-700">
          <div 
            className={cn(
              "h-full transition-all duration-1000 ease-out rounded-full shadow-inner",
              overloadFlag ? "bg-red-500" : isHigh ? "bg-amber-500" : "bg-blue-600"
            )}
            style={{ width: `${Math.min(100, capacityPercentage)}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
          <span className="text-gray-400 dark:text-gray-500">{totalMinutes}m allocated</span>
          <span className={cn(
            overloadFlag ? "text-red-600" : isHigh ? "text-amber-600" : "text-blue-600"
          )}>{capacityPercentage}%</span>
        </div>
      </div>

      <div className="pt-3 flex items-start gap-3 text-xs text-gray-600 dark:text-gray-400 leading-relaxed font-medium bg-gray-50/50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100/50 dark:border-gray-700/50">
        <Clock className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
        {overloadFlag 
          ? "You've exceeded your optimal cognitive capacity. Consider postponing non-essential tasks."
          : isHigh 
            ? "You're approaching your limit. Focus on high-priority items and avoid new commitments."
            : "Your schedule looks balanced. You have space for deep work or new tasks."
        }
      </div>

      {/* Interactive AI Cleanup Button — only shown when overloaded */}
      {overloadFlag && onPlanCleanup && (
        <button
          onClick={onPlanCleanup}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition-all active:scale-95 shadow-lg shadow-red-500/20 cursor-pointer"
        >
          <Wand2 className="w-4 h-4" />
          Run AI Plan Cleanup
        </button>
      )}
    </Card>
  );
}
