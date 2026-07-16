export default function SkeletonCard() {
  return (
    <div className="card p-5 animate-pulse">
      <div className="h-3.5 bg-[#F2F2F2] rounded-full w-3/4 mb-3" />
      <div className="h-3 bg-[#F2F2F2] rounded-full w-full mb-2" />
      <div className="h-3 bg-[#F2F2F2] rounded-full w-2/3" />
    </div>
  );
}
