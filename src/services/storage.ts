/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Course, Student, AttendanceSession, AttendanceRecord, Challenge, ChallengeSubmission } from '../types';

const STORAGE_KEYS = {
  COURSES: 'presencelive_courses',
  STUDENTS: 'presencelive_students',
  SESSIONS: 'presencelive_sessions',
  RECORDS: 'presencelive_records',
  CHALLENGES: 'presencelive_challenges',
  SUBMISSIONS: 'presencelive_submissions',
  ACTIVE_STUDENT_ID: 'presencelive_active_student_id',
  ACTIVE_COURSE_ID: 'presencelive_active_course_id',
  APP_ROLE: 'presencelive_current_role',
  EDUCATOR_AUTH: 'presencelive_educator_authenticated',
};

// HTML5 BroadcastChannel for cross-tab and cross-view instantaneous real-time sync
const broadcastChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window 
  ? new BroadcastChannel('presencelive_realtime_sync') 
  : null;

export type SyncEventType = 
  | 'ATTENDANCE_MARKED'
  | 'SESSION_STATE_CHANGED'
  | 'STUDENT_ENROLLED'
  | 'NOTE_UPDATED'
  | 'CHALLENGE_CREATED'
  | 'SUBMISSION_RECORDED'
  | 'STORAGE_RESET';

export interface SyncPayload {
  type: SyncEventType;
  payload?: unknown;
  timestamp: number;
}

export const broadcastSync = (type: SyncEventType, payload?: unknown) => {
  if (broadcastChannel) {
    broadcastChannel.postMessage({ type, payload, timestamp: Date.now() });
  }
  // Also dispatch window custom event for local tab listeners
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('presencelive_local_sync', { detail: { type, payload } }));
  }
};

export const subscribeToSync = (callback: (event: SyncPayload) => void) => {
  if (broadcastChannel) {
    const handleMessage = (e: MessageEvent) => callback(e.data as SyncPayload);
    broadcastChannel.addEventListener('message', handleMessage);
    
    // Also listen to local window events
    const handleLocal = (e: Event) => {
      const customEvent = e as CustomEvent;
      callback({ type: customEvent.detail.type, payload: customEvent.detail.payload, timestamp: Date.now() });
    };
    window.addEventListener('presencelive_local_sync', handleLocal);

    return () => {
      broadcastChannel.removeEventListener('message', handleMessage);
      window.removeEventListener('presencelive_local_sync', handleLocal);
    };
  }
  return () => {};
};

