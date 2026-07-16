export default function SkeletonCard() {
  return (
    <div className="card p-5 animate-pulse">
      <div className="h-4 bg-[#1a1a1a] rounded w-3/4 mb-3" />
      <div className="h-3 bg-[#1a1a1a] rounded w-full mb-2" />
      <div className="h-3 bg-[#1a1a1a] rounded w-2/3" />
    </div>
  );
}
