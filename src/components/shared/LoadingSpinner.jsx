import { cn } from '../../utils/cn';

export default function LoadingSpinner({ fullScreen = false, size = 'md' }) {
  const sizeClasses = { sm: 'h-4 w-4', md: 'h-7 w-7', lg: 'h-10 w-10' };
  const spinner = (
    <div className={cn('animate-spin rounded-full border-2 border-[#E5E5E5] border-t-[#111111]', sizeClasses[size])} />
  );
  if (fullScreen) {
    return <div className="fixed inset-0 bg-[#F7F7F7] flex items-center justify-center z-50">{spinner}</div>;
  }
  return <div className="flex justify-center p-10">{spinner}</div>;
}
