import { cn } from '../../utils/cn';

const variants = {
  default:   'bg-[#F2F2F2] text-[#555555] border-[#E5E5E5]',
  success:   'bg-[#F2F2F2] text-[#111111] border-[#E5E5E5]',
  warning:   'bg-[#F2F2F2] text-[#555555] border-[#E5E5E5]',
  danger:    'bg-red-50 text-red-600 border-red-100',
  info:      'bg-[#F2F2F2] text-[#111111] border-[#E5E5E5]',
  active:    'bg-[#111111] text-white border-[#111111]',
  upcoming:  'bg-[#F2F2F2] text-[#555555] border-[#E5E5E5]',
  completed: 'bg-[#F2F2F2] text-[#888888] border-[#E5E5E5]',
  paused:    'bg-[#F2F2F2] text-[#555555] border-[#E5E5E5]',
};

export default function Badge({ children, variant = 'default' }) {
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-normal border', variants[variant])}>
      {children}
    </span>
  );
}
