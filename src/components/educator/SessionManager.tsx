/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Course, AttendanceSession, Student, AttendanceRecord } from '../../types';
import { StorageService, subscribeToSync } from '../../services/storage';
import { 
  Play, 
  StopCircle, 
  Clock, 
  CheckCircle2, 
  Users, 
  Sparkles, 
  Calendar,
  AlertTriangle,
  Plus
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface SessionManagerProps {
  course: Course;
  onSelectSessionForLedger: (sessionId: string) => void;
}

export const SessionManager: React.FC<SessionManagerProps> = ({
  course,
  onSelectSessionForLedger,
}) => {
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [activeSession, setActiveSession] = useState<AttendanceSession | undefined>(undefined);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [timeLeft, setTimeLeft] = useState<string>('--:--');

  // New session modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDuration, setNewDuration] = useState('15');
  const [newPasscode, setNewPasscode] = useState('');

  const loadData = useCallback(() => {
    const sess = StorageService.getSessions(course.id);
    const studs = StorageService.getStudents(course.id);
    const active = StorageService.getActiveSession(course.id);
    setSessions(sess);
    setStudents(studs);
    setActiveSession(active);

    if (active) {
      setRecords(StorageService.getAttendanceRecords(active.id));
    } else {
      setRecords([]);
    }
  }, [course.id]);

  useEffect(() => {
    loadData();
    const unsubscribe = subscribeToSync((event) => {
      if (
        event.type === 'SESSION_STATE_CHANGED' ||
        event.type === 'ATTENDANCE_MARKED' ||
        event.type === 'STUDENT_ENROLLED'
      ) {
        loadData();
      }
    });
    return unsubscribe;
  }, [loadData]);

  // Session Countdown Timer
  useEffect(() => {
    if (!activeSession || activeSession.status !== 'active') {
      setTimeLeft('00:00');
      return;
    }

    const interval = setInterval(() => {
      const end = new Date(activeSession.endTime).getTime();
      const diff = Math.max(0, end - Date.now());
      if (diff <= 0) {
        setTimeLeft('00:00');
        loadData();
      } else {
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSession, loadData]);

  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    const duration = parseInt(newDuration, 10) || 15;
    const start = new Date();
    const end = new Date(start.getTime() + duration * 60000);

    const session: AttendanceSession = {
      id: `session-${Date.now()}`,
      courseId: course.id,
      title: newTitle.trim() || `Lecture Session ${sessions.length + 1}`,
      date: start.toISOString().split('T')[0],
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      durationMinutes: duration,
      status: 'active',
      passcode: newPasscode.trim() || undefined,
      createdAt: start.toISOString(),
    };

    StorageService.saveSession(session);
    setShowCreateModal(false);
    setNewTitle('');
    loadData();
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
  };

  const handleCloseSession = (sessionId: string) => {
    StorageService.closeSession(sessionId);
    loadData();
  };

  const presentCount = records.filter(r => r.status === 'present').length;
  const totalCount = students.length;
  const attendancePercent = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Active Session Spotlight Banner */}
      {activeSession ? (
        <div className="bg-white border-2 border-blue-500 rounded-xl p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping" />
                <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                  Live Attendance Window Active
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                {activeSession.title}
              </h2>
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-2">
                <span>Started {new Date(activeSession.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                <span aria-hidden="true">·</span>
                <span>Duration: {activeSession.durationMinutes} min</span>
                {activeSession.passcode && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>Passcode: <code className="font-mono font-bold bg-slate-100 px-1 py-0.5 rounded">{activeSession.passcode}</code></span>
                  </>
                )}
              </div>
            </div>

            {/* Countdown and Action */}
            <div className="flex items-center gap-6">
              <div className="text-right">
                <span className="text-xs text-slate-500 block">Session Countdown</span>
                <span className="font-mono text-3xl sm:text-4xl font-bold text-blue-600 tabular-nums">
                  {timeLeft}
                </span>
              </div>

              <button
                onClick={() => handleCloseSession(activeSession.id)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              >
                <StopCircle className="w-4 h-4" />
                <span>Close Window Now</span>
              </button>
            </div>
          </div>

          {/* Live Progress Bar & Quick Stats */}
          <div className="mt-6">
            <div className="flex items-center justify-between text-xs text-slate-700 mb-2">
              <span className="font-semibold">
                Live Attendance: {presentCount} of {totalCount} Students Present ({attendancePercent}%)
              </span>
              <button
                onClick={() => onSelectSessionForLedger(activeSession.id)}
                className="text-blue-600 hover:text-blue-800 font-medium underline"
              >
                Open Full Attendance Ledger →
              </button>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 h-full transition-all duration-500"
                style={{ width: `${attendancePercent}%` }}
              />
            </div>
          </div>

          {/* Real-time Student Check-in Feed */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Live Check-In Feed (Google Blaze Landmarks)
            </h3>
            {records.length === 0 ? (
              <p className="text-xs text-slate-400 italic">
                Awaiting student biometric check-ins via camera...
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {records.slice(0, 6).map((rec) => {
                  const student = students.find(s => s.id === rec.studentId);
                  return (
                    <div
                      key={rec.id}
                      className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-semibold text-slate-900 block">{student?.fullName || rec.studentId}</span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {new Date(rec.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        ✓ Present
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
            <Clock className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-1">No Active Attendance Session</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-6">
            Launch a time-scoped session when lecture begins. Students can check in on their device cameras with active blink and head turn verification.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Play className="w-4 h-4" />
            <span>Launch New Timed Session</span>
          </button>
        </div>
      )}

      {/* Past Sessions List */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Lecture Session History</h3>
            <p className="text-xs text-slate-500">All attendance sessions recorded for {course.code}</p>
          </div>
          {!activeSession && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Session</span>
            </button>
          )}
        </div>

        {sessions.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No past sessions logged.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {sessions.map((sess) => {
              const sessionRecords = StorageService.getAttendanceRecords(sess.id);
              const count = sessionRecords.filter(r => r.status === 'present').length;
              const isActive = sess.status === 'active';

              return (
                <div key={sess.id} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">{sess.title}</h4>
                      <span className="text-xs text-slate-400">·</span>
                      <span className="font-mono text-xs text-slate-500">{sess.date}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                      <span>Window: {sess.durationMinutes} min</span>
                      <span aria-hidden="true">·</span>
                      <span>Recorded: {count} of {totalCount} Students</span>
                      <span aria-hidden="true">·</span>
                      <span className={`font-semibold capitalize ${isActive ? 'text-blue-600' : 'text-slate-600'}`}>
                        {sess.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSelectSessionForLedger(sess.id)}
                      className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                    >
                      View Ledger & Notes
                    </button>
                    {isActive && (
                      <button
                        onClick={() => handleCloseSession(sess.id)}
                        className="px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      >
                        Close
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Session Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full p-6">
            <h3 className="text-base font-bold text-slate-900 mb-1">Launch New Attendance Session</h3>
            <p className="text-xs text-slate-500 mb-4">
              Students will have a time-scoped window to verify attendance using their camera.
            </p>

            <form onSubmit={handleCreateSession} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Session Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lecture 09: Convolutional Architectures"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Duration (Minutes)
                </label>
                <select
                  value={newDuration}
                  onChange={(e) => setNewDuration(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="5">5 Minutes (Quick Check-In)</option>
                  <option value="10">10 Minutes</option>
                  <option value="15">15 Minutes (Standard)</option>
                  <option value="30">30 Minutes</option>
                  <option value="60">60 Minutes (Full Lecture)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Optional Passcode (for kiosk security)
                </label>
                <input
                  type="text"
                  placeholder="e.g. CV2026"
                  value={newPasscode}
                  onChange={(e) => setNewPasscode(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-2 text-xs text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                >
                  Start Live Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
