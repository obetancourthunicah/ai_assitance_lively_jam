/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Student, AttendanceRecord, AttendanceSession } from '../../types';
import { StorageService, subscribeToSync } from '../../services/storage';
import { 
  CheckCircle2, 
  Clock, 
  XCircle, 
  AlertCircle, 
  MessageSquare, 
  ShieldCheck, 
  Calendar,
  Sparkles
} from 'lucide-react';

interface StudentHistoryProps {
  student: Student;
  courseId: string;
}

export const StudentHistory: React.FC<StudentHistoryProps> = ({ student, courseId }) => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);

  const loadData = useCallback(() => {
    const allSessions = StorageService.getSessions(courseId);
    const myRecords = StorageService.getStudentAttendanceHistory(student.id);
    setSessions(allSessions);
    setRecords(myRecords);
  }, [courseId, student.id]);

  useEffect(() => {
    loadData();
    // Real-time listener for educator notes or attendance updates
    const unsubscribe = subscribeToSync((event) => {
      if (
        event.type === 'ATTENDANCE_MARKED' || 
        event.type === 'NOTE_UPDATED' || 
        event.type === 'SESSION_STATE_CHANGED'
      ) {
        loadData();
      }
    });
    return unsubscribe;
  }, [loadData]);

  // Aggregate stats
  const totalSessions = sessions.length;
  const attendedCount = records.filter(r => r.status === 'present').length;
  const lateCount = records.filter(r => r.status === 'late').length;
  const attendanceRate = totalSessions > 0 ? Math.round(((attendedCount + lateCount * 0.5) / totalSessions) * 100) : 100;

  return (
    <div className="space-y-6">
      {/* Attendance Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <span className="text-xs text-slate-500 block mb-1">Attendance Rate</span>
          <span className="font-mono text-2xl font-bold text-slate-900 tabular-nums">
            {attendanceRate}%
          </span>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <span className="text-xs text-slate-500 block mb-1">Present</span>
          <span className="font-mono text-2xl font-bold text-emerald-600 tabular-nums">
            {attendedCount}
          </span>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <span className="text-xs text-slate-500 block mb-1">Late Marks</span>
          <span className="font-mono text-2xl font-bold text-amber-600 tabular-nums">
            {lateCount}
          </span>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <span className="text-xs text-slate-500 block mb-1">Total Lectures</span>
          <span className="font-mono text-2xl font-bold text-slate-900 tabular-nums">
            {totalSessions}
          </span>
        </div>
      </div>

      {/* Real-time Indicator banner */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Real-time educator sync active (BroadcastChannel)</span>
        </div>
        <span>{records.length} Records Logged</span>
      </div>

      {/* Attendance History Timeline / Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 sm:p-6 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Lecture Attendance Log</h2>
          <span className="text-xs text-slate-500">Sorted by most recent</span>
        </div>

        {sessions.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No sessions have been scheduled yet for this course.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {sessions.map((session) => {
              const record = records.find(r => r.sessionId === session.id);
              const isPresent = record?.status === 'present';
              const isLate = record?.status === 'late';
              const isAbsent = !record || record.status === 'absent';
              const isExcused = record?.status === 'excused';

              return (
                <div key={session.id} className="p-4 sm:p-6 hover:bg-slate-50/50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900">{session.title}</h3>
                        <span className="text-xs text-slate-400">·</span>
                        <span className="font-mono text-xs text-slate-500">{session.date}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                        <span>Window: {session.durationMinutes}m</span>
                        <span aria-hidden="true">·</span>
                        <span>Status: <strong className="capitalize text-slate-700">{session.status}</strong></span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div>
                      {isPresent && (
                        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Present</span>
                        </div>
                      )}
                      {isLate && (
                        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Late</span>
                        </div>
                      )}
                      {isExcused && (
                        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Excused</span>
                        </div>
                      )}
                      {isAbsent && (
                        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Absent / Not Recorded</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Verification & Educator Remarks */}
                  {record && (
                    <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
                      <div className="flex items-center gap-3 text-slate-500">
                        <span>Recorded: <strong className="font-mono text-slate-700 tabular-nums">{new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></span>
                        <span aria-hidden="true">·</span>
                        <span>Mode: <strong className="text-slate-700">{record.markedBy === 'biometric' ? 'Google Blaze Landmark' : 'Manual Override'}</strong></span>
                        {record.livenessVerified && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-emerald-700 font-medium">✓ Anti-Spoof Liveness Verified</span>
                          </>
                        )}
                      </div>

                      {record.confidenceScore && (
                        <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                          Match: {Math.round(record.confidenceScore * 100)}%
                        </span>
                      )}
                    </div>
                  )}

                  {/* Educator Real-Time Comment Box */}
                  {record?.educatorNote && (
                    <div className="mt-3 p-3 bg-blue-50/70 border border-blue-100 rounded-lg text-xs text-blue-900 flex items-start gap-2.5">
                      <MessageSquare className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-blue-950 block">Educator Comment (Real-Time):</span>
                        <p className="text-blue-800 mt-0.5">{record.educatorNote}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
