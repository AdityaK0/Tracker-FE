import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

/**
 * GitHub-style contribution heatmap.
 *
 * Accepts two data shapes:
 *   mode="activity"  → data: [{ date: 'YYYY-MM-DD', count: number }]
 *   mode="habits"    → data: [{ date: 'YYYY-MM-DD', completed: number, total: number }]
 */
export default function HabitHeatmap({ data = [], weeks = 26, mode = 'activity' }) {
  const cells = useMemo(() => {
    const map = {};
    data.forEach(d => { map[d.date] = d; });

    const today = new Date();
    const result = [];
    for (let i = weeks * 7 - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const item = map[key];

      let level = 0;
      let tooltip = key;

      if (mode === 'activity') {
        const count = item?.count ?? 0;
        if (count === 0)      level = 0;
        else if (count === 1) level = 2;
        else if (count === 2) level = 3;
        else                  level = 4;
        tooltip = count > 0 ? `${key}: ${count} login${count !== 1 ? 's' : ''}` : key;
      } else {
        // habits mode: ratio of completed / total
        if (!item || item.total === 0) {
          level = 0;
        } else if (item.completed === 0) {
          level = 0;
        } else if (item.completed / item.total < 0.25) {
          level = 1;
        } else if (item.completed / item.total < 0.5) {
          level = 2;
        } else if (item.completed / item.total < 0.75) {
          level = 3;
        } else {
          level = 4;
        }
        tooltip = item?.total > 0
          ? `${key}: ${item.completed}/${item.total} habits`
          : key;
      }

      result.push({ date: key, level, tooltip });
    }
    return result;
  }, [data, weeks, mode]);

  const colors = [
    'bg-[#EBEBEB]',   // 0 — none
    'bg-[#C6E6CB]',   // 1 — very low
    'bg-[#8DCB97]',   // 2 — low / single login
    'bg-[#4CAF64]',   // 3 — medium
    'bg-[#1F7A35]',   // 4 — high / full
  ];

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

        {/* Grid */}
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
                  title={cell.tooltip}
                  className={cn(
                    'w-3 h-3 rounded-sm cursor-default transition-transform hover:scale-125',
                    colors[cell.level],
                  )}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-1.5 mt-1.5 pl-6">
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
