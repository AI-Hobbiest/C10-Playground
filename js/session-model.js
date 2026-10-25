/* Pure session/result helpers shared by timed and untimed practice flows. */
(() => {
  "use strict";
  const asDate = value => {
    const n = new Date(value).getTime();
    if (!Number.isFinite(n)) throw new TypeError("Invalid timestamp: " + value);
    return n;
  };
  const secondsBetween = (start, end) => Math.max(0, Math.floor((asDate(end) - asDate(start)) / 1000));
  const remainingSeconds = (deadlineAt, now = Date.now()) =>
    deadlineAt == null ? null : Math.max(0, Math.ceil((asDate(deadlineAt) - Number(now)) / 1000));
  const formatDuration = value => {
    const total = Math.max(0, Math.floor(Number(value) || 0));
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;
    return hours > 0
      ? String(hours).padStart(2, "0") + ":" + String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0")
      : String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0");
  };

  function makeAnswerRecord(args) {
    const selected = args.selectedOptionId == null ? null : String(args.selectedOptionId);
    return {
      schemaVersion: 1,
      kind: "answer-record",
      answerRecordId: args.answerRecordId,
      attemptId: args.attemptId,
      questionId: String(args.questionId),
      selectedOptionId: selected,
      selectedOptionText: args.selectedOptionText == null ? null : String(args.selectedOptionText),
      correctOptionId: String(args.correctOptionId),
      correctOptionText: args.correctOptionText == null ? null : String(args.correctOptionText),
      isCorrect: args.status === "answered" ? selected === String(args.correctOptionId) : null,
      status: args.status,
      timeSpentSeconds: Math.max(0, Math.floor(Number(args.timeSpentSeconds) || 0)),
      answeredAt: args.answeredAt || null
    };
  }

  function summarize(attempt, options = {}) {
    if (!attempt || !Array.isArray(attempt.questions) || !Array.isArray(attempt.answers)) {
      throw new TypeError("Attempt needs questions and answers arrays.");
    }
    const submittedAt = options.submittedAt || new Date().toISOString();
    const status = options.status || "submitted";
    if (!["submitted", "timed-out", "abandoned"].includes(status)) {
      throw new TypeError("Invalid final attempt status: " + status);
    }
    const answers = attempt.questions.map((question, index) => {
      const current = attempt.answers[index];
      if (current) return current;
      return {
        questionId: String(question.questionKey || question.id),
        status: "unanswered",
        selectedOptionId: null,
        selectedOptionText: null,
        correctOptionId: String(question.correctOptionId || question.optionIds?.[question.answer] || question.answer),
        correctOptionText: String(question.options?.[question.answer] ?? ""),
        isCorrect: null,
        answeredAt: null,
        timeSpentSeconds: 0
      };
    });
    const correctCount = answers.filter(answer => answer.status === "answered" && answer.isCorrect === true).length;
    const answeredCount = answers.filter(answer => answer.status === "answered").length;
    const skippedCount = answers.filter(answer => answer.status === "skipped").length;
    const submitted = {
      schemaVersion: 1,
      kind: "test-attempt",
      attemptId: attempt.attemptId,
      profileId: attempt.profileId,
      subjectId: attempt.subjectId,
      mode: attempt.mode,
      source: attempt.source,
      questionBankVersion: attempt.questionBankVersion,
      status,
      startedAt: attempt.startedAt,
      submittedAt,
      durationSeconds: secondsBetween(attempt.startedAt, submittedAt),
      timeLimitSeconds: attempt.timeLimitSeconds == null ? null : attempt.timeLimitSeconds,
      score: correctCount,
      maxScore: attempt.questions.length,
      correctCount,
      questionCount: attempt.questions.length,
      answeredCount,
      skippedCount,
      unansweredCount: answers.filter(answer => answer.status === "unanswered").length,
      questionIds: attempt.questions.map(question => String(question.questionKey || question.id)),
      answerRecordIds: answers.map(answer => answer.answerRecordId).filter(Boolean)
    };
    return { attempt: submitted, answers };
  }

  window.C10SessionModel = Object.freeze({
    schemaVersion: 1,
    secondsBetween,
    remainingSeconds,
    formatDuration,
    makeAnswerRecord,
    summarize
  });
})();
