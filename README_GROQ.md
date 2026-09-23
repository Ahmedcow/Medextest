# MedEx v10 — AI / PWA setup

## Vercel Environment Variables

Set these in Vercel Project Settings → Environment Variables:

- `GROQ_API_KEY` — required for Ask AI and Groq-based admin question generation.
- `GEMINI_API_KEY` — required when an admin selects Gemini 3.6 Flash for AI question generation.
- `OPENROUTER_API_KEY` — optional, for OpenRouter models in the admin generator.

## AI models

- Ask AI for normal users is routed through Groq by default with `openai/gpt-oss-120b`.
- Admin AI Question Generator supports Groq GPT-OSS, Qwen 3.8 27B, Qwen 3 32B, Gemini 3.6 Flash, and OpenRouter models.
- Qwen 3.8 27B is used for current Groq structured JSON generation; the older Qwen 3.6 Groq model is deprecated.

## PWA

The Settings page includes **Quick setup / Install MedEx**.

- Chrome/Edge/other Chromium browsers: the button opens the native install prompt when the browser provides it.
- iPhone/iPad: the button gives the Share → Add to Home Screen steps.
- Safari on macOS: the button gives File → Add to Dock steps.
- Other browsers: the button gives the browser's install/Add to Home Screen guidance.

The service worker is registered from `./sw.js`, and the manifest uses `./` as the PWA start URL.

## Supabase

Run `supabase_v8_migration.sql` in the Supabase SQL Editor for the analytics and favourites tables/functions.
