/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Course, Student } from '../../types';
import { StorageService, subscribeToSync } from '../../services/storage';
import { 
  Users, 
  UserPlus, 
  UploadCloud, 
  Download, 
  Trash2, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2,
  FileText
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface RosterManagerProps {
  course: Course;
}

export const RosterManager: React.FC<RosterManagerProps> = ({ course }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);

  // Manual Add Form State
  const [fullName, setFullName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [email, setEmail] = useState('');

  // CSV State
  const [csvRawText, setCsvRawText] = useState('');
  const [csvError, setCsvError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadStudents = useCallback(() => {
    setStudents(StorageService.getStudents(course.id));
  }, [course.id]);

  useEffect(() => {
    loadStudents();
    const unsubscribe = subscribeToSync((event) => {
      if (event.type === 'STUDENT_ENROLLED') {
        loadStudents();
      }
    });
    return unsubscribe;
  }, [loadStudents]);

  // Handle Manual Add
  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !studentId.trim() || !email.trim()) return;

    const newStudent: Student = {
      id: `stu-${Date.now()}`,
      studentId: studentId.trim().toUpperCase(),
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      courseId: course.id,
      enrolledAt: new Date().toISOString(),
    };

    StorageService.saveStudent(newStudent);
    setShowAddModal(false);
    setFullName('');
    setStudentId('');
    setEmail('');
    loadStudents();
    confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 } });
  };

  // Handle CSV File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvRawText(text);
    };
    reader.readAsText(file);
  };

  // Parse and import CSV
  const handleProcessCsv = () => {
    try {
      setCsvError(null);
      const lines = csvRawText.trim().split('\n');
      if (lines.length < 2) {
        setCsvError('CSV must contain a header row and at least one student row.');
        return;
      }

      const newStudents: Student[] = [];
      // Skip header row
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
        if (cols.length >= 3) {
          const [sId, name, mail] = cols;
          newStudents.push({
            id: `stu-${Date.now()}-${i}`,
            studentId: sId.toUpperCase(),
            fullName: name,
            email: mail.toLowerCase(),
            courseId: course.id,
            enrolledAt: new Date().toISOString(),
          });
        }
      }

      if (newStudents.length === 0) {
        setCsvError('No valid students parsed from CSV. Expected columns: StudentID, FullName, Email');
        return;
      }

      StorageService.saveStudentsBatch(newStudents);
      setShowCsvModal(false);
      setCsvRawText('');
      loadStudents();
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    } catch (err: unknown) {
      setCsvError('Failed to parse CSV format. Please verify standard comma separation.');
    }
  };

  // Download Sample CSV
  const handleDownloadTemplate = () => {
    const csvContent = 
      'data:text/csv;charset=utf-8,StudentID,FullName,Email\n' +
      'STU-9026,Diana Prince,diana.prince@university.edu\n' +
      'STU-9027,Liam Gallagher,liam.gallagher@university.edu\n' +
      'STU-9028,Aaliyah Khan,aaliyah.khan@university.edu\n';
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `roster_template_${course.code}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Actions */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Course Student Roster</h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage enrolled students and monitor client-side Google Blaze biometric registration status.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadTemplate}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV Template</span>
          </button>

          <button
            onClick={() => setShowCsvModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Import CSV</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* Roster Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th scope="col" className="px-6 py-3">Student Name</th>
                <th scope="col" className="px-6 py-3">Student ID</th>
                <th scope="col" className="px-6 py-3">Email</th>
                <th scope="col" className="px-6 py-3">Biometric Map Status</th>
                <th scope="col" className="px-6 py-3">Enrolled Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    No students currently in roster. Import via CSV or add a student above.
                  </td>
                </tr>
              ) : (
                students.map((student) => {
                  const hasBiometrics = !!student.faceDescriptor;

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 font-bold text-slate-700 flex items-center justify-center shrink-0">
                            {student.fullName.charAt(0)}
                          </div>
                          <span>{student.fullName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono font-medium text-slate-700 tabular-nums">
                        {student.studentId}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {student.email}
                      </td>
                      <td className="px-6 py-4">
                        {hasBiometrics ? (
                          <div className="inline-flex items-center gap-1.5 text-emerald-700 font-medium">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Registered ({student.faceDescriptor?.qualityScore}%)</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 text-amber-700">
                            <AlertCircle className="w-4 h-4 text-amber-500" />
                            <span>Pending Camera Setup</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-mono text-[11px] tabular-nums">
                        {new Date(student.enrolledAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full p-6">
            <h3 className="text-base font-bold text-slate-900 mb-1">Add Student to Roster</h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter student credentials for {course.code}.
            </p>

            <form onSubmit={handleAddStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jordan Hayes"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Student ID</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. STU-9030"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">University Email</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. jordan.hayes@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-2 text-xs text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                >
                  Enroll Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {showCsvModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-lg w-full p-6">
            <h3 className="text-base font-bold text-slate-900 mb-1">Import Roster via CSV</h3>
            <p className="text-xs text-slate-500 mb-4">
              Format: <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">StudentID, FullName, Email</code>
            </p>

            <div className="space-y-4">
              {/* File Upload Button */}
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  accept=".csv,text/csv"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 cursor-pointer underline"
                >
                  Choose a CSV File
                </button>
                <p className="text-[11px] text-slate-400 mt-1">or paste CSV text directly below</p>
              </div>

              {/* Raw CSV Textarea */}
              <div>
                <textarea
                  rows={5}
                  value={csvRawText}
                  onChange={(e) => setCsvRawText(e.target.value)}
                  placeholder="StudentID,FullName,Email&#10;STU-9026,Diana Prince,diana.prince@university.edu&#10;STU-9027,Liam Gallagher,liam.gallagher@university.edu"
                  className="w-full p-2.5 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {csvError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{csvError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCsvModal(false);
                    setCsvRawText('');
                    setCsvError(null);
                  }}
                  className="px-3 py-2 text-xs text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleProcessCsv}
                  disabled={!csvRawText.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm"
                >
                  Import Students
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
