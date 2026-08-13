import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, FileText, Download, CheckCircle2 } from 'lucide-react';

interface OfficialTimetableModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OfficialTimetableModal: React.FC<OfficialTimetableModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25 }}
          className="glass-card rounded-2xl max-w-4xl w-full p-6 space-y-5 shadow-2xl relative"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Header */}
          <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
            <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900">
              <FileText className="w-6 h-6 text-indigo-700" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Official Master Timetable PDF Reference
              </h3>
              <p className="text-xs text-slate-500">
                Dept: CSE • Semester: V • Section: H • Room: Room 1
              </p>
            </div>
          </div>

          {/* Timetable Courses Reference */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
              Official Course Catalog &amp; Assigned Faculty
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center shadow-2xs">
                <div>
                  <strong className="text-slate-900 font-bold block">COURSE101 Course 1</strong>
                  <span className="text-[11px] text-slate-600">Faculty: Teacher 1</span>
                </div>
                <span className="text-indigo-800 font-mono font-bold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">D406 / Lab A404</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center shadow-2xs">
                <div>
                  <strong className="text-slate-900 font-bold block">COURSE102 Course 2</strong>
                  <span className="text-[11px] text-slate-600">Faculty: Teacher 2</span>
                </div>
                <span className="text-indigo-800 font-mono font-bold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">D406 / Lab A402</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center shadow-2xs">
                <div>
                  <strong className="text-slate-900 font-bold block">COURSE103 Course 3</strong>
                  <span className="text-[11px] text-slate-600">Faculty: Teacher 3</span>
                </div>
                <span className="text-indigo-800 font-mono font-bold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">D406</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center shadow-2xs">
                <div>
                  <strong className="text-slate-900 font-bold block">COURSE104 Course 4</strong>
                  <span className="text-[11px] text-slate-600">Faculty: Teacher 4</span>
                </div>
                <span className="text-indigo-800 font-mono font-bold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">D406 / HW Lab</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center shadow-2xs">
                <div>
                  <strong className="text-slate-900 font-bold block">COURSE108 Adv Algo (PE I)</strong>
                  <span className="text-[11px] text-slate-600">Faculty: Dr. Teacher 12</span>
                </div>
                <span className="text-indigo-800 font-mono font-bold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">Achala / C104</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center shadow-2xs">
                <div>
                  <strong className="text-slate-900 font-bold block">COURSE109 Full Stack (PE II)</strong>
                  <span className="text-[11px] text-slate-600">Faculty: Dr. Teacher 13</span>
                </div>
                <span className="text-indigo-800 font-mono font-bold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">Room 5</span>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-between border-t border-slate-200 pt-4 text-xs">
            <span className="text-emerald-700 font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Active Master Timetable Match (CSE-H)
            </span>

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-all shadow-md"
            >
              Close Reference
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
