import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

export default function ProgressBar({ value, className, color = 'bg-[#111111]' }) {
  return (
    <div className={cn('w-full bg-[#F2F2F2] rounded-full h-1 overflow-hidden', className)}>
      <motion.div
        className={cn('h-full rounded-full', color)}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
    </div>
  );
}
