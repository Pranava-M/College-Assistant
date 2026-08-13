import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DayOfWeek, MasterTimetable, TimetableCell, TimetableChangeRecord } from '../types';
import { STANDARD_SLOTS } from '../data/defaultData';
import { getAcademicDay } from '../data/academicCalendar';
import { todayISTISO } from '../utils/istTime';
import { Clock, History, RotateCcw, FileText, CheckCircle2, AlertTriangle, Sparkles, Info, CalendarOff, CalendarCheck } from 'lucide-react';

interface TimetableGridProps {
  masterTimetable: MasterTimetable;
  originalTimetable: MasterTimetable;
  changeHistory: TimetableChangeRecord[];
  onRevertChange: (historyId: string) => void;
  onOpenOfficialPdf: () => void;
}

export const TimetableGrid: React.FC<TimetableGridProps> = ({
  masterTimetable,
  originalTimetable,
  changeHistory,
  onRevertChange,
  onOpenOfficialPdf,
}) => {
  const [viewMode, setViewMode] = useState<'current' | 'original' | 'slots' | 'history'>('current');
  const days: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  const activeTimetable = viewMode === 'original' ? originalTimetable : masterTimetable;
  const todayAcademicInfo = getAcademicDay(todayISTISO());

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Top Controller Bar */}
      <div className="glass-card rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            B.Tech CSE V Sem (Section H) Official Master Timetable
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Exact replica of college official schedule • Auto-overlaid with WhatsApp AI updates
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg bg-slate-100 p-1 border border-slate-200 text-xs">
            <button
              onClick={() => setViewMode('current')}
              className={`px-3 py-1.5 rounded-md font-bold transition-all ${
                viewMode === 'current'
                  ? 'btn-gradient text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Live Current
            </button>
            <button
              onClick={() => setViewMode('original')}
              className={`px-3 py-1.5 rounded-md font-bold transition-all ${
                viewMode === 'original'
                  ? 'btn-gradient text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Original PDF Grid
            </button>
            <button
              onClick={() => setViewMode('slots')}
              className={`px-3 py-1.5 rounded-md font-bold transition-all ${
                viewMode === 'slots'
                  ? 'btn-gradient text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Slot Timings
            </button>
            <button
              onClick={() => setViewMode('history')}
              className={`px-3 py-1.5 rounded-md font-bold transition-all flex items-center gap-1 ${
                viewMode === 'history'
                  ? 'btn-gradient text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              History ({changeHistory.length})
            </button>
          </div>

          <button
            onClick={onOpenOfficialPdf}
            className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs font-bold border border-indigo-200 transition-colors flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5" />
            Course Catalog
          </button>
        </div>
      </div>

      {/* Today's status pulled straight from the official academic calendar PDF */}
      {todayAcademicInfo && (
        <div
          className={`rounded-xl p-3.5 flex items-center gap-2.5 text-xs font-semibold border ${
            !todayAcademicInfo.isWorkingDay
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : todayAcademicInfo.followsTimetableOf
              ? 'bg-indigo-50 border-indigo-200 text-indigo-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          {!todayAcademicInfo.isWorkingDay ? (
            <>
              <CalendarOff className="w-4 h-4 shrink-0" />
              <span>Today is a holiday{todayAcademicInfo.note ? ` — ${todayAcademicInfo.note}` : ''}. No classes scheduled.</span>
            </>
          ) : todayAcademicInfo.followsTimetableOf ? (
            <>
              <CalendarCheck className="w-4 h-4 shrink-0" />
              <span>
                Today is a working Saturday, following <strong>{todayAcademicInfo.followsTimetableOf}'s</strong> timetable
                {todayAcademicInfo.note ? ` (${todayAcademicInfo.note})` : ''}.
              </span>
            </>
          ) : (
            <>
              <CalendarCheck className="w-4 h-4 shrink-0" />
              <span>Today is a regular working day{todayAcademicInfo.note ? ` — ${todayAcademicInfo.note}` : ''}.</span>
            </>
          )}
        </div>
      )}

      {/* Official Replica Grid */}
      {(viewMode === 'current' || viewMode === 'original') && (
        <div className="bg-white border-2 border-slate-300 rounded-xl overflow-hidden shadow-md">
          {/* Green Top Header */}
          <div className="bg-[#4CAF50] text-white py-2.5 text-center font-black tracking-widest text-base uppercase border-b-2 border-slate-300">
            TIME TABLE
          </div>

          {/* Yellow Subheader Bar */}
          <div className="bg-[#FFF59D] text-slate-900 p-2.5 text-xs font-bold border-b-2 border-slate-300 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 text-center">
            <div className="border-r border-slate-300/80 pr-1">Dept: <span className="font-extrabold text-slate-950">CSE</span></div>
            <div className="border-r border-slate-300/80 pr-1">Semester: <span className="font-extrabold text-slate-950">V</span></div>
            <div className="border-r border-slate-300/80 pr-1">Class: <span className="font-extrabold text-slate-950">B.Tech CSE</span></div>
            <div className="border-r border-slate-300/80 pr-1">Section: <span className="font-extrabold text-slate-950">H</span></div>
            <div className="border-r border-slate-300/80 pr-1">Venue: <span className="font-extrabold text-slate-950">AB III- D406</span></div>
            <div className="col-span-2 text-[11px] font-normal leading-tight">
              Advisors: <strong className="text-slate-950">Teacher 11 / Teacher 10</strong>
              <div className="text-[10px] text-slate-700 font-mono">advisor1@example.edu • advisor2@example.edu</div>
            </div>
          </div>

          {/* Color Legend Bar */}
          <div className="bg-slate-50 p-2 px-4 border-b border-slate-200 flex flex-wrap items-center justify-between text-[11px]">
            <span className="font-bold text-slate-700">
              {viewMode === 'current' ? '⚡ Live View (WhatsApp AI Modifications Applied)' : '📌 Official Static Schedule'}
            </span>
            <div className="flex flex-wrap items-center gap-3 font-semibold text-slate-700">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-[#CFD8DC] border border-slate-400"></span> PE1
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-[#F8BBD0] border border-pink-400"></span> PE2
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-[#80DEEA] border border-cyan-500"></span> Labs
              </span>
              <span className="flex items-center gap-1">
                <span className="flex items-center justify-center w-3 h-3 rounded bg-[#FFE0B2] border border-amber-400"></span> CIR
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-rose-100 border border-rose-400"></span> Cancelled / Free
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-indigo-100 border border-indigo-400"></span> Shifted
              </span>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-center text-xs border-collapse min-w-[1050px]">
              <thead>
                <tr className="bg-[#FFF59D] text-slate-900 font-bold border-b-2 border-slate-300">
                  <th className="p-2 border-r-2 border-slate-300 w-24">Time / Day</th>
                  <th className="p-1.5 border-r border-slate-300 w-24">
                    <div className="text-[11px] font-extrabold">Slot 1</div>
                    <div className="text-[9px] font-mono text-slate-700">{STANDARD_SLOTS[1]?.timeRange}</div>
                  </th>
                  <th className="p-1.5 border-r border-slate-300 w-24">
                    <div className="text-[11px] font-extrabold">Slot 2</div>
                    <div className="text-[9px] font-mono text-slate-700">{STANDARD_SLOTS[2]?.timeRange}</div>
                  </th>
                  <th className="p-1.5 border-r border-slate-300 w-24">
                    <div className="text-[11px] font-extrabold">Slot 3</div>
                    <div className="text-[9px] font-mono text-slate-700">{STANDARD_SLOTS[3]?.timeRange}</div>
                  </th>
                  <th className="p-1 border-r border-slate-300 bg-[#00B0FF] text-white w-8 text-[10px] font-extrabold">
                    Interval
                  </th>
                  <th className="p-1.5 border-r border-slate-300 w-24">
                    <div className="text-[11px] font-extrabold">Slot 4</div>
                    <div className="text-[9px] font-mono text-slate-700">{STANDARD_SLOTS[4]?.timeRange}</div>
                  </th>
                  <th className="p-1.5 border-r border-slate-300 w-24">
                    <div className="text-[11px] font-extrabold">Slot 5</div>
                    <div className="text-[9px] font-mono text-slate-700">{STANDARD_SLOTS[5]?.timeRange}</div>
                  </th>
                  <th className="p-1.5 border-r border-slate-300 w-24">
                    <div className="text-[11px] font-extrabold">Slot 6</div>
                    <div className="text-[9px] font-mono text-slate-700">{STANDARD_SLOTS[6]?.timeRange}</div>
                  </th>
                  <th className="p-1 border-r border-slate-300 bg-[#00B0FF] text-white w-8 text-[10px] font-extrabold">
                    Lunch
                  </th>
                  <th className="p-1.5 border-r border-slate-300 w-28">
                    <div className="text-[11px] font-extrabold">Slot 8</div>
                    <div className="text-[9px] font-mono text-slate-700">{STANDARD_SLOTS[8]?.timeRange}</div>
                  </th>
                  <th className="p-1.5 border-r border-slate-300 w-28">
                    <div className="text-[11px] font-extrabold">Slot 9</div>
                    <div className="text-[9px] font-mono text-slate-700">{STANDARD_SLOTS[9]?.timeRange}</div>
                  </th>
                  <th className="p-1.5 border-r border-slate-300 w-28">
                    <div className="text-[11px] font-extrabold">Slot 10</div>
                    <div className="text-[9px] font-mono text-slate-700">{STANDARD_SLOTS[10]?.timeRange}</div>
                  </th>
                  <th className="p-1.5 w-24">
                    <div className="text-[11px] font-extrabold">Slot 12</div>
                    <div className="text-[9px] font-mono text-slate-700">{STANDARD_SLOTS[12]?.timeRange}</div>
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y border-slate-300">
                {days.map((day, dayIdx) => {
                  const daySlots = activeTimetable[day] || {};

                  const renderCell = (slotNum: number) => {
                    const cell = daySlots[slotNum];

                    if (!cell) {
                      return <td key={slotNum} className="p-1 border-r border-slate-200"></td>;
                    }

                    if (cell.isCancelled) {
                      return (
                        <td key={slotNum} className="p-1 border-r border-slate-200 bg-rose-50">
                          <div className="text-[10px] font-bold text-rose-500 uppercase tracking-wide">Free</div>
                          <div className="text-[8px] text-rose-400">Class Cancelled</div>
                        </td>
                      );
                    }

                    const typeColor =
                      cell.type === 'PE' && cell.subjectName?.includes('PE1') ? 'bg-[#CFD8DC]' :
                      cell.type === 'PE' ? 'bg-[#F8BBD0]' :
                      cell.type === 'Lab' ? 'bg-[#80DEEA]' :
                      cell.type === 'CIR' ? 'bg-[#FFE0B2]' :
                      cell.isShifted ? 'bg-indigo-50' : 'bg-white';

                    return (
                      <td key={slotNum} className={`p-1 border-r border-slate-200 ${typeColor} relative`}>
                        {cell.isShifted && (
                          <span className="absolute top-0.5 right-0.5 text-[7px] font-bold text-indigo-600 bg-indigo-100 px-1 rounded">
                            SHIFTED
                          </span>
                        )}
                        <div className="font-bold text-[11px] text-slate-900 leading-tight">{cell.subjectName}</div>
                        <div className="text-[9px] text-slate-600">{cell.faculty}</div>
                        <div className="text-[8px] text-slate-500">{cell.venue}</div>
                        {cell.note && (
                          <div className="text-[8px] text-amber-700 font-semibold mt-0.5">{cell.note}</div>
                        )}
                      </td>
                    );
                  };

                  return (
                    <tr key={day} className="h-16">
                      <td className="p-2 font-bold bg-[#FFF59D] text-slate-900 border-r-2 border-slate-300">{day}</td>
                      {renderCell(1)}
                      {renderCell(2)}
                      {renderCell(3)}

                      {dayIdx === 0 && (
                        <td
                          rowSpan={days.length}
                          className="bg-[#00B0FF] text-white font-black text-[11px] tracking-widest [writing-mode:vertical-lr] py-4 select-none"
                        >
                          10.30 am - 10.45 am Interval Break
                        </td>
                      )}

                      {renderCell(4)}
                      {renderCell(5)}
                      {renderCell(6)}

                      {dayIdx === 0 && (
                        <td
                          rowSpan={days.length}
                          className="bg-[#00B0FF] text-white font-black text-[11px] tracking-widest [writing-mode:vertical-lr] py-4 select-none"
                        >
                          01.15 pm to 2.05 pm Lunch Break
                        </td>
                      )}

                      {renderCell(8)}
                      {renderCell(9)}
                      {renderCell(10)}
                      {renderCell(12)}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}


      {/* Slot Timings Reference */}
      {viewMode === 'slots' && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card rounded-xl p-5 space-y-4 shadow-sm"
        >
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Official Slot Mapping Dictionary</h3>
              <p className="text-xs text-slate-500">Converts WhatsApp group shorthand into clock times</p>
            </div>
            <span className="px-2.5 py-1 rounded bg-amber-100 text-amber-900 font-mono text-xs font-bold border border-amber-300">
              11 College Slots Active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.values(STANDARD_SLOTS).map((slot) => (
              <div key={slot.slotNumber} className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-amber-700 block">Slot {slot.slotNumber}</span>
                  <span className="text-sm font-semibold text-slate-800">{slot.timeRange}</span>
                </div>
                <span className="text-xs font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                  {slot.startTime} - {slot.endTime}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Revision History */}
      {viewMode === 'history' && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card rounded-xl p-5 space-y-4 shadow-sm"
        >
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-600" />
                Timetable Revision Audit Trail
              </h3>
              <p className="text-xs text-slate-500">WhatsApp announcement modifications recorded with 1-click restore.</p>
            </div>
          </div>

          {changeHistory.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              No modifications recorded yet. Use the WhatsApp simulator to post class shifts or cancellations.
            </div>
          ) : (
            <div className="space-y-3">
              {changeHistory.map((item) => (
                <div key={item.id} className="p-4 rounded-xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                        {item.changeType}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900">{item.subject}</h4>
                      <span className="text-xs text-slate-500">({item.timestamp})</span>
                    </div>
                    <p className="text-xs font-mono text-slate-700 bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
                      💬 Message: "{item.originalMessage}"
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.status === 'Applied' ? (
                      <button
                        onClick={() => onRevertChange(item.id)}
                        className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 transition-colors flex items-center gap-1 shadow-xs"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Revert Change
                      </button>
                    ) : item.status === 'Skipped' ? (
                      <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 text-xs font-medium">
                        Not applied — date unclear
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500 text-xs font-medium">
                        Reverted
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};
