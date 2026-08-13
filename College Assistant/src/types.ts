export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export interface SlotInfo {
  slotNumber: number;
  timeRange: string;
  startTime: string; // HH:MM in 24h
  endTime: string;   // HH:MM in 24h
}

export interface CourseSubject {
  code: string;
  name: string;
  faculty: string;
  venue: string;
  type: 'Theory' | 'Lab' | 'PE' | 'CIR' | 'Mentoring';
}

export interface TimetableCell {
  id: string;
  slotNumber: number;
  subjectCode: string;
  subjectName: string;
  faculty: string;
  venue: string;
  type: 'Theory' | 'Lab' | 'PE' | 'CIR' | 'Mentoring';
  isShifted?: boolean;
  isCancelled?: boolean;
  note?: string;
  bringLaptop?: boolean;
  hasQuiz?: boolean;
}

export interface DaySchedule {
  day: DayOfWeek;
  slots: Record<number, TimetableCell>;
}

export type MasterTimetable = Record<DayOfWeek, Record<number, TimetableCell>>;

export interface TimetableChangeRecord {
  id: string;
  timestamp: string;
  originalMessage: string;
  changeType: 'Class Shift' | 'Cancelled' | 'Room Changed' | 'Faculty Changed' | 'Extra Class' | 'Lab Shifted';
  subject: string;
  day?: DayOfWeek;
  date?: string;
  oldSlot?: number;
  newSlot?: number;
  oldVenue?: string;
  newVenue?: string;
  oldFaculty?: string;
  newFaculty?: string;
  status: 'Applied' | 'Reverted' | 'Skipped';
}

export interface CollegeAnnouncement {
  id: string;
  timestamp: string;
  groupName: string;
  sender: string;
  rawMessage: string;
  normalizedMessage: string;
  category: 'Exam' | 'Quiz' | 'Lab Evaluation' | 'Assignment' | 'Project Review' | 'Seminar' | 'Holiday' | 'Timetable Change' | 'General';
  subject?: string;
  dateStr?: string;
  slot?: number;
  venue?: string;
  actionRequired: boolean;
  syncedToCalendar: boolean;
}

export interface ScheduledReminder {
  id: string;
  title: string;
  subject: string;
  eventDate: string;
  category: string;
  channels: ('Desktop' | 'Email' | 'Telegram')[];
  startReminderDate: string; // 3 days before
  repeatIntervalHours: number; // 5 hours
  status: 'Scheduled' | 'Sent' | 'Dismissed';
  lastTriggered?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  startDateTime: string;
  endDateTime: string;
  location?: string;
  category: string;
  googleCalendarEventId?: string;
  status: 'Confirmed' | 'Updated' | 'Cancelled';
}

export interface LearnedAcronym {
  id: string;
  term: string;
  meaning: string;
  category: 'Subject' | 'Venue' | 'Faculty' | 'Slang';
  confidence: number;
  detectedFrom: string;
  learnedAt: string;
}

export interface MonitoredWhatsAppGroup {
  id: string;
  name: string;
  unreadCount: number;
  isActive: boolean;
  lastMessageTime: string;
}

export interface MakeWebhookConfig {
  webhookUrl: string;
  apiKey: string;
  syncGoogleCalendar: boolean;
  sendEmailNotifications: boolean;
  dataStoreEnabled: boolean;
  lastTriggered?: string;
}

export interface AIParseResult {
  rawMessage: string;
  normalizedText: string;
  type: string; // 'Quiz' | 'Exam' | 'Class Shift' | 'Cancelled' | 'Lab Eval' | 'Holiday' | etc.
  subject?: string;
  subjectCode?: string;
  dateStr?: string;
  parsedDateISO?: string;
  slot?: number;
  oldSlot?: number;
  newSlot?: number;
  venue?: string;
  faculty?: string;
  /** True when the message cancels ALL classes for a group/day (e.g. "no
   *  classes tomorrow for third years") rather than one specific subject. */
  wholeDayCancelled?: boolean;
  confidenceScore: number;
  learnedAcronyms?: { term: string; meaning: string; category: string }[];
  calendarEventNeeded: boolean;
  reminderNeeded: boolean;
}
