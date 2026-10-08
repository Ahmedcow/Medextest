export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });

  const body = req.body || {};
  const provider = String(body.provider || 'groq').trim().toLowerCase();
  const model = String(body.model || '').trim();
  const contents = Array.isArray(body.contents) ? body.contents : [];
  const generationConfig = body.generationConfig || {};

  if (!contents.length) return res.status(400).json({ error: 'No AI messages were provided.' });

  const messages = contents.map((item) => ({
    role: item.role === 'model' ? 'assistant' : 'user',
    content: Array.isArray(item.parts)
      ? item.parts.map(p => String(p?.text || '')).join('\n')
      : String(item.content || '')
  })).filter(m => m.content.trim());

  if (!messages.length) return res.status(400).json({ error: 'The AI request contained no text.' });

  try {
    let result;

    if (provider === 'auto') {
      result = await callAuto({ model, messages, generationConfig });
    } else if (provider === 'groq') {
      result = await callOpenAICompatible({
        apiKey: process.env.GROQ_API_KEY,
        url: 'https://api.groq.com/openai/v1/chat/completions',
        model: model || 'openai/gpt-oss-120b',
        messages,
        generationConfig,
        providerName: 'Groq',
        maxRetries: 0
      });
    } else if (provider === 'openrouter') {
      result = await callOpenAICompatible({
        apiKey: process.env.OPENROUTER_API_KEY,
        url: 'https://openrouter.ai/api/v1/chat/completions',
        model: model || 'openrouter/free',
        messages,
        generationConfig,
        providerName: 'OpenRouter'
      });
    } else if (provider === 'gemini') {
      // A manually selected Gemini model still gets server-side resilience.
      // A 503/429 is normally temporary or capacity-related, so retry it and
      // then try other currently supported Flash models before using Groq.
      result = await callGeminiWithFallback({ model, messages, generationConfig });
    } else {
      return res.status(400).json({ error: 'Unsupported AI provider.' });
    }

    return res.status(200).json(result);
  } catch (error) {
    const status = Number(error?.status) || 500;
    const message = error?.publicMessage || error?.message || 'AI request failed.';
    return res.status(status).json({ error: String(message).slice(0, 1000) });
  }
}

const GEMINI_FALLBACK_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.7-flash',
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite'
];

function uniqueModels(firstModel) {
  return [firstModel, ...GEMINI_FALLBACK_MODELS].filter(Boolean).filter((m, i, a) => a.indexOf(m) === i);
}

function isRetryableStatus(status) {
  return [408, 429, 500, 502, 503, 504].includes(Number(status));
}

function retryCountForStatus(status) {
  if (Number(status) === 429) return 2;
  if ([500, 502, 503, 504, 408].includes(Number(status))) return 3;
  return 0;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function withRetry(fn, label, maxRetries = 2, options = {}) {
  let lastError;
  const shouldLog = options.log === true && process.env.MEDEX_DEBUG_LOGS === 'true';
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const retries = retryCountForStatus(error?.status);
      if (!isRetryableStatus(error?.status) || attempt >= Math.min(retries, maxRetries)) throw error;

      // Exponential backoff with jitter. Logging is opt-in so normal production
      // traffic does not create a custom log event for every retry.
      const base = Math.min(8000, 1200 * Math.pow(2, attempt));
      const jitter = Math.floor(Math.random() * 500);
      if (shouldLog) console.warn(`${label}: retry ${attempt + 1}/${maxRetries} in ${base + jitter}ms`);
      await sleep(base + jitter);
    }
  }
  throw lastError || new Error(`${label} failed.`);
}

async function callAuto({ model, messages, generationConfig }) {

  // If the user chose FREE AUTO, prefer Gemini Flash first, then Groq.
  // The exact selected model is kept first when supplied.
  const geminiModels = uniqueModels(model && model !== 'free-auto' ? model : null);
  for (const candidateModel of geminiModels) {
    try {
      const result = await callGemini({
        apiKey: process.env.GEMINI_API_KEY,
        model: candidateModel,
        messages,
        generationConfig,
        maxRetries: candidateModel === geminiModels[0] ? 2 : 0
      });
      return result;
    } catch (error) {
    }
  }

  const groqCandidates = ['openai/gpt-oss-120b', 'qwen/qwen3.8-27b'];
  for (const candidateModel of groqCandidates) {
    try {
      return await callOpenAICompatible({
        apiKey: process.env.GROQ_API_KEY,
        url: 'https://api.groq.com/openai/v1/chat/completions',
        model: candidateModel,
        messages,
        generationConfig,
        providerName: 'Groq',
        maxRetries: 0
      });
    } catch (error) {
      // Move directly to the next provider/model without logging the provider's raw response.
    }
  }

  const err = new Error('No configured AI provider could complete the request.');
  err.publicMessage = 'AI providers are temporarily unavailable. Please try again in a moment.';
  err.status = 503;
  throw err;
}

