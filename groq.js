export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'GROQ_API_KEY is not configured in Vercel Environment Variables.'
    });
  }

  try {
    const body = req.body || {};
    const contents = Array.isArray(body.contents) ? body.contents : [];
    const generationConfig = body.generationConfig || {};
    const requestedModel = String(body.model || '').trim();

    if (!contents.length) {
      return res.status(400).json({ error: 'No AI messages were provided.' });
    }

    // High-quality default model. You can override it from the website
    // Advanced settings or remove the override field entirely.
    const model = requestedModel || 'openai/gpt-oss-120b';

    const messages = contents.map((item) => ({
      role: item.role === 'model' ? 'assistant' : 'user',
      content: Array.isArray(item.parts)
        ? item.parts.map(p => String(p?.text || '')).join('\n')
        : String(item.content || '')
    })).filter(m => m.content.trim());

    if (!messages.length) {
      return res.status(400).json({ error: 'The AI request contained no text.' });
    }

    const payload = {
      model,
      messages,
      temperature: 0.35,
      max_completion_tokens: Number(generationConfig.maxOutputTokens) > 0
        ? Math.min(Number(generationConfig.maxOutputTokens), 65536)
        : 4096
    };

    const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload)
      }
    );

    let data = null;
    try {
      data = await response.json();
    } catch (_) {}

    if (!response.ok) {
      const message =
        data?.error?.message ||
        data?.error ||
        `Groq API returned HTTP ${response.status}.`;
      return res.status(response.status).json({ error: String(message) });
    }

    const text = data?.choices?.[0]?.message?.content;
    if (!text) {
      return res.status(502).json({
        error: 'Groq returned no text content.'
      });
    }

    return res.status(200).json({
      text,
      model: data?.model || model
    });
  } catch (error) {
    console.error('Groq proxy error:', error);
    return res.status(500).json({
      error: 'The Groq request failed. Please try again.'
    });
  }
}
