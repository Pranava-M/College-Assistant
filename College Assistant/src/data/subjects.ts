/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Master list of course subjects, codes, and faculty for B.Tech CSE Sem V,
 * used by the "Lecture Names" page and shared with the AI parser's grounding
 * reference in server.ts (keep both in sync if a subject changes).
 */

export interface CourseSubject {
  code: string;
  shortName: string;
  fullName: string;
  faculty: string;
  venue?: string;
  type: 'Theory' | 'Lab' | 'PE' | 'CIR' | 'Mentoring';
}

export const COURSE_SUBJECTS: CourseSubject[] = [
  {
    code: 'COURSE101',
    shortName: 'ML',
    fullName: 'Course 1',
    faculty: 'Teacher 1',
    type: 'Theory',
  },
  {
    code: 'COURSE102',
    shortName: 'CN',
    fullName: 'Course 2',
    faculty: 'Teacher 2',
    type: 'Theory',
  },
  {
    code: 'COURSE103',
    shortName: 'TOC',
    fullName: 'Course 3',
    faculty: 'Teacher 3',
    type: 'Theory',
  },
  {
    code: 'COURSE104',
    shortName: 'ES',
    fullName: 'Course 4',
    faculty: 'Teacher 4',
    type: 'Theory',
  },
  {
    code: 'COURSE105',
    shortName: 'PE1',
    fullName: 'Course 5',
    faculty: 'Teacher 5',
    venue: 'Room 3 / Room 2',
    type: 'PE',
  },
  {
    code: 'COURSE106',
    shortName: 'PE2',
    fullName: 'Course 6',
    faculty: 'Teacher 6',
    venue: 'Room 4',
    type: 'PE',
  },
  {
    code: 'CIR',
    shortName: 'CIR',
    fullName: 'Career Readiness Skills',
    faculty: 'Placement Cell',
    type: 'CIR',
  },
  {
    code: 'COURSE107',
    shortName: 'ENV',
    fullName: 'Course 7',
    faculty: 'TBD',
    type: 'Theory',
  },
];

export function findSubjectByShortName(short: string): CourseSubject | undefined {
  return COURSE_SUBJECTS.find((s) => s.shortName.toLowerCase() === short.toLowerCase());
}