// Helper for local storage read/write
function getItem<T>(key: string, defaultValue: T): T {
  try {
    const val = localStorage.getItem(key);
    if (!val) return defaultValue;
    return JSON.parse(val) as T;
  } catch (err) {
    console.error(`Error reading ${key} from storage:`, err);
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error writing ${key} to storage:`, err);
  }
}

// Default Seed Data
const DEFAULT_COURSE: Course = {
  id: 'course-cs304',
  code: 'CS-304',
  name: 'Machine Vision & Biometric Systems',
  term: 'Fall 2026',
  description: 'In-depth study of computer vision, real-time edge landmark processing, facial biometric mapping, and cryptographic anti-spoofing verification.',
  createdAt: new Date().toISOString(),
};

const DEFAULT_STUDENTS: Student[] = [
  {
    id: 'stu-01',
    studentId: 'STU-9021',
    fullName: 'Alex Vance',
    email: 'alex.vance@university.edu',
    courseId: 'course-cs304',
    enrolledAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    // Pre-computed normalized mock vector so demo testing works out-of-the-box
    faceDescriptor: {
      vector: [0.12, 0.45, 0.78, 0.23, 0.56, 0.89, 0.34, 0.67, 0.11, 0.44, 0.77, 0.22, 0.55, 0.88, 0.33, 0.66, 0.99, 0.15, 0.48, 0.81, 0.25, 0.58, 0.91, 0.35, 0.68, 0.13, 0.46, 0.79, 0.24, 0.57],
      registeredAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      sampleCount: 5,
      qualityScore: 98,
    }
  },
  {
    id: 'stu-02',
    studentId: 'STU-9022',
    fullName: 'Elena Rostova',
    email: 'elena.rostova@university.edu',
    courseId: 'course-cs304',
    enrolledAt: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: 'stu-03',
    studentId: 'STU-9023',
    fullName: 'Marcus Chen',
    email: 'marcus.chen@university.edu',
    courseId: 'course-cs304',
    enrolledAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    faceDescriptor: {
      vector: [0.31, 0.52, 0.19, 0.88, 0.42, 0.17, 0.63, 0.91, 0.28, 0.74, 0.33, 0.61, 0.84, 0.15, 0.59, 0.92, 0.27, 0.71, 0.38, 0.64, 0.82, 0.19, 0.53, 0.95, 0.21, 0.76, 0.34, 0.67, 0.89, 0.12],
      registeredAt: new Date(Date.now() - 86400000 * 1).toISOString(),
      sampleCount: 5,
      qualityScore: 95,
    }
  },
  {
    id: 'stu-04',
    studentId: 'STU-9024',
    fullName: 'Sophia Patel',
    email: 'sophia.patel@university.edu',
    courseId: 'course-cs304',
    enrolledAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'stu-05',
    studentId: 'STU-9025',
    fullName: 'Lucas Becker',
    email: 'lucas.becker@university.edu',
    courseId: 'course-cs304',
    enrolledAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  }
];

// Active timed session initialized with 20 minutes remaining
const now = new Date();
const sessionStart = new Date(now.getTime() - 5 * 60000);
const sessionEnd = new Date(now.getTime() + 15 * 60000);

const DEFAULT_SESSIONS: AttendanceSession[] = [
  {
    id: 'session-01',
    courseId: 'course-cs304',
    title: 'Lecture 08: Deep Landmark Extraction & Liveness Invariants',
    date: now.toISOString().split('T')[0],
    startTime: sessionStart.toISOString(),
    endTime: sessionEnd.toISOString(),
    durationMinutes: 20,
    status: 'active',
    passcode: 'CV2026',
    createdAt: sessionStart.toISOString(),
  },
  {
    id: 'session-00',
    courseId: 'course-cs304',
    title: 'Lecture 07: Spatial Affine Transforms and Mesh Triangulation',
    date: new Date(now.getTime() - 86400000 * 2).toISOString().split('T')[0],
    startTime: new Date(now.getTime() - 86400000 * 2).toISOString(),
    endTime: new Date(now.getTime() - 86400000 * 2 + 3600000).toISOString(),
    durationMinutes: 60,
    status: 'closed',
    createdAt: new Date(now.getTime() - 86400000 * 2).toISOString(),
  }
];

const DEFAULT_RECORDS: AttendanceRecord[] = [
  {
    id: 'rec-01',
    sessionId: 'session-00',
    studentId: 'stu-01',
    status: 'present',
    timestamp: new Date(now.getTime() - 86400000 * 2 + 300000).toISOString(),
    confidenceScore: 0.97,
    livenessVerified: true,
    markedBy: 'biometric',
    educatorNote: 'Great punctuality and active participation.',
  },
  {
    id: 'rec-02',
    sessionId: 'session-00',
    studentId: 'stu-03',
    status: 'present',
    timestamp: new Date(now.getTime() - 86400000 * 2 + 420000).toISOString(),
    confidenceScore: 0.94,
    livenessVerified: true,
    markedBy: 'biometric',
    educatorNote: 'Arrived on time.',
  },
  {
    id: 'rec-03',
    sessionId: 'session-00',
    studentId: 'stu-02',
    status: 'late',
    timestamp: new Date(now.getTime() - 86400000 * 2 + 1800000).toISOString(),
    confidenceScore: 1.0,
    livenessVerified: false,
    markedBy: 'educator',
    educatorNote: 'Notified delayed transit via email. Marked late manually.',
  }
];

const DEFAULT_CHALLENGES: Challenge[] = [
  {
    id: 'chal-01',
    courseId: 'course-cs304',
    sessionId: 'session-01',
    title: 'Session Challenge: Eye Aspect Ratio (EAR) Thresholds',
    question: 'Explain why EAR drops below 0.2 during a genuine blink, and how combining horizontal yaw checks prevents 2D photograph spoofing.',
    dueBeforeDate: new Date(now.getTime() + 86400000 * 2).toISOString(),
    createdAt: new Date().toISOString(),
  }
];

const DEFAULT_SUBMISSIONS: ChallengeSubmission[] = [
  {
    id: 'sub-01',
    challengeId: 'chal-01',
    studentId: 'stu-01',
    answer: 'EAR measures vertical eyelid distance divided by horizontal width. When eyes close during a blink, vertical distance approaches zero, dropping the ratio below 0.2. A printed 2D photograph has invariant yaw and zero eyelid motion, so checking both EAR dynamics and head yaw angular variation guarantees 3D physical presence.',
    submittedAt: new Date(now.getTime() - 3600000).toISOString(),
    educatorFeedback: 'Accurate and comprehensive explanation. Full marks.',
    grade: '100%',
  }
];

// Initialize Storage if empty
export function initStorage(): void {
  if (!localStorage.getItem(STORAGE_KEYS.COURSES)) {
    setItem(STORAGE_KEYS.COURSES, [DEFAULT_COURSE]);
  }
  if (!localStorage.getItem(STORAGE_KEYS.STUDENTS)) {
    setItem(STORAGE_KEYS.STUDENTS, DEFAULT_STUDENTS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.SESSIONS)) {
    setItem(STORAGE_KEYS.SESSIONS, DEFAULT_SESSIONS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.RECORDS)) {
    setItem(STORAGE_KEYS.RECORDS, DEFAULT_RECORDS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.CHALLENGES)) {
    setItem(STORAGE_KEYS.CHALLENGES, DEFAULT_CHALLENGES);
  }
  if (!localStorage.getItem(STORAGE_KEYS.SUBMISSIONS)) {
    setItem(STORAGE_KEYS.SUBMISSIONS, DEFAULT_SUBMISSIONS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.ACTIVE_COURSE_ID)) {
    setItem(STORAGE_KEYS.ACTIVE_COURSE_ID, DEFAULT_COURSE.id);
  }
  if (!localStorage.getItem(STORAGE_KEYS.ACTIVE_STUDENT_ID)) {
    setItem(STORAGE_KEYS.ACTIVE_STUDENT_ID, DEFAULT_STUDENTS[0].id);
  }
}

// Storage API
export const StorageService = {
  // Courses
  getCourses: (): Course[] => getItem(STORAGE_KEYS.COURSES, [DEFAULT_COURSE]),
  saveCourse: (course: Course): void => {
    const courses = StorageService.getCourses();
    const idx = courses.findIndex(c => c.id === course.id);
    if (idx >= 0) courses[idx] = course;
    else courses.unshift(course);
    setItem(STORAGE_KEYS.COURSES, courses);
    broadcastSync('SESSION_STATE_CHANGED', course);
  },
  getActiveCourseId: (): string => getItem(STORAGE_KEYS.ACTIVE_COURSE_ID, DEFAULT_COURSE.id),
  setActiveCourseId: (id: string): void => {
    setItem(STORAGE_KEYS.ACTIVE_COURSE_ID, id);
    broadcastSync('SESSION_STATE_CHANGED', { activeCourseId: id });
  },

  // Students
  getStudents: (courseId?: string): Student[] => {
    const students = getItem(STORAGE_KEYS.STUDENTS, DEFAULT_STUDENTS);
    if (!courseId) return students;
    return students.filter(s => s.courseId === courseId);
  },
  getStudentById: (id: string): Student | undefined => {
    const students = StorageService.getStudents();
    return students.find(s => s.id === id || s.studentId === id);
  },
  saveStudent: (student: Student): void => {
    const students = getItem(STORAGE_KEYS.STUDENTS, DEFAULT_STUDENTS);
    const idx = students.findIndex(s => s.id === student.id || s.studentId === student.studentId);
    if (idx >= 0) students[idx] = student;
    else students.push(student);
    setItem(STORAGE_KEYS.STUDENTS, students);
    broadcastSync('STUDENT_ENROLLED', student);
  },
  saveStudentsBatch: (newStudents: Student[]): void => {
    const students = getItem(STORAGE_KEYS.STUDENTS, DEFAULT_STUDENTS);
    for (const student of newStudents) {
      const idx = students.findIndex(s => s.studentId === student.studentId && s.courseId === student.courseId);
      if (idx >= 0) students[idx] = student;
      else students.push(student);
    }
    setItem(STORAGE_KEYS.STUDENTS, students);
    broadcastSync('STUDENT_ENROLLED', newStudents);
  },
  getActiveStudentId: (): string => getItem(STORAGE_KEYS.ACTIVE_STUDENT_ID, DEFAULT_STUDENTS[0].id),
  setActiveStudentId: (id: string): void => {
    setItem(STORAGE_KEYS.ACTIVE_STUDENT_ID, id);
    broadcastSync('STUDENT_ENROLLED', { activeStudentId: id });
  },

  // Sessions
  getSessions: (courseId?: string): AttendanceSession[] => {
    const sessions = getItem(STORAGE_KEYS.SESSIONS, DEFAULT_SESSIONS);
    if (!courseId) return sessions;
    return sessions.filter(s => s.courseId === courseId);
  },
  getActiveSession: (courseId: string): AttendanceSession | undefined => {
    const sessions = StorageService.getSessions(courseId);
    const nowTime = new Date().getTime();
    return sessions.find(s => {
      if (s.status !== 'active') return false;
      const end = new Date(s.endTime).getTime();
      return nowTime <= end;
    });
  },
  saveSession: (session: AttendanceSession): void => {
    const sessions = StorageService.getSessions();
    const idx = sessions.findIndex(s => s.id === session.id);
    if (idx >= 0) sessions[idx] = session;
    else sessions.unshift(session);
    setItem(STORAGE_KEYS.SESSIONS, sessions);
    broadcastSync('SESSION_STATE_CHANGED', session);
  },
  closeSession: (sessionId: string): void => {
    const sessions = StorageService.getSessions();
    const idx = sessions.findIndex(s => s.id === sessionId);
    if (idx >= 0) {
      sessions[idx].status = 'closed';
      sessions[idx].endTime = new Date().toISOString();
      setItem(STORAGE_KEYS.SESSIONS, sessions);
      broadcastSync('SESSION_STATE_CHANGED', sessions[idx]);
    }
  },

  // Attendance Records
  getAttendanceRecords: (sessionId?: string): AttendanceRecord[] => {
    const records = getItem(STORAGE_KEYS.RECORDS, DEFAULT_RECORDS);
    if (!sessionId) return records;
    return records.filter(r => r.sessionId === sessionId);
  },
  getStudentAttendanceHistory: (studentId: string): AttendanceRecord[] => {
    const records = getItem(STORAGE_KEYS.RECORDS, DEFAULT_RECORDS);
    return records.filter(r => r.studentId === studentId);
  },
  saveAttendanceRecord: (record: AttendanceRecord): void => {
    const records = getItem(STORAGE_KEYS.RECORDS, DEFAULT_RECORDS);
    const idx = records.findIndex(r => r.sessionId === record.sessionId && r.studentId === record.studentId);
    if (idx >= 0) records[idx] = record;
    else records.unshift(record);
    setItem(STORAGE_KEYS.RECORDS, records);
    broadcastSync('ATTENDANCE_MARKED', record);
  },
  updateRecordNote: (recordId: string, educatorNote: string): void => {
    const records = getItem(STORAGE_KEYS.RECORDS, DEFAULT_RECORDS);
    const idx = records.findIndex(r => r.id === recordId);
    if (idx >= 0) {
      records[idx].educatorNote = educatorNote;
      setItem(STORAGE_KEYS.RECORDS, records);
      broadcastSync('NOTE_UPDATED', records[idx]);
    }
  },

  // Challenges
  getChallenges: (courseId?: string): Challenge[] => {
    const challenges = getItem(STORAGE_KEYS.CHALLENGES, DEFAULT_CHALLENGES);
    if (!courseId) return challenges;
    return challenges.filter(c => c.courseId === courseId);
  },
  saveChallenge: (challenge: Challenge): void => {
    const challenges = getItem(STORAGE_KEYS.CHALLENGES, DEFAULT_CHALLENGES);
    const idx = challenges.findIndex(c => c.id === challenge.id);
    if (idx >= 0) challenges[idx] = challenge;
    else challenges.unshift(challenge);
    setItem(STORAGE_KEYS.CHALLENGES, challenges);
    broadcastSync('CHALLENGE_CREATED', challenge);
  },
  getSubmissions: (challengeId?: string): ChallengeSubmission[] => {
    const subs = getItem(STORAGE_KEYS.SUBMISSIONS, DEFAULT_SUBMISSIONS);
    if (!challengeId) return subs;
    return subs.filter(s => s.challengeId === challengeId);
  },
  saveSubmission: (sub: ChallengeSubmission): void => {
    const subs = getItem(STORAGE_KEYS.SUBMISSIONS, DEFAULT_SUBMISSIONS);
    const idx = subs.findIndex(s => s.challengeId === sub.challengeId && s.studentId === sub.studentId);
    if (idx >= 0) subs[idx] = sub;
    else subs.unshift(sub);
    setItem(STORAGE_KEYS.SUBMISSIONS, subs);
    broadcastSync('SUBMISSION_RECORDED', sub);
  },
  gradeSubmission: (submissionId: string, grade: string, feedback: string): void => {
    const subs = getItem(STORAGE_KEYS.SUBMISSIONS, DEFAULT_SUBMISSIONS);
    const idx = subs.findIndex(s => s.id === submissionId);
    if (idx >= 0) {
      subs[idx].grade = grade;
      subs[idx].educatorFeedback = feedback;
      setItem(STORAGE_KEYS.SUBMISSIONS, subs);
      broadcastSync('SUBMISSION_RECORDED', subs[idx]);
    }
  },

  // Educator authentication
  isEducatorAuthenticated: (): boolean => {
    return getItem(STORAGE_KEYS.EDUCATOR_AUTH, false);
  },
  setEducatorAuthenticated: (auth: boolean): void => {
    setItem(STORAGE_KEYS.EDUCATOR_AUTH, auth);
  },

  // Export / Import
  exportAllData: (): string => {
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      courses: StorageService.getCourses(),
      students: getItem(STORAGE_KEYS.STUDENTS, DEFAULT_STUDENTS),
      sessions: StorageService.getSessions(),
      records: getItem(STORAGE_KEYS.RECORDS, DEFAULT_RECORDS),
      challenges: getItem(STORAGE_KEYS.CHALLENGES, DEFAULT_CHALLENGES),
      submissions: getItem(STORAGE_KEYS.SUBMISSIONS, DEFAULT_SUBMISSIONS),
    };
    return JSON.stringify(data, null, 2);
  },
  importAllData: (jsonData: string): boolean => {
    try {
      const data = JSON.parse(jsonData);
      if (data.courses) setItem(STORAGE_KEYS.COURSES, data.courses);
      if (data.students) setItem(STORAGE_KEYS.STUDENTS, data.students);
      if (data.sessions) setItem(STORAGE_KEYS.SESSIONS, data.sessions);
      if (data.records) setItem(STORAGE_KEYS.RECORDS, data.records);
      if (data.challenges) setItem(STORAGE_KEYS.CHALLENGES, data.challenges);
      if (data.submissions) setItem(STORAGE_KEYS.SUBMISSIONS, data.submissions);
      broadcastSync('STORAGE_RESET');
      return true;
    } catch (e) {
      console.error('Import failed', e);
      return false;
    }
  },
  resetToDemo: (): void => {
    localStorage.removeItem(STORAGE_KEYS.COURSES);
    localStorage.removeItem(STORAGE_KEYS.STUDENTS);
    localStorage.removeItem(STORAGE_KEYS.SESSIONS);
    localStorage.removeItem(STORAGE_KEYS.RECORDS);
    localStorage.removeItem(STORAGE_KEYS.CHALLENGES);
    localStorage.removeItem(STORAGE_KEYS.SUBMISSIONS);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_COURSE_ID);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_STUDENT_ID);
    localStorage.removeItem(STORAGE_KEYS.EDUCATOR_AUTH);
    initStorage();
    broadcastSync('STORAGE_RESET');
  }
};
