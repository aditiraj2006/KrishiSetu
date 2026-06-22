export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message } = req.body;
  const simulatedResponse = `You asked: "${message}". I am the KrishiSetu AI. Market prices are currently stable.`;

  res.status(200).json({ reply: simulatedResponse });
}
