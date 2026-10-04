# MedEx v36 — Study Tools / Flashcard Rebuild

Rebuilt from the supplied flashcard reference image and the existing MedEx v35 HTML.

## Flashcard viewer
- Mobile-first viewer closely follows the reference layout:
  - cyan top bar `#03A9F5`
  - light-blue counter strip `#B3E5FC`
  - white question/answer canvas
  - four full-width rating buttons
  - red `#D32F2E` Again
  - slate `#465A65` Hard
  - green `#4CB050` Good
  - cyan `#03A9F5` Easy
  - heart action row below the rating buttons
- The question is shown first; tapping the card reveals the correct answer and explanation.
- Rating buttons remain disabled until the answer is revealed.
- Exact first-review intervals match the supplied reference:
  - Again `<1m`
  - Hard `<6m`
  - Good `<10m`
  - Easy `5d`
- Subsequent intervals grow from the card's previous interval.
- Wrong/Again returns sooner; correct ratings move the card farther into the future.
- Module → Subject → Lecture filtering remains available in Study Tools.
- All / Due / New review modes and session-size selection remain available.
- Question illustrations are preserved.

## Local-only flashcard progress
- Flashcard scheduling is stored in browser `localStorage` under `med64_flashcard_state_v1`.
- It is intentionally independent from the normal question-progress object, so Supabase authentication/progress refresh cannot overwrite flashcard scheduling.
- No flashcard schedule is read from or written to Supabase.
- No flashcard-specific Supabase migration is required.
- Existing Supabase-backed exam/question features remain unchanged.

## Verification
- Inline JavaScript syntax checked with Node.js.
- Package contains the existing MedEx migrations except the removed flashcard-specific migration.
