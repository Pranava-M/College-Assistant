import React from 'react';
import { motion } from 'motion/react';
import { 
  LayoutDashboard, 
  Clock, 
  BookOpen, 
  ShieldCheck,
  Zap,
  QrCode,
} from 'lucide-react';

export type TabType = 
  | 'dashboard' 
  | 'lectures' 
  | 'genz' 
  | 'timetable' 
  | 'about';

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  pendingAnnouncementsCount: number;
  onOpenAccountModal: () => void;
  waStatus?: 'disconnected' | 'connecting' | 'qr_ready' | 'connected' | 'error';
  waLinkedNumber?: string | null;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  activeTab, 
  setActiveTab, 
  pendingAnnouncementsCount,
  onOpenAccountModal,
  waStatus = 'disconnected',
  waLinkedNumber = null,
}) => {
  const navItems: { id: TabType; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-3.5 h-3.5" />, badge: pendingAnnouncementsCount },
    { id: 'lectures', label: 'Lecture Names', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
    { id: 'genz', label: 'Gen Z Words', icon: <BookOpen className="w-3.5 h-3.5" /> },
    { id: 'timetable', label: 'Timetable', icon: <Clock className="w-3.5 h-3.5" /> },
    { id: 'about', label: 'About', icon: <Zap className="w-3.5 h-3.5" /> },
  ];

  return (
    <header className="bg-white/75 border-b border-slate-200/70 text-slate-800 sticky top-0 z-50 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Version */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 gradient-brand rounded-xl flex items-center justify-center font-bold text-white text-xs shadow-lg shadow-indigo-600/25">
              CA
            </div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-slate-900">
                College AI Assistant
              </h1>
              <span className="text-[10px] font-mono text-indigo-700 font-semibold bg-indigo-50 px-1.5 py-0.5 rounded-full border border-indigo-200/70">
                v2.1.0 • B.Tech CSE
              </span>
            </div>
          </div>

          {/* Center Navigation Links with Motion */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    isActive
                      ? 'text-indigo-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTabPill"
                      className="absolute inset-0 bg-indigo-50 border border-indigo-200/80 rounded-full -z-0"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    {item.icon}
                    <span>{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-violet-600 text-white shadow-xs">
                        {item.badge}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* WhatsApp Link & Status Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenAccountModal}
              className={`px-3 py-1.5 rounded-full text-white text-xs font-semibold shadow-md transition-all flex items-center gap-1.5 ${
                waStatus === 'connected' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20' : 'btn-gradient shadow-indigo-600/20'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>{waStatus === 'connected' ? 'WhatsApp Linked' : 'Link WhatsApp'}</span>
            </button>

            <div
              className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium ${
                waStatus === 'connected'
                  ? 'bg-emerald-50 border-emerald-200/70 text-emerald-800'
                  : 'bg-slate-100 border-slate-200 text-slate-500'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${waStatus === 'connected' ? 'bg-emerald-500 animate-pulse-glow' : 'bg-slate-400'}`}></span>
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{waStatus === 'connected' ? (waLinkedNumber || 'Linked') : 'Not Linked'}</span>
            </div>
          </div>
        </div>

        {/* Mobile Tab Bar */}
        <div className="flex lg:hidden overflow-x-auto pb-2 gap-1 border-t border-slate-200/60 pt-2 no-scrollbar">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === item.id
                  ? 'btn-gradient text-white font-bold shadow-xs'
                  : 'text-slate-600 bg-slate-100/80'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
