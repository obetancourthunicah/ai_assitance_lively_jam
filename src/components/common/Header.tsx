/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppRole } from '../../types';
import { Camera, LogOut, ShieldAlert, GraduationCap, School } from 'lucide-react';

interface HeaderProps {
  currentRole: AppRole;
  onNavigateGateway: () => void;
  activeCourseName?: string;
  activeCourseCode?: string;
  studentName?: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onNavigateGateway,
  activeCourseName,
  activeCourseCode,
  studentName,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-slate-900 block leading-tight">
              PresenceLive
            </span>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              {currentRole === 'educator' && (
                <>
                  <span className="font-medium text-blue-700">Educator Console</span>
                  {activeCourseCode && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono text-slate-600">{activeCourseCode}</span>
                    </>
                  )}
                </>
              )}
              {currentRole === 'student' && (
                <>
                  <span className="font-medium text-emerald-700">Student Portal</span>
                  {studentName && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="text-slate-700">{studentName}</span>
                    </>
                  )}
                </>
              )}
              {currentRole === 'gateway' && (
                <span>Biometric Course Attendance Verification</span>
              )}
            </div>
          </div>
        </div>

        {/* Zone 2: Navigation / Course Context */}
        <div className="hidden md:flex items-center gap-6 text-sm text-slate-600 font-medium">
          {activeCourseName && (
            <div className="flex items-center gap-2 text-slate-500 text-xs">
              <School className="w-4 h-4 text-slate-400" />
              <span className="text-slate-800 font-medium truncate max-w-xs">{activeCourseName}</span>
            </div>
          )}
          {currentRole !== 'gateway' && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Time-Scoped Sessions</span>
              <span aria-hidden="true">·</span>
              <span>Google Blaze Landmarks</span>
              <span aria-hidden="true">·</span>
              <span>Anti-Spoof Liveness</span>
            </div>
          )}
        </div>

        {/* Zone 3: Exit / Switch Role Action */}
        <div className="flex items-center gap-3 shrink-0">
          {currentRole !== 'gateway' && (
            <button
              onClick={onNavigateGateway}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap"
              title="Return to Role Gateway"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Switch Portal</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
