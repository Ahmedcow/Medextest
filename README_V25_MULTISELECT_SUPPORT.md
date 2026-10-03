# MedEx v25 — Multi-select Exams + Contact MedEx Team

## 1. Start Exam multi-select filters
- Module, Subject, and Lecture are now checkbox-based multi-select lists.
- Select any combination of modules, subjects, and lectures.
- Leaving a category empty means all values in that category.
- Subject choices update from selected modules; lecture choices update from selected modules/subjects.
- Exam history keeps the selected filter names as comma-separated values.
- Existing single-module dashboard exam buttons continue to work.

## 2. Contact MedEx team
- Dashboard now includes a Contact MedEx team chat card.
- Signed-in users and visitors can start a conversation.
- User messages and admin replies are stored in Supabase.
- The user's browser also stores the conversation history in localStorage.
- The chat polls for admin replies while open.

## 3. Admin Replies page
- New admin-only **Replies** page.
- Admin can see conversations from signed-in users and visitors.
- Admin can open a conversation, read the full history, and reply.

## 4. Supabase
Run `supabase_v25_support_chat_migration.sql` in the Supabase SQL Editor.
It creates the support conversation/message tables and security-definer RPC functions used by the app.

## 5. Existing features preserved
The package is based on MedEx v24 and keeps the exam persistence/image reload fix, question reports, AI assistant, favourites, analytics, PWA, and existing admin tools.
