import React from 'react';

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#111111] border border-[#1a1a1a] flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-[#52525b]" />
      </div>
      <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
      <p className="text-[#a1a1aa] text-sm max-w-sm mb-6">{description}</p>
      {action}
    </div>
  );
}
