export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'System configuration error: API key missing.' });
  }

  try {
    const { investment, allocation } = req.body;
    const model = "gemini-flash-latest";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const promptText = `Provide a formal, high-level Strategic Regulatory and Market Intelligence Report for a $${investment.toLocaleString()} allocation in the MASH pharmaceutical sector. 
    The allocation profile is: THR-B (${allocation['THR-B']}%), FGF21 (${allocation['FGF21']}%), GLP-1/Incretins (${allocation['GLP-1']}%), and Speculative/Emerging (${allocation['Other']}%).
    Focus on clinical trial milestones, competitive moats, and regulatory approval pathways (FDA/EMA). 
    Maintain a sober, professional consulting tone. Format in 3 clear paragraphs with no bolding or mentions of artificial intelligence or model names.`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
    });

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) throw new Error("Intelligence retrieval failed.");

    return res.status(200).json({ report: text });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
