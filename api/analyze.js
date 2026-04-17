export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Missing prompt' });
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });
  const tools = [{ type: 'web_search_20250305', name: 'web_search' }];
  const messages = [{ role: 'user', content: prompt }];
  let finalText = '';
  let iterations = 0;
  try {
    while (iterations < 8) {
      iterations++;
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 4000, tools, messages }),
      });
      if (!response.ok) throw new Error(`Anthropic error ${response.status}`);
      const data = await response.json();
      const turnText = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
      if (turnText) finalText += turnText;
      if (data.stop_reason === 'end_turn' || !data.content) break;
      if (data.stop_reason === 'tool_use') {
        messages.push({ role: 'assistant', content: data.content });
        const toolResults = data.content.filter(b => b.type === 'tool_use').map(b => ({ type: 'tool_result', tool_use_id: b.id, content: 'Search executed.' }));
        if (toolResults.length > 0) messages.push({ role: 'user', content: toolResults });
        else break;
      } else break;
    }
    if (!finalText) finalText = 'Analysis unavailable — BCF team will review manually.';
    return res.status(200).json({ analysis: finalText });
  } catch (error) {
    console.error('Analysis error:', error);
    return res.status(500).json({ error: error.message || 'Analysis failed' });
  }
}