async function callGeminiWithFallback({ model, messages, generationConfig }) {
  const candidates = uniqueModels(model || 'gemini-3.8-flash');

  for (const candidateModel of candidates) {
    try {
      return await callGemini({
        apiKey: process.env.GEMINI_API_KEY,
        model: candidateModel,
        messages,
        generationConfig,
        maxRetries: candidateModel === candidates[0] ? 2 : 0
      });
    } catch (error) {
      // Invalid/auth/request errors are not fixed by trying another Gemini model,
      // except 404 (model unavailable) which is specifically a model-selection issue.
      if (![404, 408, 429, 500, 502, 503, 504].includes(Number(error?.status))) throw error;
    }
  }

  // Last-resort provider fallback, if configured. This keeps MedEx usable while
  // Gemini is overloaded instead of exposing the raw 503 to the student/admin.
  for (const candidateModel of ['openai/gpt-oss-120b', 'qwen/qwen3.8-27b']) {
    try {
      return await callOpenAICompatible({
        apiKey: process.env.GROQ_API_KEY,
        url: 'https://api.groq.com/openai/v1/chat/completions',
        model: candidateModel,
        messages,
        generationConfig,
        providerName: 'Groq',
        maxRetries: 0
      });
    } catch (error) {
      // Try the next fallback without emitting a custom log event.
    }
  }

  const err = new Error('Gemini fallback chain exhausted.');
  err.publicMessage = 'Gemini is temporarily busy or unavailable. MedEx tried the available fallbacks. Please try again in a moment.';
  err.status = 503;
  throw err;
}

async function callOpenAICompatible({ apiKey, url, model, messages, generationConfig, providerName, maxRetries = 2 }) {
  if (!apiKey) {
    throw new Error(`${providerName} API credentials are not configured in Vercel Environment Variables.`);
  }

  const requestedTokens = Number(generationConfig.maxOutputTokens);
  const maxTokens = Number.isFinite(requestedTokens) && requestedTokens > 0
    ? Math.min(requestedTokens, providerName === 'OpenRouter' ? 2200 : 65536)
    : (providerName === 'OpenRouter' ? 2200 : 4096);

  let effectiveModel = model;
  const wantsJson = generationConfig.jsonMode === true;
  const strictModels = new Set([
    'openai/gpt-oss-20b',
    'openai/gpt-oss-120b',
    'qwen/qwen3.8-27b'
  ]);

  if (providerName === 'OpenRouter' && wantsJson && effectiveModel !== 'openrouter/free') {
    // OpenRouter free models vary. The Free Router is the safest JSON-capable route.
    effectiveModel = effectiveModel || 'openrouter/free';
  }

  const payload = {
    model: effectiveModel,
    messages,
    temperature: 0.2,
    max_tokens: maxTokens
  };

  if (wantsJson) {
    const schema = {
      type: 'object',
      additionalProperties: false,
      properties: {
        questions: {
          type: 'array', minItems: 1, maxItems: 10,
          items: {
            type: 'object', additionalProperties: false,
            properties: {
              question: { type: 'string' },
              options: { type: 'array', minItems: 4, maxItems: 4, items: { type: 'string' } },
              correctIndex: { type: 'integer', minimum: 0, maximum: 3 },
              explanation: { type: 'string' },
              difficulty: { type: 'string' }
            },
            required: ['question','options','correctIndex','explanation','difficulty']
          }
        }
      },
      required: ['questions']
    };

    if (providerName === 'Groq' && strictModels.has(effectiveModel)) {
      payload.response_format = { type: 'json_schema', json_schema: { name: 'medical_question_batch', strict: true, schema } };
    } else {
      payload.response_format = { type: 'json_object' };
    }
  }

  return withRetry(async () => {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        ...(providerName === 'OpenRouter' ? {
          'HTTP-Referer': 'https://med64test.vercel.app',
          'X-Title': 'MedEx Medical Examination Platform'
        } : {})
      },
      body: JSON.stringify(payload)
    });

    let data = null;
    try { data = await response.json(); } catch (_) {}
    if (!response.ok) {
      let message = data?.error?.message || data?.error || `${providerName} returned HTTP ${response.status}.`;
      if (providerName === 'OpenRouter' && response.status === 402) {
        message = `${message} For the free OpenRouter setup, select OpenRouter Free Router or a :free model.`;
      }
      const err = new Error(String(message));
      err.status = response.status;
      throw err;
    }

    const text = data?.choices?.[0]?.message?.content;
    if (!text) throw new Error(`${providerName} returned no text content.`);
    return { text, model: data?.model || effectiveModel, provider: providerName };
  }, `${providerName}/${effectiveModel}`, maxRetries);
}

async function callGemini({ apiKey, model, messages, generationConfig, maxRetries = 2 }) {
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured in Vercel Environment Variables.');

  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));

  const payload = {
    contents,
    generationConfig: {
      maxOutputTokens: Number(generationConfig.maxOutputTokens) > 0
        ? Math.min(Number(generationConfig.maxOutputTokens), 65536)
        : 4096
    }
  };

  if (generationConfig.jsonMode === true) {
    payload.generationConfig.responseMimeType = 'application/json';
    payload.generationConfig.responseSchema = {
      type: 'OBJECT',
      properties: {
        questions: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              question: { type: 'STRING' },
              options: { type: 'ARRAY', items: { type: 'STRING' } },
              correctIndex: { type: 'INTEGER' },
              explanation: { type: 'STRING' },
              difficulty: { type: 'STRING' }
            },
            required: ['question','options','correctIndex','explanation','difficulty']
          }
        }
      },
      required: ['questions']
    };
  }

  return withRetry(async () => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    let data = null;
    try { data = await response.json(); } catch (_) {}
    if (!response.ok) {
      const message = data?.error?.message || `Gemini returned HTTP ${response.status}.`;
      const err = new Error(String(message));
      err.status = response.status;
      throw err;
    }

    const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || '';
    if (!text) throw new Error('Gemini returned no text content.');
    return { text, model, provider: 'Google Gemini' };
  }, `Gemini/${model}`, maxRetries);
}
