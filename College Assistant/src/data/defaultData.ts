import { DayOfWeek, MasterTimetable, SlotInfo, CourseSubject, MonitoredWhatsAppGroup, LearnedAcronym, CollegeAnnouncement, ScheduledReminder, CalendarEvent } from '../types';

export const STANDARD_SLOTS: Record<number, SlotInfo> = {
  1: { slotNumber: 1, timeRange: '08:00 AM - 08:50 AM', startTime: '08:00', endTime: '08:50' },
  2: { slotNumber: 2, timeRange: '08:50 AM - 09:40 AM', startTime: '08:50', endTime: '09:40' },
  3: { slotNumber: 3, timeRange: '09:40 AM - 10:30 AM', startTime: '09:40', endTime: '10:30' },
  4: { slotNumber: 4, timeRange: '10:45 AM - 11:35 AM', startTime: '10:45', endTime: '11:35' },
  5: { slotNumber: 5, timeRange: '11:35 AM - 12:25 PM', startTime: '11:35', endTime: '12:25' },
  6: { slotNumber: 6, timeRange: '12:25 PM - 01:15 PM', startTime: '12:25', endTime: '13:15' },
  7: { slotNumber: 7, timeRange: '01:15 PM - 02:05 PM (Lunch)', startTime: '13:15', endTime: '14:05' },
  8: { slotNumber: 8, timeRange: '02:05 PM - 02:55 PM', startTime: '14:05', endTime: '14:55' },
  9: { slotNumber: 9, timeRange: '02:55 PM - 03:45 PM', startTime: '14:55', endTime: '15:45' },
  10: { slotNumber: 10, timeRange: '03:45 PM - 04:35 PM', startTime: '15:45', endTime: '16:35' },
  12: { slotNumber: 12, timeRange: '05:25 PM - 06:15 PM', startTime: '17:25', endTime: '18:15' },
};

export const COURSE_CATALOG: CourseSubject[] = [
  { code: 'COURSE101', name: 'Course 1', faculty: 'Teacher 1', venue: 'Room 1', type: 'Theory' },
  { code: 'COURSE102', name: 'Course 2', faculty: 'Teacher 2', venue: 'Room 1', type: 'Theory' },
  { code: 'COURSE103', name: 'Course 3', faculty: 'Teacher 3', venue: 'Room 1', type: 'Theory' },
  { code: 'COURSE104', name: 'Course 4', faculty: 'Teacher 4', venue: 'Room 1', type: 'Theory' },
  { code: 'COURSE105', name: 'Course 5', faculty: 'Teacher 5', venue: 'Room 2 / Room 3', type: 'PE' },
  { code: 'COURSE106', name: 'Course 6', faculty: 'Teacher 6', venue: 'Room 4', type: 'PE' },
  { code: 'COURSE107', name: 'Course 7', faculty: 'Teacher 7', venue: 'Online', type: 'Theory' },
  { code: 'COURSE101-LAB', name: 'Course 1 Lab', faculty: 'Teacher 1 / Teacher 8', venue: 'Lab 1', type: 'Lab' },
  { code: 'COURSE102-LAB', name: 'Course 2 Lab', faculty: 'Teacher 2 / Teacher 3', venue: 'Lab 2', type: 'Lab' },
  { code: 'COURSE104-LAB', name: 'Course 4 Lab', faculty: 'Teacher 4 / Teacher 9', venue: 'Lab 3', type: 'Lab' },
  { code: 'CIR', name: 'CIR Professional Skill', faculty: 'CIR Dept', venue: 'Hall 1', type: 'CIR' },
  { code: 'MENTORING', name: 'Mentoring Session', faculty: 'Teacher 10 / Teacher 11', venue: 'Respective Cabin', type: 'Mentoring' },
];

