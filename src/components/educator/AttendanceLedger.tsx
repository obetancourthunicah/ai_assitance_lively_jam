/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Course, AttendanceSession, Student, AttendanceRecord, AttendanceStatus } from '../../types';
import { StorageService, subscribeToSync } from '../../services/storage';
import { 
  CheckCircle2, 
  Clock, 
  XCircle, 
  AlertCircle, 
  Search, 
  MessageSquare, 
  Download, 
  Filter,
  Check,
  Edit2
} from 'lucide-react';

interface AttendanceLedgerProps {
  course: Course;
  selectedSessionId?: string;
}

export const AttendanceLedger: React.FC<AttendanceLedgerProps> = ({
  course,
  selectedSessionId,
}) => {
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [students, setStudents] = useState<Student[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | AttendanceStatus>('all');

  // Note Modal
  const [activeNoteStudent, setActiveNoteStudent] = useState<{ student: Student; record?: AttendanceRecord } | null>(null);
  const [noteContent, setNoteContent] = useState('');

  const loadData = useCallback(() => {
    const sess = StorageService.getSessions(course.id);
    const studs = StorageService.getStudents(course.id);
    setSessions(sess);
    setStudents(studs);

    const targetSessionId = selectedSessionId || (sess[0]?.id || '');
    setCurrentSessionId(targetSessionId);

    if (targetSessionId) {
      setRecords(StorageService.getAttendanceRecords(targetSessionId));
    }
  }, [course.id, selectedSessionId]);

  useEffect(() => {
    loadData();
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

  // Session selector change
  const handleSessionChange = (id: string) => {
    setCurrentSessionId(id);
    setRecords(StorageService.getAttendanceRecords(id));
  };

  // Toggle status manually
  const handleStatusChange = (studentId: string, newStatus: AttendanceStatus) => {
    if (!currentSessionId) return;

    const existing = records.find(r => r.studentId === studentId);
    const updatedRecord: AttendanceRecord = {
      id: existing?.id || `rec-${Date.now()}-${studentId}`,
      sessionId: currentSessionId,
      studentId,
      status: newStatus,
      timestamp: existing?.timestamp || new Date().toISOString(),
      confidenceScore: existing?.confidenceScore || 1.0,
      livenessVerified: existing?.livenessVerified || false,
      markedBy: 'educator',
      educatorNote: existing?.educatorNote,
    };

    StorageService.saveAttendanceRecord(updatedRecord);
    loadData();
  };

  // Open note editor
  const handleOpenNoteModal = (student: Student, record?: AttendanceRecord) => {
    setActiveNoteStudent({ student, record });
    setNoteContent(record?.educatorNote || '');
  };

  // Save note
  const handleSaveNote = () => {
    if (!activeNoteStudent || !currentSessionId) return;

    let targetRecord = activeNoteStudent.record;
    if (!targetRecord) {
      targetRecord = {
        id: `rec-${Date.now()}-${activeNoteStudent.student.id}`,
        sessionId: currentSessionId,
        studentId: activeNoteStudent.student.id,
        status: 'present',
        timestamp: new Date().toISOString(),
        confidenceScore: 1.0,
        livenessVerified: false,
        markedBy: 'educator',
      };
    }

    targetRecord.educatorNote = noteContent.trim() || undefined;
    StorageService.saveAttendanceRecord(targetRecord);
    setActiveNoteStudent(null);
    loadData();
  };

  // Export CSV
  const handleExportCSV = () => {
    const session = sessions.find(s => s.id === currentSessionId);
    if (!session) return;

    const rows = [
      ['Student ID', 'Full Name', 'Email', 'Session', 'Date', 'Status', 'Marked By', 'Confidence', 'Educator Note']
    ];

    students.forEach(s => {
      const rec = records.find(r => r.studentId === s.id);
      rows.push([
        s.studentId,
        `"${s.fullName}"`,
        s.email,
        `"${session.title}"`,
        session.date,
        rec?.status || 'absent',
        rec?.markedBy || 'none',
        rec ? `${Math.round(rec.confidenceScore * 100)}%` : 'N/A',
        `"${rec?.educatorNote || ''}"`
      ]);
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `attendance_${session.date}_${course.code}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter students
  const filteredStudents = students.filter(s => {
    const matchesSearch = 
      s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    if (statusFilter === 'all') return true;

    const rec = records.find(r => r.studentId === s.id);
    const recStatus = rec?.status || 'absent';
    return recStatus === statusFilter;
  });

  const activeSessionObj = sessions.find(s => s.id === currentSessionId);

  return (
    <div className="space-y-6">
      {/* Session Header & Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Viewing Session
          </label>
          <div className="flex items-center gap-3">
            <select
              value={currentSessionId}
              onChange={(e) => handleSessionChange(e.target.value)}
              className="text-sm font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {sessions.map(s => (
                <option key={s.id} value={s.id}>
                  {s.date} · {s.title} ({s.status})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            disabled={!currentSessionId}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Search and Status Segments */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by student name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Segmented Filter Control */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-medium self-stretch sm:self-auto overflow-x-auto">
          {(['all', 'present', 'late', 'absent', 'excused'] as const).map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-md capitalize transition-colors whitespace-nowrap cursor-pointer ${
                statusFilter === status
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th scope="col" className="px-6 py-3">Student</th>
                <th scope="col" className="px-6 py-3">Student ID</th>
                <th scope="col" className="px-6 py-3">Attendance Status</th>
                <th scope="col" className="px-6 py-3">Verification Details</th>
                <th scope="col" className="px-6 py-3">Educator Comments</th>
                <th scope="col" className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    No students match the current query or filter.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const record = records.find(r => r.studentId === student.id);
                  const status: AttendanceStatus = record?.status || 'absent';

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Name & Avatar */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 font-bold text-slate-700 flex items-center justify-center shrink-0">
                            {student.fullName.charAt(0)}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900 block">{student.fullName}</span>
                            <span className="text-slate-400">{student.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* ID */}
                      <td className="px-6 py-4 font-mono font-medium text-slate-700 tabular-nums">
                        {student.studentId}
                      </td>

                      {/* Status Toggle Selector */}
                      <td className="px-6 py-4">
                        <div className="inline-flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
                          {(['present', 'late', 'absent', 'excused'] as AttendanceStatus[]).map(s => {
                            const isSelected = status === s;
                            let activeClass = 'bg-white text-slate-900 shadow-xs font-semibold';
                            if (isSelected) {
                              if (s === 'present') activeClass = 'bg-emerald-600 text-white font-semibold';
                              if (s === 'late') activeClass = 'bg-amber-500 text-white font-semibold';
                              if (s === 'absent') activeClass = 'bg-rose-600 text-white font-semibold';
                              if (s === 'excused') activeClass = 'bg-blue-600 text-white font-semibold';
                            }

                            return (
                              <button
                                key={s}
                                onClick={() => handleStatusChange(student.id, s)}
                                className={`px-2 py-1 rounded text-[11px] capitalize transition-colors cursor-pointer ${
                                  isSelected ? activeClass : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                {s}
                              </button>
                            );
                          })}
                        </div>
                      </td>

                      {/* Verification Details */}
                      <td className="px-6 py-4 text-slate-600">
                        {record ? (
                          <div>
                            <span className="font-medium text-slate-800 block">
                              {record.markedBy === 'biometric' ? 'Google Blaze Landmark' : 'Manual Override'}
                            </span>
                            <div className="text-[11px] text-slate-400 font-mono tabular-nums">
                              {new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              {record.confidenceScore && ` · ${Math.round(record.confidenceScore * 100)}% match`}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Not checked in</span>
                        )}
                      </td>

                      {/* Educator Note */}
                      <td className="px-6 py-4">
                        {record?.educatorNote ? (
                          <div className="flex items-start gap-1.5 text-blue-800 bg-blue-50/70 p-2 rounded-md max-w-xs">
                            <MessageSquare className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                            <span className="truncate">{record.educatorNote}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">No remarks</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleOpenNoteModal(student, record)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                          title="Add or Edit Educator Remark"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Remark</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Educator Note Edit Modal */}
      {activeNoteStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full p-6">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Add Student Remark
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Write a comment for <strong className="text-slate-800">{activeNoteStudent.student.fullName}</strong>. This updates in real-time in the student&apos;s history log.
            </p>

            <textarea
              rows={4}
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="e.g. Arrived on time with exemplary biometric liveness verification."
              className="w-full p-3 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            />

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveNoteStudent(null)}
                className="px-3 py-2 text-xs text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveNote}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm"
              >
                Save Remark
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
