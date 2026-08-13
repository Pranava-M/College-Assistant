/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, MessageSquare, CalendarClock, Mail, ShieldCheck, BookOpen } from 'lucide-react';

const features = [
  {
    icon: <MessageSquare className="w-4 h-4 text-white" />,
    gradient: 'from-emerald-500 to-teal-500',
    title: 'Reads, Never Replies',
    desc: "Monitors only the WhatsApp groups you select and never sends or posts a message on your behalf.",
  },
  {
    icon: <Sparkles className="w-4 h-4 text-white" />,
    gradient: 'from-indigo-500 to-violet-600',
    title: 'Understands Student Slang',
    desc: 'Trained to parse Gen-Z shorthand and casual college phrasing — "cls cancld tmr" becomes a structured update.',
  },
  {
    icon: <CalendarClock className="w-4 h-4 text-white" />,
    gradient: 'from-cyan-500 to-indigo-500',
    title: 'Live Timetable',
    desc: 'Detects postponed, preponed, cancelled, or shifted classes and updates your timetable automatically.',
  },
  {
    icon: <Mail className="w-4 h-4 text-white" />,
    gradient: 'from-rose-500 to-orange-500',
    title: 'Midnight Digest',
    desc: "Every night at 24:00, emails you tomorrow's timetable — including exams, quizzes, and important notes.",
  },
];

export const AboutView: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 max-w-3xl mx-auto"
    >
      <div className="glass-card rounded-2xl p-8 text-center space-y-3 bg-aurora">
        <span className="inline-flex p-3 rounded-2xl gradient-brand shadow-lg shadow-indigo-600/20">
          <BookOpen className="w-6 h-6 text-white" />
        </span>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
          About <span className="gradient-text">College AI Assistant</span>
        </h1>
        <p className="text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
          A quiet, always-on assistant that reads your college WhatsApp groups so you don't have to
          scroll through hundreds of messages to find the one that matters — an exam moved, a class
          cancelled, or a professor asking everyone to bring a laptop tomorrow.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {features.map((f, idx) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: idx * 0.05 }}
            className="glass-card rounded-2xl p-4 space-y-2"
          >
            <span className={`inline-flex p-2 rounded-xl bg-gradient-to-br ${f.gradient} shadow-sm`}>
              {f.icon}
            </span>
            <h3 className="text-sm font-bold text-slate-900">{f.title}</h3>
            <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
          </motion.div>
        ))}
      </div>

      <div className="glass-card rounded-2xl p-5 space-y-2">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Privacy, in plain terms</span>
        </div>
        <ul className="text-xs text-slate-600 space-y-1.5 pl-5 list-disc leading-relaxed">
          <li>Only groups you explicitly toggle on are ever read.</li>
          <li>The assistant runs on a server you control — nothing is uploaded to a third party beyond the AI model call needed to parse each message.</li>
          <li>You can unlink your WhatsApp account at any time from the Dashboard.</li>
        </ul>
      </div>

      <p className="text-center text-[11px] text-slate-400 pt-2">
        Built for B.Tech CSE Sem V • Academic Calendar AY 2026–2027
      </p>
    </motion.div>
  );
};
