import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

// progressData: array of { date: 'YYYY-MM-DD', completed: number, total: number }
export default function HabitHeatmap({ progressData = [], weeks = 26 }) {
  const cells = useMemo(() => {
    const map = {};
    progressData.forEach(d => { map[d.date] = d; });

    const today = new Date();
    const result = [];
    for (let i = weeks * 7 - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const data = map[key];
      result.push({
        date: key,
        completed: data?.completed ?? 0,
        total: data?.total ?? 0,
        level: !data || data.total === 0 ? 0
          : data.completed === 0 ? 0
          : data.completed / data.total < 0.25 ? 1
          : data.completed / data.total < 0.5 ? 2
          : data.completed / data.total < 0.75 ? 3
          : 4,
      });
    }
    return result;
  }, [progressData, weeks]);

  const colors = [
    'bg-[#EBEBEB]',      // 0 - empty
    'bg-[#C6E6CB]',      // 1 - low
    'bg-[#8DCB97]',      // 2 - medium
    'bg-[#4CAF64]',      // 3 - high
    'bg-[#1F7A35]',      // 4 - full
  ];

  // Group into weeks (columns)
  const weekColumns = [];
  for (let w = 0; w < weeks; w++) {
    weekColumns.push(cells.slice(w * 7, (w + 1) * 7));
  }

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  return (
    <div className="overflow-x-auto">
      <div className="inline-flex flex-col gap-1 min-w-max">
        {/* Month labels */}
        <div className="flex gap-1 pl-6">
          {weekColumns.map((week, wi) => {
            const firstDay = new Date(week[0]?.date);
            const showMonth = firstDay.getDate() <= 7;
            return (
              <div key={wi} className="w-3 text-[9px] text-[#888888] font-light">
                {showMonth ? months[firstDay.getMonth()] : ''}
              </div>
            );
          })}
        </div>

        {/* Day rows + cells */}
        <div className="flex gap-1">
          {/* Day labels */}
          <div className="flex flex-col gap-1 mr-1">
            {['','M','','W','','F',''].map((d, i) => (
              <div key={i} className="w-4 h-3 text-[9px] text-[#888888] font-light flex items-center">{d}</div>
            ))}
          </div>

          {weekColumns.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {week.map((cell, di) => (
                <motion.div
                  key={cell.date}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: (wi * 7 + di) * 0.001 }}
                  title={cell.total > 0
                    ? `${cell.date}: ${cell.completed}/${cell.total} habits`
                    : cell.date}
                  className={cn('w-3 h-3 rounded-sm cursor-default transition-transform hover:scale-125', colors[cell.level])}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-1.5 mt-1 pl-6">
          <span className="text-[10px] text-[#888888] font-light">Less</span>
          {colors.map((c, i) => (
            <div key={i} className={cn('w-3 h-3 rounded-sm', c)} />
          ))}
          <span className="text-[10px] text-[#888888] font-light">More</span>
        </div>
      </div>
    </div>
  );
}
