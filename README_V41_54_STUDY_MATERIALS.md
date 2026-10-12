# MedEx v41.54 — Lecture Materials

## Included
- Adds a Lecture Materials navigation page organized by Module → Subject → Lecture.
- Admin-only upload form for PDF files, with a 20 MB limit, metadata fields, publish-immediately option, and clear upload/error status.
- Published material is visible to signed-out visitors and signed-in users; drafts are shown only to admins.
- Stores PDFs in the private Supabase Storage bucket `study-materials`; database rows store metadata and storage path only.
- Embedded PDF viewing through the browser's built-in PDF viewer, with page navigation, zoom, fit-width, fullscreen, open-in-new-tab, and download controls where supported by the browser.
- Admin publish/unpublish and delete actions.
- Uses the existing `public.is_admin()` helper for both UI authorization and Supabase RLS/Storage policies.
- Existing question bank, exams, auth, leaderboard, and independent flashcard system are left intact.
- Updates service-worker cache version to v41.54.

## Setup — required before deployment
1. In Supabase SQL Editor, inspect the current `public.is_admin()` function definition and verify it returns true only for authenticated admins whose profile is active. The app source confirms the existing `is_admin()` RPC is used, but the frontend cannot inspect the database function's implementation.
2. Run `supabase_study_materials.sql`. It creates only the `study_materials` table, its indexes/policies, and the `study-materials` Storage bucket/policies. It does not modify unrelated tables.
3. Verify that the private bucket remains private and the SQL function inspection query returns the expected active-admin check.
4. Test with an admin account: upload a small PDF as a draft, publish it, open it as a visitor, unpublish it, then verify a visitor can no longer read it. Verify a non-admin cannot upload/delete through the Supabase API.

## Security notes
- The upload UI is not the security boundary; the database and Storage RLS policies are.
- Do not expose a service-role key in the frontend.
- The bucket is private. The app requests a one-hour signed URL only for published material or for an admin viewing a draft.
- If `public.is_admin()` does not enforce active status, fix that existing helper before running this SQL in production. Do not substitute a guessed profile-table schema.

## PDF viewer limitation
The embedded reader uses the browser's built-in PDF viewer rather than bundling a large PDF.js build. Page navigation, zoom, text selection/search, fullscreen and download support depend on the browser, particularly on iPad/mobile Safari. A later enhancement can replace the iframe with a dedicated PDF.js reader if consistent cross-browser toolbar behavior is required.
