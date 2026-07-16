import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { useEffect } from 'react';
import { cn } from '../../utils/cn';

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger', // 'danger' | 'warning'
  isLoading = false,
}) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const isDanger = variant === 'danger';

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/25 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Dialog */}
          <motion.div
            className="relative w-full max-w-sm bg-white border border-[#E5E5E5] rounded-md z-10"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18 }}
          >
            {/* Close */}
            <button
              onClick={onClose}
              className="absolute top-3.5 right-3.5 w-6 h-6 flex items-center justify-center rounded-md hover:bg-[#F2F2F2] text-[#888888] hover:text-[#111111] transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            <div className="p-5">
              {/* Icon */}
              <div className={cn(
                'w-9 h-9 rounded-md flex items-center justify-center mb-3',
                isDanger ? 'bg-red-50' : 'bg-amber-50',
              )}>
                {isDanger
                  ? <Trash2 className="w-4 h-4 text-red-500" />
                  : <AlertTriangle className="w-4 h-4 text-amber-500" />}
              </div>

              {/* Text */}
              <h3 className="text-sm font-semibold text-[#111111] mb-1">{title}</h3>
              {description && (
                <p className="text-sm text-[#555555] leading-relaxed">{description}</p>
              )}

              {/* Actions */}
              <div className="flex gap-2 mt-5">
                <button
                  onClick={onClose}
                  disabled={isLoading}
                  className="btn-secondary flex-1"
                >
                  {cancelLabel}
                </button>
                <button
                  onClick={() => { onConfirm(); }}
                  disabled={isLoading}
                  className={cn(
                    'flex-1 inline-flex items-center justify-center font-medium rounded-md px-3 py-1.5 text-sm transition-colors duration-150',
                    isDanger
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-amber-500 hover:bg-amber-600 text-white',
                    isLoading && 'opacity-40 cursor-not-allowed',
                  )}
                >
                  {isLoading ? 'Deleting…' : confirmLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
