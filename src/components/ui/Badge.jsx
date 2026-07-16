import { cn } from '../../utils/cn';

const variants = {
  default:   'bg-[#F2F2F2] text-[#555555] border-[#E5E5E5]',
  success:   'bg-[#F2F2F2] text-[#555555] border-[#E5E5E5]',
  warning:   'bg-[#F2F2F2] text-[#555555] border-[#E5E5E5]',
  danger:    'bg-red-50 text-red-600 border-red-100',
  info:      'bg-[#F2F2F2] text-[#555555] border-[#E5E5E5]',
  active:    'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]',
  upcoming:  'bg-[#F0F9FF] text-[#0369A1] border-[#BAE6FD]',
  completed: 'bg-[#F2F2F2] text-[#888888] border-[#E5E5E5]',
  paused:    'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]',
};

export default function Badge({ children, variant = 'default' }) {
  return (
    <span className={cn('inline-flex items-center px-1.5 py-0.5 rounded-sm text-xs font-medium border', variants[variant])}>
      {children}
    </span>
  );
}
