# MedEx v37 — Anki-style local flashcards

- Reworked Study Tools flashcards around Anki-style active recall and spaced repetition while preserving the native MedEx light/dark visual system.
- Uses localStorage only for flashcard scheduling; no flashcard schedule is sent to Supabase and no new SQL migration is required.
- Card states: New → Learning → Review, plus Relearning after a lapse.
- Learning steps: 1 minute → 10 minutes; Good graduates to a 1-day review interval; Easy graduates to 4 days.
- Review scheduling uses an ease factor with Again/Hard/Good/Easy interval changes, plus lapse handling and relearning.
- Repeated misses are tracked as lapses; after 8 lapses the card is marked as a leech/difficult locally.
- Due queue prioritizes learning/relearning and overdue review cards before new cards.
- Local daily new-card limit is 20; review history and daily counts remain on the device.
- Keyboard shortcuts during review: Space = reveal/Again, 1 = Again, 2 = Hard, 3 = Good, 4 = Easy.
- Favorite and difficult flags are local.
- Existing v36 flashcard state is migrated in-place when possible, so previous local review history is not intentionally discarded.
- Existing MedEx exam, AI, reports, illustrations, analytics, study plans, mock exam and achievements are retained.
