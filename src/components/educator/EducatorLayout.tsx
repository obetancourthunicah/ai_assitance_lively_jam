/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Course } from '../../types';
import { StorageService } from '../../services/storage';
import { 
  Clock, 
  Users, 
  FileSpreadsheet, 
  Award, 
  Settings, 
  PlusCircle, 
  GraduationCap, 
  Lock,
  ChevronDown
} from 'lucide-react';

export type EducatorTab = 'sessions' | 'ledger' | 'roster' | 'challenges' | 'backup';

interface EducatorLayoutProps {
  currentCourse: Course;
  courses: Course[];
  activeTab: EducatorTab;
  onTabChange: (tab: EducatorTab) => void;
  onCourseChange: (courseId: string) => void;
  onNewCourse: () => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export const EducatorLayout: React.FC<EducatorLayoutProps> = ({
  currentCourse,
  courses,
  activeTab,
  onTabChange,
  onCourseChange,
  onNewCourse,
  onLogout,
  children,
}) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Educator Context Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-slate-900">{currentCourse.name}</h1>
              <span className="font-mono text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-semibold">
                {currentCourse.code}
              </span>
              <span className="text-xs text-slate-500 font-medium">{currentCourse.term}</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-xl truncate">
              {currentCourse.description || 'Live biometric course management & attendance ledger.'}
            </p>
          </div>
        </div>

        {/* Course Selector & Actions */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={currentCourse.id}
              onChange={(e) => onCourseChange(e.target.value)}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code}: {c.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={onNewCourse}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New Course</span>
          </button>

          <button
            onClick={onLogout}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            title="Lock Educator Console"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Lock</span>
          </button>
        </div>
      </div>

      {/* Educator Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-px mb-8 overflow-x-auto">
        <button
          onClick={() => onTabChange('sessions')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors whitespace-nowrap cursor-pointer border-b-2 ${
            activeTab === 'sessions'
              ? 'border-blue-600 text-blue-700 bg-blue-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Sessions & Live Feed</span>
        </button>

        <button
          onClick={() => onTabChange('ledger')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors whitespace-nowrap cursor-pointer border-b-2 ${
            activeTab === 'ledger'
              ? 'border-blue-600 text-blue-700 bg-blue-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Attendance Ledger & Notes</span>
        </button>

        <button
          onClick={() => onTabChange('roster')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors whitespace-nowrap cursor-pointer border-b-2 ${
            activeTab === 'roster'
              ? 'border-blue-600 text-blue-700 bg-blue-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Student Roster</span>
        </button>

        <button
          onClick={() => onTabChange('challenges')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors whitespace-nowrap cursor-pointer border-b-2 ${
            activeTab === 'challenges'
              ? 'border-blue-600 text-blue-700 bg-blue-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Challenge Studio</span>
        </button>

        <button
          onClick={() => onTabChange('backup')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors whitespace-nowrap cursor-pointer border-b-2 ${
            activeTab === 'backup'
              ? 'border-blue-600 text-blue-700 bg-blue-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Data Backup & Supabase</span>
        </button>
      </div>

      {/* Viewport Content */}
      <main>{children}</main>
    </div>
  );
};
