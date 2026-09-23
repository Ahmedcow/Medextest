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
    if (provider === 'groq') {
      result = await callOpenAICompatible({
        apiKey: process.env.GROQ_API_KEY,
        url: 'https://api.groq.com/openai/v1/chat/completions',
        model: model || 'openai/gpt-oss-120b',
        messages,
        generationConfig,
        providerName: 'Groq'
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
      result = await callGemini({
        apiKey: process.env.GEMINI_API_KEY,
        model: model || 'gemini-3.6-flash',
        messages,
        generationConfig
      });
    } else {
      return res.status(400).json({ error: 'Unsupported AI provider.' });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Multi-provider AI error:', error);
    const status = Number(error?.status) || 500;
    return res.status(status).json({ error: error.message || 'AI request failed.' });
  }
}

async function callOpenAICompatible({ apiKey, url, model, messages, generationConfig, providerName }) {
  if (!apiKey) {
    throw new Error(`${providerName} API credentials are not configured in Vercel Environment Variables.`);
  }

  const requestedTokens = Number(generationConfig.maxOutputTokens);
  const maxTokens = Number.isFinite(requestedTokens) && requestedTokens > 0
    ? Math.min(requestedTokens, providerName === 'OpenRouter' ? 2200 : 65536)
    : (providerName === 'OpenRouter' ? 2200 : 4096);

  // MCQ generation requires machine-valid JSON. OpenRouter's Free Router
  // can automatically select free models that support structured outputs.
  // If a user selected a free model without structured-output support, route
  // this generation request through the Free Router instead of returning
  // malformed JSON to the browser. Normal AI chat is unaffected.
  let effectiveModel = model;
  const wantsJson = providerName === 'OpenRouter' && generationConfig.jsonMode === true;
  const structuredModels = new Set([
    'openrouter/free',
    'google/gemma-4-31b-it:free'
  ]);
  if (wantsJson && !structuredModels.has(effectiveModel)) {
    effectiveModel = 'openrouter/free';
  }

  const payload = {
    model: effectiveModel,
    messages,
    temperature: 0.2,
    max_tokens: maxTokens
  };

  if (wantsJson) {
    payload.response_format = {
      type: 'json_schema',
      json_schema: {
        name: 'medical_question_batch',
        strict: true,
        schema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            questions: {
              type: 'array',
              minItems: 1,
              maxItems: 1,
              items: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  question: { type: 'string' },
                  options: {
                    type: 'array',
                    minItems: 4,
                    maxItems: 4,
                    items: { type: 'string' }
                  },
                  correctIndex: { type: 'integer', minimum: 0, maximum: 3 },
                  explanation: { type: 'string' },
                  difficulty: { type: 'string' }
                },
                required: ['question','options','correctIndex','explanation','difficulty']
              }
            }
          },
          required: ['questions']
        }
      }
    };
  }

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
    if(providerName === 'OpenRouter' && response.status === 402){
      message = `${message} For the free OpenRouter setup, select OpenRouter Free Router or a :free model. Paid models require available credits/key budget.`;
    }
    const err = new Error(String(message));
    err.status = response.status;
    throw err;
  }

  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error(`${providerName} returned no text content.`);
  return { text, model: data?.model || effectiveModel, provider: providerName };
}

async function callGemini({ apiKey, model, messages, generationConfig }) {
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
}
