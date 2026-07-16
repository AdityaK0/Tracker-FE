import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '../../utils/cn';

// ── Internal store (module-level, no React required to call toast.*) ──────────
let _dispatch = null;
let _idCounter = 0;

function dispatch(action) {
  if (_dispatch) _dispatch(action);
}

// ── Public API ─────────────────────────────────────────────────────────────────
function addToast(type, message, options = {}) {
  const id = ++_idCounter;
  dispatch({ type: 'ADD', toast: { id, type, message, duration: 4000, ...options } });
  return id;
}

export const toast = {
  success: (message, options) => addToast('success', message, options),
  error:   (message, options) => addToast('error',   message, options),
  warning: (message, options) => addToast('warning', message, options),
  info:    (message, options) => addToast('info',    message, options),
  dismiss: (id) => dispatch({ type: 'REMOVE', id }),
};

// ── Config per type ───────────────────────────────────────────────────────────
const CONFIG = {
  success: {
    icon: CheckCircle2,
    iconClass: 'text-emerald-500',
    barClass: 'bg-emerald-500',
    borderClass: 'border-l-emerald-500',
  },
  error: {
    icon: XCircle,
    iconClass: 'text-red-500',
    barClass: 'bg-red-500',
    borderClass: 'border-l-red-500',
  },
  warning: {
    icon: AlertTriangle,
    iconClass: 'text-amber-500',
    barClass: 'bg-amber-500',
    borderClass: 'border-l-amber-500',
  },
  info: {
    icon: Info,
    iconClass: 'text-blue-500',
    barClass: 'bg-blue-500',
    borderClass: 'border-l-blue-500',
  },
};

// ── Single toast item ─────────────────────────────────────────────────────────
function ToastItem({ toast: t, onDismiss }) {
  const { icon: Icon, iconClass, barClass, borderClass } = CONFIG[t.type] ?? CONFIG.info;
  const [progress, setProgress] = useState(100);
  const startRef = useRef(Date.now());
  const rafRef = useRef(null);

  // Animate progress bar down
  useEffect(() => {
    const duration = t.duration;
    function tick() {
      const elapsed = Date.now() - startRef.current;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining > 0) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        onDismiss(t.id);
      }
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [t.id, t.duration, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 40, scale: 0.96 }}
      animate={{ opacity: 1, x: 0,  scale: 1 }}
      exit={{    opacity: 0, x: 40, scale: 0.96 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'relative w-80 bg-white border border-[#E5E5E5] border-l-[3px] rounded-xl overflow-hidden',
        'shadow-[0_4px_16px_rgba(0,0,0,0.08),0_1px_4px_rgba(0,0,0,0.04)]',
        borderClass,
      )}
    >
      <div className="flex items-start gap-3 px-4 py-3.5 pr-9">
        <Icon className={cn('w-4 h-4 flex-shrink-0 mt-0.5', iconClass)} />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-[#111111] font-normal leading-snug">{t.message}</p>
          {t.action && (
            <button
              onClick={() => { t.action.onClick(); onDismiss(t.id); }}
              className="text-xs font-medium text-[#111111] underline underline-offset-2 mt-1 hover:text-[#555555] transition-colors"
            >
              {t.action.label}
            </button>
          )}
        </div>
      </div>

      {/* Close button */}
      <button
        onClick={() => onDismiss(t.id)}
        className="absolute top-3 right-3 w-5 h-5 flex items-center justify-center rounded-md text-[#888888] hover:text-[#111111] hover:bg-[#F2F2F2] transition-colors"
      >
        <X className="w-3 h-3" />
      </button>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#F2F2F2]">
        <div
          className={cn('h-full transition-none', barClass)}
          style={{ width: `${progress}%` }}
        />
      </div>
    </motion.div>
  );
}

// ── Provider + Toaster ────────────────────────────────────────────────────────
function reducer(state, action) {
  switch (action.type) {
    case 'ADD':    return [...state, action.toast];
    case 'REMOVE': return state.filter(t => t.id !== action.id);
    default:       return state;
  }
}

export function Toaster() {
  const [toasts, setToasts] = useState([]);

  // Register the dispatch fn so module-level `toast.*` can reach React state
  useEffect(() => {
    _dispatch = (action) => setToasts(s => reducer(s, action));
    return () => { _dispatch = null; };
  }, []);

  const dismiss = useCallback((id) => {
    setToasts(s => s.filter(t => t.id !== id));
  }, []);

  return createPortal(
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 items-end pointer-events-none">
      <AnimatePresence mode="popLayout" initial={false}>
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onDismiss={dismiss} />
          </div>
        ))}
      </AnimatePresence>
    </div>,
    document.body,
  );
}
