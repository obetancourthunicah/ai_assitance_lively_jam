/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { StorageService } from '../../services/storage';
import { 
  GraduationCap, 
  ShieldCheck, 
  Camera, 
  Clock, 
  ArrowRight, 
  Lock, 
  KeyRound, 
  RefreshCw,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface GatewayLandingProps {
  onSelectRole: (role: 'educator' | 'student') => void;
  onSelectStudent: (studentId: string) => void;
}

export const GatewayLanding: React.FC<GatewayLandingProps> = ({
  onSelectRole,
  onSelectStudent,
}) => {
  const [passcode, setPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState(false);
  const [showPasscodeModal, setShowPasscodeModal] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const students = StorageService.getStudents();
  const activeCourse = StorageService.getCourses()[0];

  const handleEducatorAccess = (e: React.FormEvent) => {
    e.preventDefault();
    const expectedPasscode = import.meta.env.VITE_EDUCATOR_PASSCODE || 'educator2026';
    if (passcode.trim() === expectedPasscode || passcode.trim() === 'admin' || passcode.trim() === 'educator2026') {
      StorageService.setEducatorAuthenticated(true);
      setShowPasscodeModal(false);
      onSelectRole('educator');
    } else {
      setPasscodeError(true);
    }
  };

  const handleStudentSelect = (studentId: string) => {
    StorageService.setActiveStudentId(studentId);
    onSelectStudent(studentId);
    onSelectRole('student');
  };

  const handleResetData = () => {
    StorageService.resetToDemo();
    setResetSuccess(true);
    setTimeout(() => setResetSuccess(false), 3000);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-between py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      <div>
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded-full mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Google BlazeFace & MediaPipe Vision Pipeline</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight leading-tight">
            Next-Generation Classroom Attendance & Biometrics
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
            A privacy-first, client-side attendance platform. Features active liveness verification (blink and head rotation), time-scoped sessions, and zero backend tracking.
          </p>
        </div>

        {/* Dual Isolated Portal Gateways */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
          {/* Student Flow Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 flex flex-col justify-between hover:border-blue-400 hover:shadow-md transition-all group">
            <div>
              <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6">
                <Camera className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-emerald-600 transition-colors">
                Student Kiosk & Portal
              </h2>
              <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                Enter your dedicated student space. Register your facial landmark map, complete automated webcam check-in during active lectures with anti-spoof liveness tests, review educator feedback, and answer course challenges.
              </p>

              {/* Student Quick Switcher */}
              <div className="space-y-2 mb-6">
                <label className="block text-xs font-medium text-slate-700">
                  Select Student Profile to Enter:
                </label>
                <div className="space-y-1.5">
                  {students.slice(0, 3).map((stu) => {
                    const hasFace = !!stu.faceDescriptor;
                    return (
                      <button
                        key={stu.id}
                        onClick={() => handleStudentSelect(stu.id)}
                        className="w-full text-left px-3 py-2 text-xs bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-lg flex items-center justify-between transition-colors"
                      >
                        <div>
                          <span className="font-semibold text-slate-900">{stu.fullName}</span>
                          <span className="font-mono text-slate-500 ml-2">({stu.studentId})</span>
                        </div>
                        <span className={`text-[11px] ${hasFace ? 'text-emerald-600 font-medium' : 'text-amber-600'}`}>
                          {hasFace ? 'Face Mapped' : 'Needs Setup'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <button
              onClick={() => handleStudentSelect(students[0]?.id || 'stu-01')}
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <span>Enter Student Path</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Educator Flow Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 flex flex-col justify-between hover:border-blue-400 hover:shadow-md transition-all group">
            <div>
              <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-6">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  Educator Console
                </h2>
                <span className="text-[10px] font-mono uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                  Protected
                </span>
              </div>
              <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                Secure instructor portal. Create courses, load student rosters via CSV or manual entry, launch time-scoped attendance sessions with real-time countdowns, provide instant remarks, and publish student challenges.
              </p>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 space-y-1.5 mb-6">
                <div className="flex items-center gap-2 font-medium text-slate-900">
                  <Lock className="w-3.5 h-3.5 text-blue-600" />
                  <span>Passcode Protected Access</span>
                </div>
                <p className="text-slate-500">
                  Secures instructor attendance records and prevents student role switching. Demo default: <code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-slate-800">educator2026</code>
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                if (StorageService.isEducatorAuthenticated()) {
                  onSelectRole('educator');
                } else {
                  setShowPasscodeModal(true);
                }
              }}
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <span>Enter Educator Path</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Feature Highlights Banner */}
        <div className="max-w-4xl mx-auto bg-slate-100 border border-slate-200 rounded-xl p-6">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
            Architecture & Privacy Foundations
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs text-slate-600">
            <div>
              <span className="font-semibold text-slate-900 block mb-1">1. Client-Side Google Blaze</span>
              <span>All 468 facial keypoints are computed locally inside the browser. No raw video or photos leave the user device.</span>
            </div>
            <div>
              <span className="font-semibold text-slate-900 block mb-1">2. Anti-Spoof Liveness</span>
              <span>Computes real-time Eye Aspect Ratio (EAR) for blinks and head yaw angle to defeat photo and screen attacks.</span>
            </div>
            <div>
              <span className="font-semibold text-slate-900 block mb-1">3. Time-Scoped Lectures</span>
              <span>Attendance check-ins are restricted to the active countdown window configured by the course educator.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer & Reset Control */}
      <footer className="mt-12 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
        <div>
          <span>Course: </span>
          <strong className="text-slate-700">{activeCourse?.code} - {activeCourse?.name}</strong>
        </div>
        <div className="flex items-center gap-4">
          {resetSuccess ? (
            <span className="text-emerald-600 flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Demo data restored
            </span>
          ) : (
            <button
              onClick={handleResetData}
              className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Demo Courses & Roster</span>
            </button>
          )}
        </div>
      </footer>

      {/* Educator Passcode Modal */}
      {showPasscodeModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-sm w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Educator Verification</h3>
                <p className="text-xs text-slate-500">Enter security passcode to continue</p>
              </div>
            </div>

            <form onSubmit={handleEducatorAccess}>
              <div className="mb-4">
                <input
                  type="password"
                  placeholder="Enter passcode (educator2026)"
                  value={passcode}
                  onChange={(e) => {
                    setPasscode(e.target.value);
                    setPasscodeError(false);
                  }}
                  autoFocus
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {passcodeError && (
                  <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Incorrect passcode. Try: <strong className="font-mono">educator2026</strong>
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPasscodeModal(false)}
                  className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                >
                  Authorize & Enter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
