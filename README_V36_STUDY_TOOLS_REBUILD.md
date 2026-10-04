# MedEx v36 — Study Tools native redesign

- Rebuilt Study Tools using the existing MedEx layout, typography, cards, spacing and theme tokens.
- Flashcard builder supports Module → Subject → Lecture, review mode and session size.
- Flashcard session uses the reference rating meanings: Again <1m, Hard <6m, Good <10m, Easy 5d, while keeping MedEx styling.
- Light and dark mode are both supported through the existing CSS variables; no forced white page or full-screen blue shell.
- Flashcard scheduling/progress is completely local in `med64_flashcard_state_v1`. It is independent from normal question progress and Supabase.
- Removed flashcard Supabase schedule loading/sync and the v35 flashcard migration.
- Existing exam, AI, reports, illustrations, analytics and other MedEx features are retained from v35.
