# MedEx v42 — Exam Answer Reveal + Study Tools

- Exam answers/correctness are hidden while answering and revealed only after submission.
- Removed the immediate-answer exam setting to avoid accidental answer leakage.
- Added **📚 Lecture Notes → Questions** to Study Tools. Notes and generated questions are stored locally; generated MCQs use the existing MedEx AI route and are practiceable immediately.
- Added **🔥 Streak + Study Consistency** with current/best streak, active days, 30-day consistency, daily goal progress, and recent study days.
- No new Supabase tables or flashcard/study-tool sync were added.
- Service-worker cache bumped to `medex-v42-study-tools`.
