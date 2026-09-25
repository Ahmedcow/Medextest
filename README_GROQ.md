# MedEx — AI / PWA setup (Gemini resilience update)

## Vercel Environment Variables

Set these in Vercel Project Settings → Environment Variables:

- `GROQ_API_KEY` — required for Ask AI and Groq-based admin question generation/fallback.
- `GEMINI_API_KEY` — required for Gemini question generation and Gemini fallback.
- `OPENROUTER_API_KEY` — optional, for OpenRouter models in the admin generator.

Keep provider API keys server-side. Do not put them in frontend code.

## Gemini error handling

MedEx now handles temporary Gemini capacity/rate errors server-side:

- Retries transient HTTP 408/429/500/502/503/504 errors with exponential backoff + jitter.
- A Gemini 503/high-demand response automatically moves to the next supported Gemini Flash model after retries.
- Gemini model selection includes 3.8 Flash, 3.7 Flash, 3.6 Flash, 3.5 Flash, 3.5 Flash-Lite, and 3.1 Flash-Lite.
- If Gemini remains unavailable and `GROQ_API_KEY` is configured, MedEx falls back to Groq GPT-OSS 120B and then Qwen 3.8 27B.
- The browser shows a short notice when a provider/model fallback was used instead of exposing a raw Gemini overload error.

Free-tier/API quotas still apply; retries cannot remove provider rate limits.

## AI models

- Ask AI for normal users remains routed through Groq by default.
- Admin AI Question Generator supports Groq, Gemini, and OpenRouter options.
- FREE AUTO uses the Gemini → Groq fallback chain.

## PWA

The Settings page includes **Quick setup / Install MedEx**.

- Chromium browsers: the button opens the native install prompt when available.
- iPhone/iPad: the button gives Share → Add to Home Screen guidance.
- Safari on macOS: the button gives File → Add to Dock guidance.

The service worker is registered from `./sw.js`, and the manifest uses `./` as the PWA start URL.

## Supabase

Run `supabase_v8_migration.sql` in the Supabase SQL Editor for the analytics and favourites tables/functions.


## Production logging / Supabase Logs Query protection

MedEx production AI requests do not emit custom `console.log`/`console.warn`/`console.error` events by default. Gemini/Groq retry messages are only emitted when the Vercel environment variable `MEDEX_DEBUG_LOGS=true` is explicitly enabled. The AI API also avoids returning the full provider/fallback error chain to the browser.

The Gemini fallback chain retries the selected model, then tries fallback models without retrying every fallback model. This reduces unnecessary provider calls and Edge Function/serverless invocations while preserving resilience.

Supabase still records platform request/invocation logs automatically; application code cannot disable those from the frontend. Avoid repeatedly polling or running broad Logs Explorer queries because Supabase measures Logs Query by the amount of log data scanned.
