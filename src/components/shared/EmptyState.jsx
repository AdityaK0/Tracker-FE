export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-14 h-14 rounded-2xl bg-[#F2F2F2] border border-[#E5E5E5] flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-[#888888]" />
      </div>
      <h3 className="text-[#111111] font-medium text-base mb-2">{title}</h3>
      <p className="text-[#888888] text-sm max-w-sm mb-6 font-light leading-relaxed">{description}</p>
      {action}
    </div>
  );
}
