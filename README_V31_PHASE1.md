# MedEx v31 — Phase 1 Study Intelligence

This version builds Phase 1 on top of v30 after reviewing the existing exam, progress, mistakes, support, and PWA flows.

## Included

1. **Smart Daily Exam**
   - Uses the user's actual performance data.
   - Prioritizes questions that were recently answered incorrectly, weak topics, unseen questions, then other eligible questions.
   - Uses the configured daily question goal (default 20).
   - Available from Dashboard, Start Exam, and Progress & Accuracy.

2. **Study Coach**
   - Shows weakest area from actual Module → Subject → Lecture performance.
   - Shows current daily goal progress.
   - Shows recent study days and streak.
   - Provides direct practice buttons.

3. **Smart Mistakes Review**
   - Weak topics remain ranked by wrong answers ÷ attempts.
   - Each weak topic has a direct Practice this topic action.

4. **Daily Goal**
   - Configurable in Settings (1–200 questions).
   - Drives Smart Daily Exam size and the Dashboard/Progress goal display.

5. **Progress & Accuracy**
   - Keeps the Sunday → Saturday analytical chart for Total, True, and False.
   - Adds the Study Coach above the analytics.

6. **Study analytics integrity**
   - Daily question activity is recorded when an exam is submitted, not every time an answer button is clicked.
   - This prevents repeated answer changes in a single exam from inflating daily solved/true/false counts.

## Supabase

No new Supabase migration is required. Phase 1 uses the existing local progress/study data and existing Supabase exam history/analytics.

## PWA

Service-worker cache updated to `medex-v31-phase1-study-intelligence`.
