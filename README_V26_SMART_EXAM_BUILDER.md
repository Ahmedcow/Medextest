# MedEx v26 — Smart Exam Builder + Dashboard Dark Mode

## Smart Exam Builder
- Replaced the independent Module / Subject / Lecture multi-select lists with a hierarchical Module → Subject → Lecture tree.
- Select an entire module, an entire subject, or individual lectures.
- Supports mixed exams across different branches, for example:
  - Cardiology → ECG + Arrhythmias
  - Hematology → Iron Deficiency
  - Respiratory → Asthma
- Selecting a module/subject selects all lectures beneath it; individual lecture checkboxes can then be unchecked to make a precise selection.
- Search across module, subject, and lecture names.
- Shows question counts at each level.
- Shows a live selection summary and selected question count.
- Select All / Clear controls.
- Existing adaptive question selection, randomization, answer feedback, exam persistence, images, reports, AI assistant, and support chat remain intact.

## Dashboard
- Added a compact dark/light mode icon button to the Dashboard header.
- It uses the existing saved browser theme setting and immediately switches the current theme.

## PWA
- Service-worker cache updated to `medex-v26-smart-exam-builder-pwa`.

No additional Supabase migration is required for these v26 UI changes.
