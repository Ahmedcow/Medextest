# MedEx v29 — Exam Builder Modes + Weak Topics + Study Activity

## Start Exam
- Restored the classic **Simple Exam Builder**: Module → Subject → Lecture.
- Added the **Advanced Smart Exam Builder** as a separate selectable mode.
- Simple mode uses dependent lists: selecting a module populates subjects; selecting a subject populates lectures.
- Advanced mode keeps mixed hierarchical selections across modules/subjects/lectures.

## Mistakes
- Added **Weak topics** analytics above the mistakes list.
- Topics are ranked from most weak to least weak using wrong answers ÷ attempts, with wrong-count tie breaking.
- Each weak topic shows module, subject, lecture, attempts, wrong/correct counts, and weakness percentage.

## Progress & Accuracy
- Added **Solved today** (unique questions solved today).
- Added **Days studied** (days with at least one solved question).
- Added recent daily study activity.
- Added a Dashboard shortcut to Progress & Accuracy.
- Study activity is stored locally in the browser under `med64_study_activity_v1`.

## No Supabase migration required
Existing Supabase schema is unchanged.