export const INITIAL_MASTER_TIMETABLE: MasterTimetable = {
  Monday: {
    2: { id: 'm-2', slotNumber: 2, subjectCode: 'MENTORING', subjectName: 'Mentoring Session', faculty: 'Teacher 10', venue: 'Respective Cabin', type: 'Mentoring' },
    3: { id: 'm-3', slotNumber: 3, subjectCode: 'COURSE105', subjectName: 'Course 5 (PE1)', faculty: 'Teacher 5', venue: 'Room 3', type: 'PE' },
    4: { id: 'm-4', slotNumber: 4, subjectCode: 'COURSE102', subjectName: 'Course 2', faculty: 'Teacher 2', venue: 'Room 1', type: 'Theory' },
    6: { id: 'm-6', slotNumber: 6, subjectCode: 'COURSE103', subjectName: 'Course 3', faculty: 'Teacher 3', venue: 'Room 1', type: 'Theory' },
    8: { id: 'm-8', slotNumber: 8, subjectCode: 'COURSE106', subjectName: 'Course 6 (PE2)', faculty: 'Teacher 6', venue: 'Room 4', type: 'PE' },
    9: { id: 'm-9', slotNumber: 9, subjectCode: 'COURSE104', subjectName: 'Course 4', faculty: 'Teacher 4', venue: 'Room 1', type: 'Theory', bringLaptop: true },
    10: { id: 'm-10', slotNumber: 10, subjectCode: 'MENTORING', subjectName: 'Mentoring Session', faculty: 'Teacher 11', venue: 'Respective Cabin', type: 'Mentoring' },
  },
  Tuesday: {
    3: { id: 'tu-3', slotNumber: 3, subjectCode: 'COURSE103', subjectName: 'Course 3', faculty: 'Teacher 3', venue: 'Room 1', type: 'Theory' },
    4: { id: 'tu-4', slotNumber: 4, subjectCode: 'COURSE102-TUT', subjectName: 'Course 2 Tutorial', faculty: 'Teacher 2', venue: 'Room 3', type: 'Theory' },
    5: { id: 'tu-5', slotNumber: 5, subjectCode: 'COURSE104', subjectName: 'Course 4', faculty: 'Teacher 4', venue: 'Room 1', type: 'Theory', bringLaptop: true },
    6: { id: 'tu-6', slotNumber: 6, subjectCode: 'COURSE101', subjectName: 'Course 1', faculty: 'Teacher 1', venue: 'Room 1', type: 'Theory', bringLaptop: true, hasQuiz: true, note: 'Bring laptop & Quiz announced' },
    8: { id: 'tu-8', slotNumber: 8, subjectCode: 'CIR', subjectName: 'CIR Career Readiness', faculty: 'CIR Team', venue: 'Hall 1', type: 'CIR' },
    9: { id: 'tu-9', slotNumber: 9, subjectCode: 'CIR', subjectName: 'CIR Career Readiness', faculty: 'CIR Team', venue: 'Hall 1', type: 'CIR' },
    10: { id: 'tu-10', slotNumber: 10, subjectCode: 'CIR', subjectName: 'CIR Career Readiness', faculty: 'CIR Team', venue: 'Hall 1', type: 'CIR' },
  },
  Wednesday: {
    2: { id: 'w-2', slotNumber: 2, subjectCode: 'COURSE103-TUT', subjectName: 'Course 3 Tutorial', faculty: 'Teacher 3', venue: 'Room 1', type: 'Theory', note: 'Permanently shifted from Slot 10' },
    3: { id: 'w-3', slotNumber: 3, subjectCode: 'COURSE102', subjectName: 'Course 2', faculty: 'Teacher 2', venue: 'Room 1', type: 'Theory' },
    5: { id: 'w-5', slotNumber: 5, subjectCode: 'COURSE104-LAB', subjectName: 'Course 4 Lab', faculty: 'Teacher 4', venue: 'Lab 3', type: 'Lab', bringLaptop: true, note: 'Bring HW Kit & Laptop' },
    6: { id: 'w-6', slotNumber: 6, subjectCode: 'COURSE104-LAB', subjectName: 'Course 4 Lab', faculty: 'Teacher 4', venue: 'Lab 3', type: 'Lab', bringLaptop: true },
    9: { id: 'w-9', slotNumber: 9, subjectCode: 'COURSE101', subjectName: 'Course 1', faculty: 'Teacher 1', venue: 'Room 1', type: 'Theory', bringLaptop: true, note: 'Bring laptop for Jupyter lab' },
  },
  Thursday: {
    1: { id: 'th-1', slotNumber: 1, subjectCode: 'COURSE107', subjectName: 'Course 7', faculty: 'Teacher 7', venue: 'Online', type: 'Theory' },
    2: { id: 'th-2', slotNumber: 2, subjectCode: 'COURSE105', subjectName: 'Course 5 (PE1)', faculty: 'Teacher 5', venue: 'Room 2', type: 'PE' },
    3: { id: 'th-3', slotNumber: 3, subjectCode: 'COURSE104', subjectName: 'Course 4', faculty: 'Teacher 4', venue: 'Room 1', type: 'Theory', bringLaptop: true },
    4: { id: 'th-4', slotNumber: 4, subjectCode: 'COURSE106', subjectName: 'Course 6 (PE2)', faculty: 'Teacher 6', venue: 'Room 4', type: 'PE' },
    5: { id: 'th-5', slotNumber: 5, subjectCode: 'COURSE102', subjectName: 'Course 2', faculty: 'Teacher 2', venue: 'Room 1', type: 'Theory' },
    6: { id: 'th-6', slotNumber: 6, subjectCode: 'COURSE103', subjectName: 'Course 3', faculty: 'Teacher 3', venue: 'Room 1', type: 'Theory' },
    8: { id: 'th-8', slotNumber: 8, subjectCode: 'COURSE102-LAB', subjectName: 'Course 2 Lab', faculty: 'Teacher 2', venue: 'Lab 2', type: 'Lab', bringLaptop: true },
    9: { id: 'th-9', slotNumber: 9, subjectCode: 'COURSE102-LAB', subjectName: 'Course 2 Lab', faculty: 'Teacher 2', venue: 'Lab 2', type: 'Lab', bringLaptop: true },
  },
  Friday: {
    2: { id: 'f-2', slotNumber: 2, subjectCode: 'COURSE101', subjectName: 'Course 1', faculty: 'Teacher 1', venue: 'Room 1', type: 'Theory', bringLaptop: true, hasQuiz: true, note: 'Bring laptop & Quiz' },
    3: { id: 'f-3', slotNumber: 3, subjectCode: 'COURSE105', subjectName: 'Course 5 (PE1)', faculty: 'Teacher 5', venue: 'Room 2', type: 'PE' },
    4: { id: 'f-4', slotNumber: 4, subjectCode: 'COURSE106', subjectName: 'Course 6 (PE2)', faculty: 'Teacher 6', venue: 'Room 4', type: 'PE' },
    9: { id: 'f-9', slotNumber: 9, subjectCode: 'COURSE101-LAB', subjectName: 'Course 1 Lab', faculty: 'Teacher 1', venue: 'Lab 1', type: 'Lab', bringLaptop: true, note: 'Bring laptop' },
    10: { id: 'f-10', slotNumber: 10, subjectCode: 'COURSE101-LAB', subjectName: 'Course 1 Lab', faculty: 'Teacher 1', venue: 'Lab 1', type: 'Lab', bringLaptop: true, note: 'Bring laptop' },
  },
  Saturday: {},
  Sunday: {},
};

