/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Student } from '../../types';
import { Camera, UserCheck, History, Award, User, Sparkles } from 'lucide-react';

export type StudentTab = 'checkin' | 'profile' | 'history' | 'challenges';

interface StudentLayoutProps {
  currentStudent: Student;
  activeTab: StudentTab;
  onTabChange: (tab: StudentTab) => void;
  allStudents: Student[];
  onSwitchStudent: (studentId: string) => void;
  children: React.ReactNode;
}

export const StudentLayout: React.FC<StudentLayoutProps> = ({
  currentStudent,
  activeTab,
  onTabChange,
  allStudents,
  onSwitchStudent,
  children,
}) => {
  const isEnrolled = !!currentStudent.faceDescriptor;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Student Profile Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold text-lg shrink-0">
            {currentStudent.fullName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-slate-900">{currentStudent.fullName}</h1>
              <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                {currentStudent.studentId}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
              <span>{currentStudent.email}</span>
              <span aria-hidden="true">·</span>
              <span className={isEnrolled ? 'text-emerald-700 font-medium' : 'text-amber-700 font-medium'}>
                {isEnrolled ? '✓ Face Biometrics Registered' : '⚠ Biometric Setup Required'}
              </span>
            </div>
          </div>
        </div>

        {/* Student Profile Switcher (Testing & multi-account convenience) */}
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <span className="hidden sm:inline font-medium">Switch Account:</span>
          <select
            value={currentStudent.id}
            onChange={(e) => onSwitchStudent(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            {allStudents.map((s) => (
              <option key={s.id} value={s.id}>
                {s.fullName} ({s.studentId})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Student Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-px mb-8 overflow-x-auto">
        <button
          onClick={() => onTabChange('checkin')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors whitespace-nowrap cursor-pointer border-b-2 ${
            activeTab === 'checkin'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>Live Session Check-In</span>
        </button>

        <button
          onClick={() => onTabChange('profile')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors whitespace-nowrap cursor-pointer border-b-2 ${
            activeTab === 'profile'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Face Biometric Setup</span>
          {!isEnrolled && (
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          )}
        </button>

        <button
          onClick={() => onTabChange('history')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors whitespace-nowrap cursor-pointer border-b-2 ${
            activeTab === 'history'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <History className="w-4 h-4" />
          <span>My Attendance & Notes</span>
        </button>

        <button
          onClick={() => onTabChange('challenges')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors whitespace-nowrap cursor-pointer border-b-2 ${
            activeTab === 'challenges'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Lecture Challenges</span>
        </button>
      </div>

      {/* Main Tab Content */}
      <main>{children}</main>
    </div>
  );
};
