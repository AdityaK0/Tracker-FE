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
            className="fixed inset-0 bg-black/20 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Dialog */}
          <motion.div
            className="relative w-full max-w-sm bg-white border border-[#E5E5E5] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.12)] z-10"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18 }}
          >
            {/* Close */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#F2F2F2] text-[#888888] hover:text-[#111111] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="p-6">
              {/* Icon */}
              <div className={cn(
                'w-11 h-11 rounded-2xl flex items-center justify-center mb-4',
                isDanger ? 'bg-red-50' : 'bg-amber-50',
              )}>
                {isDanger
                  ? <Trash2 className="w-5 h-5 text-red-500" />
                  : <AlertTriangle className="w-5 h-5 text-amber-500" />}
              </div>

              {/* Text */}
              <h3 className="text-base font-medium text-[#111111] mb-1.5">{title}</h3>
              {description && (
                <p className="text-sm text-[#555555] font-light leading-relaxed">{description}</p>
              )}

              {/* Actions */}
              <div className="flex gap-2 mt-6">
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
                    'flex-1 font-normal rounded-full px-6 py-2.5 text-sm transition-all duration-300',
                    isDanger
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'bg-amber-500 hover:bg-amber-600 text-white',
                    isLoading && 'opacity-50 cursor-not-allowed',
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
