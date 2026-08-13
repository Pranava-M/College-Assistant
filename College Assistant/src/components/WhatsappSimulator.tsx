import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MonitoredWhatsAppGroup, CollegeAnnouncement, AIParseResult } from '../types';
import { 
  MessageSquare, 
  ShieldCheck, 
  Sparkles, 
  Bot, 
  CheckCircle2, 
  ArrowRight, 
  Clock, 
  Zap,
  Users
} from 'lucide-react';

interface WhatsappSimulatorProps {
  groups: MonitoredWhatsAppGroup[];
  announcements: CollegeAnnouncement[];
  onProcessNewMessage: (
    rawMessage: string, 
    groupName: string, 
    sender: string
  ) => Promise<AIParseResult>;
}

// 10 recent messages per group with real-time exam & test tracking
const MOCK_GROUP_MESSAGES_FEED: Record<string, Array<{
  id: string;
  sender: string;
  text: string;
  timestamp: string;
  category: 'Quiz' | 'Exam' | 'Test' | 'Tutorial' | 'Timetable Change' | 'General';
  isExam: boolean;
  eventDate: string; // YYYY-MM-DD
}>> = {
  'B.Tech CSE 2023-27 Sec-H Official': [
    { id: 'm1', sender: 'Class Rep Arjun', text: 'Guys tomorrow ML quiz slot5 in CP Lab 2. Bring lab record!', timestamp: 'Today 09:30 AM', category: 'Quiz', isExam: true, eventDate: new Date(Date.now() + 86400000).toISOString().split('T')[0] },
    { id: 'm2', sender: 'Teacher 1', text: 'ML Test 2 valuation completed. Mid sem syllabus posted.', timestamp: 'Yesterday 04:15 PM', category: 'Test', isExam: true, eventDate: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0] },
    { id: 'm3', sender: 'Academic Office', text: 'Mid Semester Examinations start from 18 August 2026. Hall tickets available on portal.', timestamp: 'Jul 27 10:00 AM', category: 'Exam', isExam: true, eventDate: '2026-08-18' },
    { id: 'm4', sender: 'Class Rep Arjun', text: 'CN class shifted to slot8 today in D406 room.', timestamp: 'Today 10:15 AM', category: 'Timetable Change', isExam: false, eventDate: new Date().toISOString().split('T')[0] },
    { id: 'm5', sender: 'Teacher 3', text: 'Course 3 tutorial session on Friday slot 10.', timestamp: 'Jul 26 02:30 PM', category: 'Tutorial', isExam: true, eventDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0] },
    { id: 'm6', sender: 'Teacher 4', text: 'Course 4 HW Lab viva evaluation completed for Batch 1.', timestamp: 'Jul 25 11:20 AM', category: 'Test', isExam: true, eventDate: new Date(Date.now() - 86400000 * 4).toISOString().split('T')[0] },
    { id: 'm7', sender: 'Teacher 11', text: 'Mentoring session today slot 10 in respective cabin.', timestamp: 'Jul 24 09:00 AM', category: 'General', isExam: false, eventDate: '2026-07-24' },
    { id: 'm8', sender: 'Class Rep Arjun', text: 'Course 7 online quiz submitted successfully.', timestamp: 'Jul 22 06:00 PM', category: 'Quiz', isExam: true, eventDate: '2026-07-22' },
    { id: 'm9', sender: 'Teacher 5', text: 'PE1 Course 5 Quiz 1 scheduled next week Thursday slot 2.', timestamp: 'Today 08:00 AM', category: 'Quiz', isExam: true, eventDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0] },
    { id: 'm10', sender: 'Teacher 6', text: 'PE2 Course 6 assignment test submission closed.', timestamp: 'Jul 20 05:00 PM', category: 'Test', isExam: true, eventDate: '2026-07-20' },
  ],
  'ML & AI Announcements': [
    { id: 'ml1', sender: 'Teacher 1', text: 'ML surprise quiz tomorrow slot 5 in A404 CP Lab 2.', timestamp: 'Today 08:30 AM', category: 'Quiz', isExam: true, eventDate: new Date(Date.now() + 86400000).toISOString().split('T')[0] },
    { id: 'ml2', sender: 'Teaching Asst Rahul', text: 'Course 1 Lab evaluation 1 marks uploaded.', timestamp: 'Jul 25 03:00 PM', category: 'Test', isExam: true, eventDate: '2026-07-25' },
    { id: 'ml3', sender: 'Teacher 1', text: 'Mid sem syllabus: Supervised Learning, SVM & Decision Trees.', timestamp: 'Jul 24 01:10 PM', category: 'Exam', isExam: true, eventDate: '2026-08-18' },
    { id: 'ml4', sender: 'Class Rep Arjun', text: 'ML lab records to be submitted before Friday 4 PM.', timestamp: 'Jul 23 11:00 AM', category: 'General', isExam: false, eventDate: '2026-07-25' },
    { id: 'ml5', sender: 'Teaching Asst Rahul', text: 'Python notebooks for SVM posted on the college LMS portal.', timestamp: 'Jul 21 04:00 PM', category: 'General', isExam: false, eventDate: '2026-07-21' },
    { id: 'ml6', sender: 'Teacher 1', text: 'ML Unit 1 Test finished on 15th July.', timestamp: 'Jul 15 02:00 PM', category: 'Test', isExam: true, eventDate: '2026-07-15' },
    { id: 'ml7', sender: 'Class Rep Arjun', text: 'CP Lab 2 venue changed to A402 for today only.', timestamp: 'Jul 14 09:30 AM', category: 'Timetable Change', isExam: false, eventDate: '2026-07-14' },
    { id: 'ml8', sender: 'Teacher 1', text: 'Extra doubt clearing tutorial class on Saturday morning.', timestamp: 'Jul 12 10:00 AM', category: 'Tutorial', isExam: false, eventDate: '2026-07-12' },
    { id: 'ml9', sender: 'Teaching Asst Rahul', text: 'Kaggle dataset links sent for ML project.', timestamp: 'Jul 10 06:15 PM', category: 'General', isExam: false, eventDate: '2026-07-10' },
    { id: 'ml10', sender: 'Class Rep Arjun', text: 'ML Quiz 1 answers key released.', timestamp: 'Jul 08 05:00 PM', category: 'Quiz', isExam: true, eventDate: '2026-07-08' },
  ],
};

