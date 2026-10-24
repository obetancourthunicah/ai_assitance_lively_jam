/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { AppRole, Course, Student } from './types';
import { StorageService, initStorage, subscribeToSync } from './services/storage';

// Common Components
import { Header } from './components/common/Header';

// Gateway
import { GatewayLanding } from './components/gateway/GatewayLanding';

// Student Flow Components
import { StudentLayout, StudentTab } from './components/student/StudentLayout';
import { LiveCheckIn } from './components/student/LiveCheckIn';
import { FaceEnrollment } from './components/student/FaceEnrollment';
import { StudentHistory } from './components/student/StudentHistory';
import { StudentChallenge } from './components/student/StudentChallenge';

// Educator Flow Components
import { EducatorLayout, EducatorTab } from './components/educator/EducatorLayout';
import { SessionManager } from './components/educator/SessionManager';
import { AttendanceLedger } from './components/educator/AttendanceLedger';
import { RosterManager } from './components/educator/RosterManager';
import { ChallengeStudio } from './components/educator/ChallengeStudio';
import { BackupSettings } from './components/educator/BackupSettings';
import { CourseModal } from './components/educator/CourseModal';

export default function App() {
  // Initialize Storage seed on mount
  useEffect(() => {
    initStorage();
  }, []);

  // Determine initial role from URL or default
  const getInitialRole = (): AppRole => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      if (path.includes('/educator') || hash.includes('educator')) return 'educator';
      if (path.includes('/student') || hash.includes('student')) return 'student';
    }
    return 'gateway';
  };

  const [currentRole, setCurrentRole] = useState<AppRole>(getInitialRole);
  const [courses, setCourses] = useState<Course[]>(StorageService.getCourses());
  const [activeCourseId, setActiveCourseId] = useState<string>(StorageService.getActiveCourseId());
  const [students, setStudents] = useState<Student[]>(StorageService.getStudents(activeCourseId));
  const [activeStudentId, setActiveStudentId] = useState<string>(StorageService.getActiveStudentId());

  // Tab states
  const [studentTab, setStudentTab] = useState<StudentTab>('checkin');
  const [educatorTab, setEducatorTab] = useState<EducatorTab>('sessions');
  const [ledgerSelectedSessionId, setLedgerSelectedSessionId] = useState<string | undefined>(undefined);

  // Course Modal state
  const [showCourseModal, setShowCourseModal] = useState(false);

  // Sync state across courses and students
  const refreshAppData = useCallback(() => {
    const allCourses = StorageService.getCourses();
    setCourses(allCourses);
    const currCourseId = StorageService.getActiveCourseId() || allCourses[0]?.id;
    setActiveCourseId(currCourseId);

    const allStudents = StorageService.getStudents(currCourseId);
    setStudents(allStudents);

    const currStudentId = StorageService.getActiveStudentId() || allStudents[0]?.id;
    setActiveStudentId(currStudentId);
  }, []);

  useEffect(() => {
    refreshAppData();
    const unsubscribe = subscribeToSync((event) => {
      if (
        event.type === 'STORAGE_RESET' ||
        event.type === 'SESSION_STATE_CHANGED' ||
        event.type === 'STUDENT_ENROLLED'
      ) {
        refreshAppData();
      }
    });
    return unsubscribe;
  }, [refreshAppData]);

  // Update URL hash without reload for deep-linking
  const handleSelectRole = (role: AppRole) => {
    setCurrentRole(role);
    if (typeof window !== 'undefined') {
      if (role === 'gateway') {
        window.history.pushState(null, '', '/');
      } else {
        window.history.pushState(null, '', `/#${role}`);
      }
    }
  };

  const handleSwitchCourse = (courseId: string) => {
    setActiveCourseId(courseId);
    StorageService.setActiveCourseId(courseId);
    const courseStudents = StorageService.getStudents(courseId);
    setStudents(courseStudents);
    if (courseStudents.length > 0) {
      setActiveStudentId(courseStudents[0].id);
      StorageService.setActiveStudentId(courseStudents[0].id);
    }
  };

  const handleSwitchStudent = (studentId: string) => {
    setActiveStudentId(studentId);
    StorageService.setActiveStudentId(studentId);
  };

  const activeCourse = courses.find(c => c.id === activeCourseId) || courses[0] || {
    id: 'course-default',
    code: 'CS-304',
    name: 'Machine Vision & Biometric Systems',
    term: 'Fall 2026',
    createdAt: new Date().toISOString(),
  };

  const activeStudent = students.find(s => s.id === activeStudentId) || students[0] || {
    id: 'stu-default',
    studentId: 'STU-9021',
    fullName: 'Alex Vance',
    email: 'alex.vance@university.edu',
    courseId: activeCourse.id,
    enrolledAt: new Date().toISOString(),
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Universal Top Bar */}
      <Header
        currentRole={currentRole}
        onNavigateGateway={() => handleSelectRole('gateway')}
        activeCourseName={activeCourse?.name}
        activeCourseCode={activeCourse?.code}
        studentName={currentRole === 'student' ? activeStudent?.fullName : undefined}
      />

      {/* Route 1: Gateway Landing ( / ) */}
      {currentRole === 'gateway' && (
        <GatewayLanding
          onSelectRole={(role) => handleSelectRole(role)}
          onSelectStudent={(stuId) => {
            handleSwitchStudent(stuId);
          }}
        />
      )}

      {/* Route 2: Student Flow ( /student ) - Fully Isolated */}
      {currentRole === 'student' && activeStudent && (
        <StudentLayout
          currentStudent={activeStudent}
          activeTab={studentTab}
          onTabChange={setStudentTab}
          allStudents={students}
          onSwitchStudent={handleSwitchStudent}
        >
          {studentTab === 'checkin' && (
            <LiveCheckIn
              student={activeStudent}
              courseId={activeCourse.id}
            />
          )}

          {studentTab === 'profile' && (
            <FaceEnrollment
              student={activeStudent}
              onEnrolled={(updatedStudent) => {
                refreshAppData();
              }}
            />
          )}

          {studentTab === 'history' && (
            <StudentHistory
              student={activeStudent}
              courseId={activeCourse.id}
            />
          )}

          {studentTab === 'challenges' && (
            <StudentChallenge
              student={activeStudent}
              courseId={activeCourse.id}
            />
          )}
        </StudentLayout>
      )}

      {/* Route 3: Educator Flow ( /educator ) - Fully Protected */}
      {currentRole === 'educator' && activeCourse && (
        <EducatorLayout
          currentCourse={activeCourse}
          courses={courses}
          activeTab={educatorTab}
          onTabChange={setEducatorTab}
          onCourseChange={handleSwitchCourse}
          onNewCourse={() => setShowCourseModal(true)}
          onLogout={() => {
            StorageService.setEducatorAuthenticated(false);
            handleSelectRole('gateway');
          }}
        >
          {educatorTab === 'sessions' && (
            <SessionManager
              course={activeCourse}
              onSelectSessionForLedger={(sessionId) => {
                setLedgerSelectedSessionId(sessionId);
                setEducatorTab('ledger');
              }}
            />
          )}

          {educatorTab === 'ledger' && (
            <AttendanceLedger
              course={activeCourse}
              selectedSessionId={ledgerSelectedSessionId}
            />
          )}

          {educatorTab === 'roster' && (
            <RosterManager course={activeCourse} />
          )}

          {educatorTab === 'challenges' && (
            <ChallengeStudio course={activeCourse} />
          )}

          {educatorTab === 'backup' && (
            <BackupSettings />
          )}
        </EducatorLayout>
      )}

      {/* Course Creation Modal */}
      <CourseModal
        isOpen={showCourseModal}
        onClose={() => setShowCourseModal(false)}
        onCourseCreated={(newCourse) => {
          refreshAppData();
        }}
      />
    </div>
  );
}