export const INITIAL_GROUPS: MonitoredWhatsAppGroup[] = [];

export const INITIAL_ACRONYMS: LearnedAcronym[] = [
  { id: 'ac-1', term: 'ML', meaning: 'Course 1 (COURSE101)', category: 'Subject', confidence: 0.99, detectedFrom: 'ML quiz tmr slot5', learnedAt: '2026-07-28' },
  { id: 'ac-2', term: 'CN', meaning: 'Course 2 (COURSE102)', category: 'Subject', confidence: 0.98, detectedFrom: 'cn cls room changed', learnedAt: '2026-07-28' },
  { id: 'ac-3', term: 'TOC', meaning: 'Course 3 (COURSE103)', category: 'Subject', confidence: 0.97, detectedFrom: 'TOC cls shifted slot6', learnedAt: '2026-07-28' },
  { id: 'ac-4', term: 'Room3', meaning: 'Room 3 Hall', category: 'Venue', confidence: 0.95, detectedFrom: 'Room 3 Hall slot8', learnedAt: '2026-07-28' },
  { id: 'ac-5', term: 'PE1', meaning: 'Professional Elective 1 (Blockchain COURSE105)', category: 'Subject', confidence: 0.96, detectedFrom: 'PE1 class slot3', learnedAt: '2026-07-28' },
  { id: 'ac-5b', term: 'PE2', meaning: 'Professional Elective 2 (Course 6 COURSE106)', category: 'Subject', confidence: 0.96, detectedFrom: 'PE2 class slot8', learnedAt: '2026-07-28' },
  { id: 'ac-6', term: 'tmr / 2MORROW', meaning: 'tomorrow', category: 'Slang', confidence: 1.0, detectedFrom: 'English Slangs Guide', learnedAt: '2026-07-28' },
  { id: 'ac-7', term: 'tdy / 2DAY', meaning: 'today', category: 'Slang', confidence: 1.0, detectedFrom: 'English Slangs Guide', learnedAt: '2026-07-28' },
  { id: 'ac-8', term: 'cls', meaning: 'class', category: 'Slang', confidence: 1.0, detectedFrom: 'English Slangs Guide', learnedAt: '2026-07-28' },
  { id: 'ac-9', term: 'eval', meaning: 'evaluation', category: 'Slang', confidence: 1.0, detectedFrom: 'English Slangs Guide', learnedAt: '2026-07-28' },
  { id: 'ac-10', term: 'mid', meaning: 'mid semester examination', category: 'Slang', confidence: 1.0, detectedFrom: 'English Slangs Guide', learnedAt: '2026-07-28' },
  { id: 'ac-11', term: 'LOL', meaning: 'laugh out loud', category: 'Slang', confidence: 1.0, detectedFrom: 'Texting Shortcuts', learnedAt: '2026-07-29' },
  { id: 'ac-12', term: 'OMG', meaning: 'Oh my God', category: 'Slang', confidence: 1.0, detectedFrom: 'Texting Shortcuts', learnedAt: '2026-07-29' },
  { id: 'ac-13', term: 'IDK', meaning: 'I Don\'t Know', category: 'Slang', confidence: 1.0, detectedFrom: 'Texting Shortcuts', learnedAt: '2026-07-29' },
  { id: 'ac-14', term: 'IDC', meaning: 'I Don\'t Care', category: 'Slang', confidence: 1.0, detectedFrom: 'Texting Shortcuts', learnedAt: '2026-07-29' },
  { id: 'ac-15', term: 'TTYL', meaning: 'Talk To You Later', category: 'Slang', confidence: 1.0, detectedFrom: 'Texting Shortcuts', learnedAt: '2026-07-29' },
  { id: 'ac-16', term: 'BTW', meaning: 'By The Way', category: 'Slang', confidence: 1.0, detectedFrom: 'Texting Shortcuts', learnedAt: '2026-07-29' },
  { id: 'ac-17', term: 'FYI', meaning: 'For Your Information', category: 'Slang', confidence: 1.0, detectedFrom: 'Texting Shortcuts', learnedAt: '2026-07-29' },
  { id: 'ac-18', term: 'ASAP', meaning: 'As Soon As Possible', category: 'Slang', confidence: 1.0, detectedFrom: 'Texting Shortcuts', learnedAt: '2026-07-29' },
  { id: 'ac-19', term: 'TBH', meaning: 'To Be Honest', category: 'Slang', confidence: 1.0, detectedFrom: 'Texting Shortcuts', learnedAt: '2026-07-29' },
  { id: 'ac-20', term: 'NVM', meaning: 'Never Mind', category: 'Slang', confidence: 1.0, detectedFrom: 'Texting Shortcuts', learnedAt: '2026-07-29' },
  { id: 'ac-21', term: 'NP', meaning: 'No Problem', category: 'Slang', confidence: 1.0, detectedFrom: 'Texting Shortcuts', learnedAt: '2026-07-29' },
  { id: 'ac-22', term: 'TY / THX', meaning: 'Thank You / Thanks', category: 'Slang', confidence: 1.0, detectedFrom: 'Texting Shortcuts', learnedAt: '2026-07-29' },
  { id: 'ac-23', term: 'YW', meaning: 'You\'re Welcome', category: 'Slang', confidence: 1.0, detectedFrom: 'Texting Shortcuts', learnedAt: '2026-07-29' },
  { id: 'ac-24', term: 'GN / G9', meaning: 'Good Night', category: 'Slang', confidence: 1.0, detectedFrom: 'SMS English', learnedAt: '2026-07-29' },
  { id: 'ac-25', term: 'GM', meaning: 'Good Morning', category: 'Slang', confidence: 1.0, detectedFrom: 'SMS English', learnedAt: '2026-07-29' },
  { id: 'ac-26', term: 'PLS / PLZ', meaning: 'Please', category: 'Slang', confidence: 1.0, detectedFrom: 'SMS English', learnedAt: '2026-07-29' },
  { id: 'ac-27', term: 'B4', meaning: 'Before', category: 'Slang', confidence: 1.0, detectedFrom: 'SMS English', learnedAt: '2026-07-29' },
  { id: 'ac-28', term: 'L8R / L8r', meaning: 'Later', category: 'Slang', confidence: 1.0, detectedFrom: 'SMS English', learnedAt: '2026-07-29' },
  { id: 'ac-29', term: 'BRB', meaning: 'Be Right Back', category: 'Slang', confidence: 1.0, detectedFrom: 'Texting Shortcuts', learnedAt: '2026-07-29' },
  { id: 'ac-30', term: 'BFF', meaning: 'Best Friends Forever', category: 'Slang', confidence: 1.0, detectedFrom: 'Texting Shortcuts', learnedAt: '2026-07-29' },
  { id: 'ac-31', term: 'HBD', meaning: 'Happy Birthday', category: 'Slang', confidence: 1.0, detectedFrom: 'Texting Shortcuts', learnedAt: '2026-07-29' },
  { id: 'ac-32', term: 'HRU', meaning: 'How are you?', category: 'Slang', confidence: 1.0, detectedFrom: 'SMS English', learnedAt: '2026-07-29' },
  { id: 'ac-33', term: 'RUOK', meaning: 'Are you OK?', category: 'Slang', confidence: 1.0, detectedFrom: 'SMS English', learnedAt: '2026-07-29' },
  { id: 'ac-34', term: 'INFO', meaning: 'Information', category: 'Slang', confidence: 1.0, detectedFrom: 'SMS English', learnedAt: '2026-07-29' },
];

export const INITIAL_ANNOUNCEMENTS: CollegeAnnouncement[] = [];

export const INITIAL_REMINDERS: ScheduledReminder[] = [];

export const INITIAL_CALENDAR_EVENTS: CalendarEvent[] = [];