export const WhatsappSimulator: React.FC<WhatsappSimulatorProps> = ({
  groups,
  announcements,
  onProcessNewMessage,
}) => {
  const [selectedGroup, setSelectedGroup] = useState<string>(groups[0]?.name || 'B.Tech CSE 2023-27 Sec-H Official');
  const [inputMessage, setInputMessage] = useState<string>('');
  const [senderName, setSenderName] = useState<string>('Class Rep Arjun');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [latestResult, setLatestResult] = useState<AIParseResult | null>(null);

  const currentMs = new Date().getTime();

  // Retrieve last 10 messages for selected group
  const groupFeed = MOCK_GROUP_MESSAGES_FEED[selectedGroup] || MOCK_GROUP_MESSAGES_FEED['B.Tech CSE 2023-27 Sec-H Official'];

  const sampleMessages = [
    'Guys tomorrow ML quiz slot5 in CP Lab 2',
    'CN class shifted to slot8 today',
    'AI Lab cancelled today sir absent',
    'Mid sem exam starts from 18 Aug',
    'TOC cls shifted to slot6',
    'lab eval nxt mon for PE1 Blockchain',
    'Achala Hall exam venue changed slot3'
  ];

  const handleSimulate = async (msgToUse?: string) => {
    const textToSubmit = msgToUse || inputMessage;
    if (!textToSubmit.trim() || isProcessing) return;

    setIsProcessing(true);
    setLatestResult(null);

    try {
      const result = await onProcessNewMessage(textToSubmit, selectedGroup, senderName);
      setLatestResult(result);
      if (!msgToUse) setInputMessage('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Column: Monitored Groups & Quick Triggers */}
      <div className="lg:col-span-4 space-y-4">
        {/* Read-Only Safety Banner */}
        <div className="bg-emerald-50/90 border border-emerald-200 p-4 rounded-2xl space-y-1.5 shadow-2xs">
          <div className="flex items-center gap-2 font-bold text-emerald-950 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>100% Read-Only Safety Protocol</span>
          </div>
          <p className="text-[11px] text-emerald-900 leading-relaxed font-medium">
            The AI observer passively parses class notices without sending or replying to messages.
          </p>
        </div>

        {/* Monitored Groups List */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>Monitored Groups</span>
            </h3>
            <span className="px-2 py-0.5 text-[10px] bg-slate-100 rounded-full font-mono text-slate-600 font-bold border border-slate-200">
              {groups.length} Groups
            </span>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {groups.map((grp) => {
              const isSelected = selectedGroup === grp.name;
              return (
                <button
                  key={grp.id}
                  onClick={() => setSelectedGroup(grp.name)}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between group ${
                    isSelected
                      ? 'bg-indigo-500/10 border-indigo-300 text-slate-900 shadow-2xs font-bold'
                      : 'bg-slate-50/70 border-slate-200/80 text-slate-700 hover:bg-slate-100/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                      isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700 group-hover:bg-slate-300'
                    }`}>
                      WA
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs truncate max-w-[150px]">{grp.name}</h4>
                      <p className="text-[10px] text-slate-500 font-medium">{grp.lastMessageTime}</p>
                    </div>
                  </div>

                  {grp.unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white shadow-2xs shrink-0">
                      {grp.unreadCount} new
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Test Messages */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 space-y-2.5 shadow-xs">
          <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5 text-indigo-600" />
            <span>Sample Student Messages</span>
          </h4>
          <p className="text-[11px] text-slate-500">Click any message to test instant AI intent extraction:</p>
          <div className="space-y-1.5">
            {sampleMessages.map((msg, i) => (
              <button
                key={i}
                onClick={() => handleSimulate(msg)}
                disabled={isProcessing}
                className="w-full text-left px-3 py-2 rounded-xl bg-slate-50 hover:bg-indigo-50/80 text-xs text-slate-800 border border-slate-200/80 hover:border-indigo-200 transition-all flex items-center justify-between group"
              >
                <span className="truncate font-medium text-[11px]">"{msg}"</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 shrink-0 ml-1 transition-transform group-hover:translate-x-0.5" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column: AI Simulator Input & Message Feed */}
      <div className="lg:col-span-8 space-y-5">
        {/* Input & Live Processing Panel */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-100 text-indigo-900 border border-indigo-200">
                <Bot className="w-4 h-4 text-indigo-700" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Live WhatsApp Message AI Parser</h3>
                <p className="text-xs text-slate-500">Simulate incoming student messages or class notices</p>
              </div>
            </div>
            <span className="text-[11px] text-indigo-900 font-mono bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200 font-bold self-start sm:self-auto">
              Target: {selectedGroup}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-4">
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Sender Name</label>
              <input
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-medium focus:outline-none focus:border-indigo-500 focus:bg-white"
              />
            </div>

            <div className="sm:col-span-8">
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Incoming WhatsApp Message</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g., tmr quiz slot5 in CP Lab 2..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSimulate()}
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-medium focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
                <button
                  onClick={() => handleSimulate()}
                  disabled={isProcessing || !inputMessage.trim()}
                  className="px-4 py-2 rounded-xl btn-gradient disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shadow-xs hover:shadow-md"
                >
                  {isProcessing ? (
                    <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" /> Parse AI
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Gemini AI Result Card with Framer Motion Animation */}
        <AnimatePresence mode="wait">
          {latestResult && (
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ duration: 0.25 }}
              className="bg-indigo-50/80 border-2 border-indigo-300 rounded-2xl p-5 shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between border-b border-indigo-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-indigo-100 text-indigo-900 border border-indigo-300">
                    <Sparkles className="w-4 h-4 text-indigo-800" />
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-indigo-950">Gemini 3.6 Flash Intent Extraction</h4>
                    <p className="text-xs text-indigo-800 font-medium">Confidence: {(latestResult.confidenceScore * 100).toFixed(0)}%</p>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-indigo-600 text-white shadow-2xs">
                  {latestResult.type}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-white border border-indigo-100/80 shadow-2xs">
                  <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block mb-0.5">Subject</span>
                  <span className="font-bold text-slate-900 text-sm">{latestResult.subject || 'N/A'}</span>
                  {latestResult.subjectCode && (
                    <span className="ml-1.5 font-mono text-[11px] font-bold text-indigo-800">({latestResult.subjectCode})</span>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-white border border-indigo-100/80 shadow-2xs">
                  <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block mb-0.5">Date / Timing</span>
                  <span className="font-bold text-indigo-900 text-sm">{latestResult.dateStr || 'Today'}</span>
                  {latestResult.slot && (
                    <span className="ml-2 text-xs font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                      Slot {latestResult.slot}
                    </span>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-white border border-indigo-100/80 shadow-2xs">
                  <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block mb-0.5">Venue</span>
                  <span className="font-bold text-emerald-800 text-sm">{latestResult.venue || 'As per Timetable'}</span>
                </div>
              </div>

              {/* Normalized Sentence */}
              <div className="p-3 rounded-xl bg-white/90 border border-indigo-200 text-xs space-y-1">
                <span className="font-bold text-indigo-950 block text-[11px] uppercase tracking-wider">Normalized Intent:</span>
                <p className="text-slate-800 font-medium">"{latestResult.normalizedText}"</p>
              </div>

              {/* Automated Actions Triggered */}
              <div className="flex flex-wrap items-center gap-3 pt-2 text-xs border-t border-indigo-100 text-slate-700">
                <span className="flex items-center gap-1 text-emerald-700 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Timetable Sync Active
                </span>
                <span className="flex items-center gap-1 text-indigo-800 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" /> GCal Alert Added
                </span>
                <span className="flex items-center gap-1 text-indigo-800 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" /> Email Reminder Scheduled
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Selected Group Message Feed */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <span>Group History: <span className="text-indigo-800 font-extrabold">{selectedGroup}</span></span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Recent 10 class announcements parsed for assessment dates and timetable shifts
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono bg-slate-100 text-slate-700 border border-slate-200 font-bold">
              10 Messages
            </span>
          </div>

          <div className="space-y-3">
            {groupFeed.map((item, idx) => {
              const isPastEvent = item.eventDate && new Date(item.eventDate).getTime() < currentMs;

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: idx * 0.03 }}
                  className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-2 hover:border-indigo-200 transition-all shadow-2xs"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{item.sender}</span>
                      <span className="text-slate-400 text-[11px]">• {item.timestamp}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-900 border border-indigo-200">
                        {item.category}
                      </span>

                      {item.isExam && (
                        isPastEvent ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Completed
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-900 border border-rose-300 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-rose-600" /> Active Alert
                          </span>
                        )
                      )}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs font-mono text-slate-800 font-medium leading-relaxed">
                    "{item.text}"
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-0.5">
                    <span className="text-slate-500 text-[10px] font-semibold">
                      Target Date: <strong className="text-slate-800">{item.eventDate}</strong>
                    </span>

                    <button
                      onClick={() => handleSimulate(item.text)}
                      disabled={isProcessing}
                      className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 text-[11px] font-bold transition-all flex items-center gap-1 shadow-2xs"
                    >
                      <Sparkles className="w-3 h-3 text-indigo-700" />
                      Parse AI
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
