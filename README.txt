MedEx semester categorization update

FILES
- index.html: updated MedEx website
- sw.js: updated service worker from the previous fix
- MedEx_semester_migration.sql: required Supabase database migration

IMPORTANT DEPLOY ORDER
1. Open Supabase Dashboard -> SQL Editor.
2. Run MedEx_semester_migration.sql.
3. Confirm the existing Supabase RLS/admin policies allow administrators to UPDATE rows in public.questions and public.flashcards_public. Do not give public visitors unrestricted update permissions.
4. In the website repository, replace index.html with the included index.html and sw.js with the included sw.js.
5. Deploy the website.
6. Sign in as an administrator and open Semester Manager.
7. Assign each module to Semester 1, 2, or 3 and save. This updates all questions belonging to that module.
8. Assign every published flashcard to a semester and save. For newly published flashcards, choose the semester in Flashcard Manager before publishing.
9. Test the visitor welcome screen in a private/incognito window: enter a name, choose a semester, and enter MedEx.

BEHAVIOR
- Visitors are asked for a name and semester before entering; their selection is stored in the browser and the name continues to use the existing visitor-profile sync.
- Visitors can change semester in Settings. Their question bank and official published flashcards are filtered to that semester.
- Admins can assign question modules and published official flashcards in Semester Manager.
- Unassigned questions/official flashcards do not appear in a visitor's semester-filtered content. Categorize existing content before rolling this out widely.
- Personal/local flashcards with no semester remain visible to their owner; cards with a semester follow the selected semester.

NOTE
The database migration is required because the website now reads/writes the semester column in both Supabase tables. If an update is rejected by Row Level Security, adjust the existing admin-only policies rather than allowing unrestricted public writes.
