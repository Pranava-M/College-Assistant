/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { BookOpen, Search, User, MapPin, Hash } from 'lucide-react';
import { COURSE_SUBJECTS } from '../data/subjects';

const typeStyles: Record<string, string> = {
  Theory: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  Lab: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  PE: 'bg-violet-50 text-violet-700 border-violet-200',
  CIR: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  Mentoring: 'bg-rose-50 text-rose-700 border-rose-200',
};

export const LectureNamesView: React.FC = () => {
  const [query, setQuery] = useState('');

  const filtered = COURSE_SUBJECTS.filter((s) => {
    const q = query.toLowerCase();
    return (
      s.fullName.toLowerCase().includes(q) ||
      s.shortName.toLowerCase().includes(q) ||
      s.code.toLowerCase().includes(q) ||
      s.faculty.toLowerCase().includes(q)
    );
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      <div className="glass-card rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-sm">
              <BookOpen className="w-4 h-4 text-white" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Lecture Names & Course Codes</h2>
              <p className="text-xs text-slate-500">Every subject the AI recognizes, with its official course code and faculty</p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            {COURSE_SUBJECTS.length} subjects
          </span>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, short code, or faculty…"
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-white border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-2xs"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((s, idx) => (
          <motion.div
            key={s.code}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: idx * 0.03 }}
            whileHover={{ y: -3 }}
            className="glass-card rounded-2xl p-4 space-y-3"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">{s.fullName}</h3>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">{s.shortName}</p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${typeStyles[s.type] || typeStyles.Theory}`}>
                {s.type}
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-2.5">
              <div className="flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-mono font-semibold">{s.code}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>{s.faculty}</span>
              </div>
              {s.venue && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{s.venue}</span>
                </div>
              )}
            </div>
          </motion.div>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full glass-card rounded-2xl p-8 text-center text-sm text-slate-500">
            No subjects match "{query}".
          </div>
        )}
      </div>
    </motion.div>
  );
};
