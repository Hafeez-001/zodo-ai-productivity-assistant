import React from 'react';
import { Modal, Button } from './ui';
import { Wand2, ArrowRight, Scissors, Pin, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

const ACTION_CONFIG = {
  postpone: { label: 'Postpone', color: 'text-amber-700 bg-amber-50 border-amber-100 dark:text-amber-400 dark:bg-amber-950/30 dark:border-amber-900', icon: ArrowRight },
  split: { label: 'Split Task', color: 'text-purple-700 bg-purple-50 border-purple-100 dark:text-purple-400 dark:bg-purple-950/30 dark:border-purple-900', icon: Scissors },
  keep: { label: 'Keep', color: 'text-green-700 bg-green-50 border-green-100 dark:text-green-400 dark:bg-green-950/30 dark:border-green-900', icon: Pin },
};

export default function PlanCleanupModal({ isOpen, onClose, suggestions = [], loading, onApply }) {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="AI Plan Cleanup" subtitle="Suggested actions to reduce your cognitive load">
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/30 rounded-full flex items-center justify-center">
            <Wand2 className="w-6 h-6 text-blue-600 animate-pulse" />
          </div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Zodo AI is analyzing your workload...</p>
        </div>
      ) : suggestions.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400 font-medium">No suggestions available right now.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {suggestions.map((s, i) => {
            const config = ACTION_CONFIG[s.action] || ACTION_CONFIG.postpone;
            const Icon = config.icon;
            return (
              <div key={i} className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn("text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border flex items-center gap-1", config.color)}>
                      <Icon className="w-3 h-3" />
                      {config.label}
                    </span>
                  </div>
                  <p className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate">{s.taskTitle}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{s.reason}</p>
                </div>
                {s.action !== 'keep' && onApply && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0 text-xs font-bold dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                    onClick={() => onApply(s)}
                  >
                    Apply
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-800 mt-4">
        <Button variant="secondary" onClick={onClose} className="dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700">
          Close
        </Button>
      </div>
    </Modal>
  );
}
