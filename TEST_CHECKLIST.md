# Test Checklist

## Auth
- [ ] Admin Google account logs in successfully.
- [ ] Candidate email not in allowed list is blocked.
- [ ] Candidate with INACTIVE/BLOCKED status is blocked.
- [ ] Active candidate reaches candidate dashboard.

## Admin
- [ ] Add candidate manually.
- [ ] Import candidate CSV.
- [ ] Export candidates CSV.
- [ ] Add MCQ question.
- [ ] Add subjective question.
- [ ] Import question CSV.
- [ ] Create exam.
- [ ] Publish exam.
- [ ] Assign candidate.
- [ ] Assign exam to all active candidates.

## Candidate Exam
- [ ] Candidate sees assigned exam.
- [ ] Candidate accepts instruction screen.
- [ ] Attempt starts only once.
- [ ] Attempt resumes after refresh.
- [ ] Server timer does not reset after refresh.
- [ ] Answer is auto-saved.
- [ ] Mark-for-review works.
- [ ] Manual submit works.
- [ ] Auto-submit works when time ends.

## Results
- [ ] MCQ marks calculate correctly.
- [ ] Wrong answers count correctly.
- [ ] Unanswered questions count correctly.
- [ ] Subjective questions remain pending review.
- [ ] Admin can manually award subjective marks.
- [ ] Pass/fail updates after manual review.
- [ ] Results CSV export downloads.

## Proctoring
- [ ] Tab switch logs event.
- [ ] Window blur logs event.
- [ ] Fullscreen exit logs event.
- [ ] Right-click is blocked and logged.
- [ ] Copy/paste are blocked and logged.
- [ ] Refresh/navigation attempt is logged.
- [ ] Attempt is disqualified after threshold.
- [ ] Proctoring CSV export downloads.
