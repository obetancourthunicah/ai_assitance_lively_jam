/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Student, Challenge, ChallengeSubmission } from '../../types';
import { StorageService, subscribeToSync } from '../../services/storage';
import { Award, CheckCircle2, Clock, Send, MessageSquare } from 'lucide-react';
import confetti from 'canvas-confetti';

interface StudentChallengeProps {
  student: Student;
  courseId: string;
}

export const StudentChallenge: React.FC<StudentChallengeProps> = ({ student, courseId }) => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, ChallengeSubmission>>({});
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const loadData = useCallback(() => {
    const chals = StorageService.getChallenges(courseId);
    setChallenges(chals);

    const subsMap: Record<string, ChallengeSubmission> = {};
    for (const c of chals) {
      const allSubs = StorageService.getSubmissions(c.id);
      const mySub = allSubs.find(s => s.studentId === student.id);
      if (mySub) subsMap[c.id] = mySub;
    }
    setSubmissions(subsMap);
  }, [courseId, student.id]);

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

  const handleSubmit = (challengeId: string) => {
    const text = answers[challengeId]?.trim();
    if (!text) return;

    setSubmittingId(challengeId);
    setTimeout(() => {
      const submission: ChallengeSubmission = {
        id: `sub-${Date.now()}`,
        challengeId,
        studentId: student.id,
        answer: text,
        submittedAt: new Date().toISOString(),
      };

      StorageService.saveSubmission(submission);
      setSubmissions(prev => ({ ...prev, [challengeId]: submission }));
      setSubmittingId(null);
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    }, 400);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Lecture Challenges</h2>
            <p className="text-xs text-slate-500">
              Complete instructor challenges before the next session to reinforce lecture concepts.
            </p>
          </div>
        </div>
      </div>

      {challenges.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-xs text-slate-500">
          No challenges have been assigned yet for this course.
        </div>
      ) : (
        challenges.map((challenge) => {
          const submission = submissions[challenge.id];
          const isSubmitted = !!submission;

          return (
            <div key={challenge.id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-2 mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{challenge.title}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Due: {new Date(challenge.dueBeforeDate).toLocaleDateString()}</span>
                  </div>
                </div>

                <div>
                  {isSubmitted ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Submitted</span>
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md">
                      Pending Submission
                    </span>
                  )}
                </div>
              </div>

              {/* Challenge Question Prompt */}
              <div className="mb-6 bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs sm:text-sm text-slate-800 leading-relaxed">
                <span className="font-bold block text-slate-900 mb-1">Challenge Prompt:</span>
                <p>{challenge.question}</p>
              </div>

              {/* Submission Area */}
              {isSubmitted ? (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                      <span className="font-semibold text-slate-800">Your Answer:</span>
                      <span className="font-mono tabular-nums">
                        Submitted {new Date(submission.submittedAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 whitespace-pre-wrap">{submission.answer}</p>
                  </div>

                  {/* Educator Feedback & Grade */}
                  {submission.educatorFeedback ? (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-950">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 font-bold text-emerald-900">
                          <MessageSquare className="w-4 h-4 text-emerald-600" />
                          <span>Educator Feedback</span>
                        </div>
                        {submission.grade && (
                          <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-emerald-300">
                            Grade: {submission.grade}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-emerald-900">{submission.educatorFeedback}</p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">
                      Waiting for educator to review and provide feedback.
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-slate-700">
                    Your Response:
                  </label>
                  <textarea
                    rows={4}
                    value={answers[challenge.id] || ''}
                    onChange={(e) =>
                      setAnswers(prev => ({ ...prev, [challenge.id]: e.target.value }))
                    }
                    placeholder="Type your explanation or solution here..."
                    className="w-full p-3 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={() => handleSubmit(challenge.id)}
                      disabled={submittingId === challenge.id || !answers[challenge.id]?.trim()}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{submittingId === challenge.id ? 'Submitting...' : 'Submit Challenge Response'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};
