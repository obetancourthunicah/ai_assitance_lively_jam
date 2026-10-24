/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type AppRole = 'gateway' | 'educator' | 'student';

export interface Course {
  id: string;
  code: string;
  name: string;
  term: string;
  description?: string;
  createdAt: string;
}

export interface Student {
  id: string;
  studentId: string;
  fullName: string;
  email: string;
  courseId: string;
  avatarUrl?: string;
  enrolledAt: string;
  faceDescriptor?: BiometricFaceDescriptor;
}

export interface BiometricFaceDescriptor {
  vector: number[]; // normalized 30-dim facial feature distance vector
  registeredAt: string;
  sampleCount: number;
  qualityScore: number; // 0 to 100
}

export type SessionStatus = 'scheduled' | 'active' | 'closed';

export interface AttendanceSession {
  id: string;
  courseId: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string; // ISO string or HH:mm
  endTime: string;
  durationMinutes: number;
  status: SessionStatus;
  passcode?: string;
  createdAt: string;
}

export type AttendanceStatus = 'present' | 'late' | 'absent' | 'excused';

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  studentId: string;
  status: AttendanceStatus;
  timestamp: string;
  confidenceScore: number; // 0 to 1
  livenessVerified: boolean;
  markedBy: 'biometric' | 'educator';
  educatorNote?: string;
}

export interface Challenge {
  id: string;
  courseId: string;
  sessionId?: string;
  title: string;
  question: string;
  dueBeforeDate: string;
  createdAt: string;
}

export interface ChallengeSubmission {
  id: string;
  challengeId: string;
  studentId: string;
  answer: string;
  submittedAt: string;
  educatorFeedback?: string;
  grade?: string;
}

export type LivenessStage = 
  | 'idle'
  | 'detecting'
  | 'align_center'
  | 'blink'
  | 'turn_head'
  | 'verifying'
  | 'completed'
  | 'failed';

export interface LivenessState {
  stage: LivenessStage;
  message: string;
  progress: number; // 0 - 100
  ear: number; // Eye Aspect Ratio
  yaw: number; // Head rotation angle in degrees
  faceDetected: boolean;
}
