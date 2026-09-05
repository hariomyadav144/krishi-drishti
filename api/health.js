module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const geminiConfigured = Boolean((process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim());

  return res.status(200).json({
    status: 'ok',
    success: true,
    geminiConfigured,
    model: process.env.GEMINI_MODEL || 'gemini-3.7-flash',
    app: 'KRISHI DRISHTI API (Serverless)',
    tagline: 'From Space to Soil',
    timestamp: new Date().toISOString()
  });
};
