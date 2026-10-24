/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Course, Challenge, ChallengeSubmission, Student } from '../../types';
import { StorageService, subscribeToSync } from '../../services/storage';
import { 
  Award, 
  PlusCircle, 
  Clock, 
  CheckCircle2, 
  MessageSquare, 
  Send,
  User,
  ChevronRight
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ChallengeStudioProps {
  course: Course;
}

export const ChallengeStudio: React.FC<ChallengeStudioProps> = ({ course }) => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<ChallengeSubmission[]>([]);

  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newQuestion, setNewQuestion] = useState('');
  const [newDueDate, setNewDueDate] = useState('');

  // Grading Modal State
  const [activeSubmission, setActiveSubmission] = useState<ChallengeSubmission | null>(null);
  const [feedbackInput, setFeedbackInput] = useState('');
  const [gradeInput, setGradeInput] = useState('100%');

  const loadData = useCallback(() => {
    const chals = StorageService.getChallenges(course.id);
    const studs = StorageService.getStudents(course.id);
    setChallenges(chals);
    setStudents(studs);

    const activeId = selectedChallengeId || chals[0]?.id || null;
    setSelectedChallengeId(activeId);

    if (activeId) {
      setSubmissions(StorageService.getSubmissions(activeId));
    }
  }, [course.id, selectedChallengeId]);

  useEffect(() => {
    loadData();
    const unsubscribe = subscribeToSync((event) => {
      if (
        event.type === 'CHALLENGE_CREATED' ||
        event.type === 'SUBMISSION_RECORDED'
      ) {
        loadData();
      }
    });
    return unsubscribe;
  }, [loadData]);

  const handleSelectChallenge = (id: string) => {
    setSelectedChallengeId(id);
    setSubmissions(StorageService.getSubmissions(id));
  };

  const handleCreateChallenge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newQuestion.trim()) return;

    const due = newDueDate 
      ? new Date(newDueDate).toISOString() 
      : new Date(Date.now() + 86400000 * 3).toISOString();

    const newChal: Challenge = {
      id: `chal-${Date.now()}`,
      courseId: course.id,
      title: newTitle.trim(),
      question: newQuestion.trim(),
      dueBeforeDate: due,
      createdAt: new Date().toISOString(),
    };

    StorageService.saveChallenge(newChal);
    setShowCreateModal(false);
    setNewTitle('');
    setNewQuestion('');
    setNewDueDate('');
    loadData();
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
  };

  const handleOpenGradeModal = (sub: ChallengeSubmission) => {
    setActiveSubmission(sub);
    setFeedbackInput(sub.educatorFeedback || '');
    setGradeInput(sub.grade || '100%');
  };

  const handleSaveGrade = () => {
    if (!activeSubmission) return;
    StorageService.gradeSubmission(activeSubmission.id, gradeInput, feedbackInput.trim());
    setActiveSubmission(null);
    loadData();
  };

  const selectedChallenge = challenges.find(c => c.id === selectedChallengeId);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Pre-Session Challenge Studio</h2>
          <p className="text-xs text-slate-500 mt-1">
            Assign concepts or practical questions for students to complete before the next lecture.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Challenge</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Challenge Selector List */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-2 py-1">
            Active Challenges ({challenges.length})
          </h3>

          {challenges.length === 0 ? (
            <p className="p-4 text-xs text-slate-400 text-center">No challenges created yet.</p>
          ) : (
            challenges.map((c) => {
              const subsCount = StorageService.getSubmissions(c.id).length;
              const isSelected = c.id === selectedChallengeId;

              return (
                <button
                  key={c.id}
                  onClick={() => handleSelectChallenge(c.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50/50 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 truncate">{c.title}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
                    <span>Due {new Date(c.dueBeforeDate).toLocaleDateString()}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-semibold text-blue-700">{subsCount} Submissions</span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Right: Challenge Details & Submissions Grid */}
        <div className="lg:col-span-2 space-y-6">
          {selectedChallenge ? (
            <>
              {/* Question Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
                <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
                  <h3 className="text-base font-bold text-slate-900">{selectedChallenge.title}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Due: {new Date(selectedChallenge.dueBeforeDate).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-800 leading-relaxed mb-4">
                  <span className="font-bold text-slate-900 block mb-1">Challenge Prompt:</span>
                  <p>{selectedChallenge.question}</p>
                </div>

                <div className="text-xs text-slate-500 flex items-center justify-between">
                  <span>Student completion: {submissions.length} of {students.length} answered</span>
                  <span className="font-medium text-emerald-700">Real-time sync enabled</span>
                </div>
              </div>

              {/* Submissions Review Table */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <div className="p-4 border-b border-slate-200">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Student Submissions ({submissions.length})
                  </h4>
                </div>

                {submissions.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    Awaiting student responses...
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {submissions.map((sub) => {
                      const student = students.find(s => s.id === sub.studentId);

                      return (
                        <div key={sub.id} className="p-4 sm:p-6 hover:bg-slate-50/50 transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-slate-900">
                                {student?.fullName || sub.studentId}
                              </span>
                              <span className="font-mono text-[11px] text-slate-500">
                                ({student?.studentId})
                              </span>
                            </div>

                            <div className="flex items-center gap-3">
                              {sub.grade && (
                                <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                  Grade: {sub.grade}
                                </span>
                              )}
                              <button
                                onClick={() => handleOpenGradeModal(sub)}
                                className="px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50 border border-blue-200 rounded transition-colors cursor-pointer"
                              >
                                {sub.grade ? 'Edit Grade' : 'Grade & Feedback'}
                              </button>
                            </div>
                          </div>

                          <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200 mb-2 whitespace-pre-wrap">
                            {sub.answer}
                          </p>

                          {sub.educatorFeedback && (
                            <div className="text-xs text-blue-900 bg-blue-50/70 p-2.5 rounded-lg border border-blue-100 flex items-start gap-2">
                              <MessageSquare className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-semibold block">Your Feedback:</span>
                                <span>{sub.educatorFeedback}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-xs text-slate-400">
              Select or create a challenge to view student submissions.
            </div>
          )}
        </div>
      </div>

      {/* Create Challenge Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-lg w-full p-6">
            <h3 className="text-base font-bold text-slate-900 mb-1">Create Lecture Challenge</h3>
            <p className="text-xs text-slate-500 mb-4">
              Post an analytical or practical question for students to answer before the next lecture.
            </p>

            <form onSubmit={handleCreateChallenge} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Challenge Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Eye Aspect Ratio & Liveness Mechanics"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Question / Prompt</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Explain why EAR drops below 0.2 during a blink, and how combining yaw checks prevents 2D photograph spoofing."
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  className="w-full p-3 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date</label>
                <input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
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
                  Publish Challenge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grade Submission Modal */}
      {activeSubmission && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full p-6">
            <h3 className="text-base font-bold text-slate-900 mb-1">Grade Submission</h3>
            <p className="text-xs text-slate-500 mb-4">
              Provide feedback and grade for the student.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Grade / Score</label>
                <input
                  type="text"
                  placeholder="e.g. 100% or A+"
                  value={gradeInput}
                  onChange={(e) => setGradeInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Educator Feedback</label>
                <textarea
                  rows={4}
                  placeholder="Great explanation of the liveness check invariants..."
                  value={feedbackInput}
                  onChange={(e) => setFeedbackInput(e.target.value)}
                  className="w-full p-3 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveSubmission(null)}
                  className="px-3 py-2 text-xs text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveGrade}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                >
                  Save Feedback & Grade
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
