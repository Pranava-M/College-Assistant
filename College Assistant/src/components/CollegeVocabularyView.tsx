import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LearnedAcronym } from '../types';
import { BookOpen, Sparkles, Plus, Search, BrainCircuit, CheckCircle2 } from 'lucide-react';

interface CollegeVocabularyViewProps {
  acronyms: LearnedAcronym[];
  onAddAcronym: (acronym: LearnedAcronym) => void;
}

export const CollegeVocabularyView: React.FC<CollegeVocabularyViewProps> = ({
  acronyms,
  onAddAcronym,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [newTerm, setNewTerm] = useState('');
  const [newMeaning, setNewMeaning] = useState('');
  const [newCategory, setNewCategory] = useState<'Subject' | 'Venue' | 'Faculty' | 'Slang'>('Subject');

  const categories = ['All', 'Subject', 'Venue', 'Slang', 'Faculty'];

  const filtered = acronyms.filter((a) => {
    const matchesSearch =
      a.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.meaning.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'All' || a.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTerm || !newMeaning) return;

    onAddAcronym({
      id: `ac-${Date.now()}`,
      term: newTerm.trim(),
      meaning: newMeaning.trim(),
      category: newCategory,
      confidence: 1.0,
      detectedFrom: 'Manual Student Input',
      learnedAt: new Date().toISOString().split('T')[0],
    });

    setNewTerm('');
    setNewMeaning('');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="space-y-1">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-900 border border-indigo-200">
              <BrainCircuit className="w-4 h-4 text-indigo-700" />
            </span>
            Adaptive Campus Dictionary &amp; Slang Engine
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            The AI automatically decodes subject shortcuts, hall abbreviations, and Gen Z student slang
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-900 border border-indigo-200">
            {acronyms.length} Registered Terms
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Cols: Dictionary Feed */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-4">
            {/* Search & Category Filter Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search slang (e.g. LOL, ML, Achala, tmr)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-medium focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      activeCategory === cat
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Terms Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[520px] overflow-y-auto pr-1">
              <AnimatePresence mode="popLayout">
                {filtered.map((item, idx) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2, delay: idx * 0.02 }}
                    className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-1.5 hover:border-indigo-200 transition-all shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-indigo-900 font-mono bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-200">
                        "{item.term}"
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-slate-700 border border-slate-200">
                        {item.category}
                      </span>
                    </div>

                    <p className="text-xs font-bold text-slate-800 leading-snug">{item.meaning}</p>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1.5 border-t border-slate-200/60 font-medium">
                      <span className="truncate max-w-[140px]">Source: {item.detectedFrom}</span>
                      <span className="text-emerald-700 font-bold">{(item.confidence * 100).toFixed(0)}% Match</span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Teach AI New Acronym Form */}
        <div className="lg:col-span-4 space-y-4">
          <form onSubmit={handleCreate} className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-3 shadow-xs text-xs">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-600" />
              Teach AI New Campus Shortcut
            </h4>

            <div>
              <label className="text-slate-700 font-bold block mb-1">Abbreviation / Slang</label>
              <input
                type="text"
                placeholder="e.g., BRB, PE1, Achala"
                value={newTerm}
                onChange={(e) => setNewTerm(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-medium focus:outline-none focus:border-indigo-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="text-slate-700 font-bold block mb-1">Expanded Meaning</label>
              <input
                type="text"
                placeholder="e.g., Be Right Back or Blockchain"
                value={newMeaning}
                onChange={(e) => setNewMeaning(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-medium focus:outline-none focus:border-indigo-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="text-slate-700 font-bold block mb-1">Category</label>
              <select
                value={newCategory}
                onChange={(e: any) => setNewCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-medium focus:outline-none focus:border-indigo-500 focus:bg-white"
              >
                <option value="Subject">Subject</option>
                <option value="Venue">Venue / Hall</option>
                <option value="Faculty">Faculty Name</option>
                <option value="Slang">Gen Z Slang</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={!newTerm || !newMeaning}
              className="w-full py-2.5 rounded-xl btn-gradient disabled:opacity-50 text-white font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" /> Register Term in AI Engine
            </button>
          </form>

          <div className="bg-indigo-50/80 border border-indigo-100/90 rounded-2xl p-4 text-xs space-y-1.5 text-indigo-950 font-medium">
            <span className="font-bold flex items-center gap-1.5 text-indigo-900">
              <CheckCircle2 className="w-4 h-4 text-indigo-700" /> Auto-Learning Active
            </span>
            <p className="text-[11px] text-indigo-900/90 leading-relaxed">
              When students drop messages like "TOC cls shifted slot6", Gemini AI automatically translates TOC to Course 3 (COURSE103).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
