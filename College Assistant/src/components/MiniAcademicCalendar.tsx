/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * A compact month calendar driven by the real academic calendar data
 * (src/data/academicCalendar.ts), parsed directly from the college's
 * official PDF. Highlights holidays and marks working Saturdays with the
 * weekday timetable they follow.
 */

import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { ACADEMIC_CALENDAR, getUpcomingHolidays } from '../data/academicCalendar';
import { getISTNow } from '../utils/istTime';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function pad(n: number) {
  return n.toString().padStart(2, '0');
}

export const MiniAcademicCalendar: React.FC = () => {
  const todayIST = getISTNow();
  const [viewYear, setViewYear] = useState(todayIST.year);
  const [viewMonth, setViewMonth] = useState(todayIST.month - 1); // 0-indexed

  const todayISO = todayIST.iso;

  const dayMap = useMemo(() => {
    const map = new Map(ACADEMIC_CALENDAR.map((d) => [d.date, d]));
    return map;
  }, []);

  const grid = useMemo(() => {
    const firstOfMonth = new Date(viewYear, viewMonth, 1);
    const startWeekday = firstOfMonth.getDay(); // 0 = Sun
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: (number | null)[] = Array(startWeekday).fill(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [viewYear, viewMonth]);

  const goPrev = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };
  const goNext = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const upcoming = getUpcomingHolidays(todayISO, 4);

  return (
    <div className="glass-card rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-gradient-to-br from-cyan-500 to-indigo-600 shadow-sm">
            <CalendarDays className="w-3.5 h-3.5 text-white" />
          </span>
          <h3 className="text-xs font-bold text-slate-900">{MONTH_NAMES[viewMonth]} {viewYear}</h3>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={goPrev} className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button onClick={goNext} className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <span key={i} className="text-[9px] font-bold text-slate-400 uppercase">{d}</span>
        ))}
        {grid.map((day, idx) => {
          if (day === null) return <div key={idx} />;
          const dateISO = `${viewYear}-${pad(viewMonth + 1)}-${pad(day)}`;
          const info = dayMap.get(dateISO);
          const isToday = dateISO === todayISO;
          const isHoliday = info && !info.isWorkingDay;
          const isWorkingSat = info && info.followsTimetableOf;

          let cls = 'text-slate-700 hover:bg-slate-100';
          if (isHoliday) cls = 'bg-rose-50 text-rose-700 font-bold';
          else if (isWorkingSat) cls = 'bg-indigo-50 text-indigo-700 font-bold';

          return (
            <motion.div
              key={idx}
              whileHover={{ scale: 1.1 }}
              title={info?.note || (isHoliday ? 'Holiday' : undefined)}
              className={`relative aspect-square flex items-center justify-center rounded-lg text-[10px] cursor-default transition-colors ${cls} ${
                isToday ? 'ring-2 ring-indigo-500' : ''
              }`}
            >
              {day}
            </motion.div>
          );
        })}
      </div>

      <div className="flex items-center gap-3 text-[9px] text-slate-500 pt-1 border-t border-slate-100">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-200"></span>Holiday</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-200"></span>Working Sat</span>
      </div>

      {upcoming.length > 0 && (
        <div className="pt-2 border-t border-slate-100 space-y-1.5">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Upcoming holidays</span>
          {upcoming.map((h) => (
            <div key={h.date} className="flex items-center justify-between text-[11px]">
              <span className="text-slate-700 font-medium truncate pr-2">{h.note}</span>
              <span className="text-slate-400 font-mono shrink-0">
                {new Date(h.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
