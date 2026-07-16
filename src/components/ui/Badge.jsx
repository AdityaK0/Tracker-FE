import React from 'react';
import { cn } from '../../utils/cn';

const variants = {
  default: 'bg-[#1a1a1a] text-[#a1a1aa] border-[#222222]',
  success: 'bg-green-500/10 text-green-400 border-green-500/20',
  warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  danger: 'bg-red-500/10 text-red-400 border-red-500/20',
  info: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  active: 'bg-green-500/10 text-green-400 border-green-500/20',
  upcoming: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  completed: 'bg-[#1a1a1a] text-[#a1a1aa] border-[#222222]',
  paused: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

export default function Badge({ children, variant = 'default' }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border',
        variants[variant],
      )}
    >
      {children}
    </span>
  );
}
