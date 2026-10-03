# MedEx v22 — Question Reports + Question Illustrations

## 1. Run the Supabase migration

Run the updated `supabase_v8_migration.sql` in the Supabase SQL Editor. The migration:

- adds `questions.image_url`
- creates `question_reports` with signed-in/visitor reporting, comments, status, and admin replies
- enables RLS so students/visitors can submit reports while only admins can read/update them
- creates the public `question-images` Storage bucket
- allows only administrators to upload/update/delete question images

## 2. Question illustrations

In **Upload / Update Questions → Add a question built in**, administrators can either:
- paste an illustration URL, or
- upload PNG/JPG/WEBP/GIF (max 5 MB).

For JSON imports, use `image_url`:

```json
{
  "id": "example-001",
  "module": "Anatomy",
  "subject": "Embryology",
  "lecture": "Lecture 1",
  "question": "Example question",
  "options": ["A", "B", "C", "D"],
  "correctIndex": 1,
  "explanation": "Example explanation",
  "image_url": "https://example.com/illustration.png"
}
```

The illustration is intentionally shown **after the student answers the question**, matching the requested exam behavior.

## 3. Question reports

During an exam, the flag button next to the question opens a report form. A signed-in user is stored with their user ID; a visitor is stored with a browser visitor ID. The report includes the question snapshot, reason, comment, and selected answer when available.

Administrators have a new **Question Reports** page where they can:
- see reports from students and visitors
- see the reported question and user's comment
- reply to the report
- mark reports resolved or re-open them

The reply and status are stored in Supabase.
