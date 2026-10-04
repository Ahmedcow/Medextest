# MedEx v34 — Phase 3 Study Tools

Built on MedEx v33.

## Removed from Phase 2
- AI Similar Question / Generate Similar Question was completely removed from Exam Results and Mistakes.
- Related local-storage key, functions, UI, and styling were removed.

## Phase 3
- Flashcards using the existing question bank.
- Lecture Quick Review from Progress & Accuracy, with lecture practice.
- Study Plans with duration, daily question target, and optional exam date.
- Mock Exam Mode with a timed mixed-question exam.
- Exam Countdown inside Study Plans.
- Achievement System based on real local study activity.

## Preserved
- Daily Goal
- Study Streak
- Spaced Repetition
- Advanced Smart Exam Builder
- Progress & Accuracy
- Exam persistence
- AI Assistant
- Question reports and illustrations
- Support chat

No new Supabase migration is required for Phase 3. Study plans and achievements are local-browser features.

PWA service-worker cache: medex-v34-phase3-study-tools.
