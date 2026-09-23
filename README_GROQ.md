# MedEx v7 — OpenRouter JSON fix

This version fixes the OpenRouter MCQ-generation JSON failure.

## What changed
- OpenRouter MCQ generation sends **one question per request**.
- MCQ generation sets `jsonMode=true`.
- OpenRouter Free Router (`openrouter/free`) is used for structured-output routing.
- The backend sends an OpenRouter `response_format` JSON schema for MCQ generation.
- If a user selects a free model that does not support structured output (for example Ling 3.0 Flash Sante), MedEx automatically routes that MCQ-generation request through `openrouter/free` so the browser receives schema-shaped JSON instead of malformed JSON.
- Gemma 4 31B free is available as a direct structured-JSON option.
- AI chat is not forced into JSON; the structured-output behavior is only for MCQ generation.

OpenRouter documents that its Free Models Router automatically filters for models supporting requested features such as structured outputs.

## Vercel Environment Variable
Set:
`OPENROUTER_API_KEY`

Keep the key only in Vercel Environment Variables. Do not put it in `index.html` or GitHub.

## Deploy
Replace your current `index.html` and `api/ai.js` with the files in this package, commit to GitHub, then let Vercel redeploy.
