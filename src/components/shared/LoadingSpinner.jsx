import { cn } from '../../utils/cn';

export default function LoadingSpinner({
  fullScreen = false,
  size = 'md',
}) {
  const sizeClasses = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' };

  const spinner = (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-[#222222] border-t-indigo-500',
        sizeClasses[size],
      )}
    />
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-[#0a0a0a] flex items-center justify-center z-50">
        {spinner}
      </div>
    );
  }

  return <div className="flex justify-center p-8">{spinner}</div>;
}
