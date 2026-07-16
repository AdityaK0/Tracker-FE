import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

export default function ProgressBar({ value, className, color = 'bg-[#111111]' }) {
  return (
    <div className={cn('w-full bg-[#EBEBEB] rounded-sm h-1 overflow-hidden', className)}>
      <motion.div
        className={cn('h-full rounded-sm', color)}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />
    </div>
  );
}
