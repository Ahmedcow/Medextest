# MedEx v46 — Exam answer reveal, Start Exam responsive layout, and source-grounded Lecture Notes

- Immediate answer mode re-renders the current question after selection so the correct answer and explanation are always shown.
- After-submit mode keeps correctness/explanation hidden while answering.
- Start Exam answer-mode cards and controls are stabilized for desktop and tablet, with a clean one-column mobile fallback.
- Lecture Notes → Questions now requires Module, Subject, and Lecture names.
- Gemini is explicitly instructed to inspect the entire supplied lecture source and only use source-supported facts.
- Gemini must return source evidence for each generated question; questions without evidence are rejected.
- Generated module name is `<Module> AI generated`, e.g. `US AI generated`.
- Generated questions are stored locally and automatically added to the existing local AI Questions bank/page.
- Uploaded lecture files remain local in IndexedDB. No new Supabase tables or lecture-file sync are added.
