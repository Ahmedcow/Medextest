# MedEx v43 — Exam Answer Mode + Lecture File AI

Changes:
- Start Exam now offers two answer-display modes:
  - Show answer immediately
  - Show answer after submitting
- Immediate mode reveals the selected wrong answer in red and correct answer in green after selection.
- Lecture Notes → Questions now supports local lecture-file upload (PDF, TXT, MD, CSV, JSON, PNG, JPG/JPEG, WEBP).
- Uploaded lecture files are stored locally in IndexedDB; generated questions remain in localStorage.
- Uploaded PDFs/images are sent to the Gemini AI route as inline file data; text files are read locally and sent as text to Gemini.
- Lecture Notes generation explicitly uses Gemini.
- Removed the Streak + Study Consistency section from Study Tools.
- No new Supabase tables or study-tool synchronization added.
