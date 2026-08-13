/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MessageSquare, Users, CheckCircle2, AlertTriangle, BookOpen,
  Sparkles, QrCode, FlaskConical, ChevronRight,
} from 'lucide-react';
import { MonitoredWhatsAppGroup, CollegeAnnouncement } from '../types';
import { MiniAcademicCalendar } from './MiniAcademicCalendar';

interface DashboardViewProps {
  groups: MonitoredWhatsAppGroup[];
  announcements: CollegeAnnouncement[];
  onOpenAccountModal: () => void;
  onOpenSimulator: () => void;
}

const categoryColor: Record<string, string> = {
  Exam: 'bg-rose-100 text-rose-800 border-rose-200',
  Quiz: 'bg-orange-100 text-orange-800 border-orange-200',
  'Lab Evaluation': 'bg-violet-100 text-violet-800 border-violet-200',
  Assignment: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  'Timetable Change': 'bg-indigo-100 text-indigo-800 border-indigo-200',
  Holiday: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  General: 'bg-slate-100 text-slate-700 border-slate-200',
};

const isImportant = (a: CollegeAnnouncement) =>
  ['Exam', 'Quiz', 'Lab Evaluation', 'Timetable Change', 'Assignment'].includes(a.category);

export const DashboardView: React.FC<DashboardViewProps> = ({
  groups,
  announcements,
  onOpenAccountModal,
  onOpenSimulator,
}) => {
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  const filteredAnnouncements = useMemo(() => {
    const base = selectedGroup ? announcements.filter((a) => a.groupName === selectedGroup) : announcements;
    return base;
  }, [announcements, selectedGroup]);

  const importantCount = (groupName: string) =>
    announcements.filter((a) => a.groupName === groupName && isImportant(a)).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="grid grid-cols-1 lg:grid-cols-12 gap-6"
    >
      {/* Left: Monitored Groups */}
      <div className="lg:col-span-4 space-y-4">
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 shadow-sm">
                <Users className="w-3.5 h-3.5 text-white" />
              </span>
              <h3 className="text-xs font-bold text-slate-900">Monitored Groups</h3>
            </div>
            <span className="text-[10px] text-slate-500 font-medium">{groups.length} linked</span>
          </div>

          {groups.length === 0 ? (
            <div className="text-center py-6 px-2 space-y-2">
              <p className="text-xs text-slate-500">No groups linked yet.</p>
              <p className="text-[11px] text-slate-400">Link your WhatsApp account and select the groups you want the AI to monitor.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <button
                onClick={() => setSelectedGroup(null)}
                className={`w-full text-left px-3 py-2 rounded-xl border text-xs font-semibold transition-all flex items-center justify-between ${
                  selectedGroup === null
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-800'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>All Groups</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              {groups.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setSelectedGroup(g.name)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                    selectedGroup === g.name
                      ? 'bg-indigo-50 border-indigo-300'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span className="text-xs font-bold text-slate-900 truncate">{g.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-400">{g.lastMessageTime}</span>
                  </div>
                  {importantCount(g.name) > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200 shrink-0">
                      {importantCount(g.name)}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={onOpenAccountModal}
            className="w-full py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Manage WhatsApp Link</span>
          </button>

          <button
            onClick={onOpenSimulator}
            className="w-full py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
          >
            <FlaskConical className="w-3.5 h-3.5" />
            <span>Test AI Message Parsing</span>
          </button>
        </div>

        <MiniAcademicCalendar />
      </div>

      {/* Right: Highlighted Messages */}
      <div className="lg:col-span-8">
        <div className="glass-card rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 shadow-sm">
                <MessageSquare className="w-4 h-4 text-white" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {selectedGroup ? selectedGroup : 'All Groups'} — Important Messages
                </h3>
                <p className="text-xs text-slate-500">Exams, timetable changes, and instructions the AI flagged automatically</p>
              </div>
            </div>
          </div>

          <div className="space-y-3 max-h-[32rem] overflow-y-auto pr-1">
            <AnimatePresence mode="popLayout">
              {filteredAnnouncements.length === 0 ? (
                <div className="text-center py-10 text-sm text-slate-400">
                  No messages yet from {selectedGroup || 'any monitored group'}.
                </div>
              ) : (
                filteredAnnouncements.map((ann) => (
                  <motion.div
                    key={ann.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`p-3.5 rounded-xl bg-white border space-y-1.5 shadow-2xs transition-all ${
                      isImportant(ann) ? 'border-indigo-200 ring-1 ring-indigo-100' : 'border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-indigo-50 text-indigo-800 border border-indigo-200">
                        {ann.groupName}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{ann.timestamp}</span>
                    </div>

                    <p className="text-xs font-semibold text-slate-900 leading-relaxed">"{ann.rawMessage}"</p>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                      <span className="text-emerald-700 font-medium font-mono flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        {ann.normalizedMessage}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${categoryColor[ann.category] || categoryColor.General}`}>
                        {isImportant(ann) && <AlertTriangle className="w-2.5 h-2.5 inline mr-0.5 -mt-0.5" />}
                        {ann.category}
                      </span>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
