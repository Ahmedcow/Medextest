# MedEx V41.2 — Start Exam Fix

- Fixed Start Exam crash caused by reading a non-existent `#answerMode` element.
- The answer-mode selection remains a two-option radio list:
  - Show answer immediately (existing working behavior).
  - Show answer after submitting.
- The selected radio value is now read safely with `querySelector`.
- Service-worker cache bumped to V41.2.
- No Supabase schema or data changes.
