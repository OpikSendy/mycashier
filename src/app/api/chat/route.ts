import { NextResponse } from 'next/server';

function getOpenRouterClient() {
  const apiKey = process.env.OPENROUTER_API_KEY || '';
  return { apiKey };
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const client = getOpenRouterClient();

    const systemPrompt = `You are "Ask MyCashier AI", an intelligent AI consultant for restaurant and cafe owners using MyCashier POS & Table Self-Ordering platform.
You assist restaurant managers with sales insights, menu pricing optimization, promo ideas, and operational cashier efficiency.
Answer politely, concisely, and professionally in Indonesian (or English if the user asks in English).`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${client.apiKey}`,
        'HTTP-Referer': 'https://mycashier.app',
        'X-Title': 'MyCashier POS',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
      }),
    });

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'Terima kasih atas pertanyaannya! Ada yang bisa MyCashier AI bantu lagi tentang analisa resto Anda?';

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error('MyCashier AI API Error:', error);
    return NextResponse.json(
      { reply: 'Maaf terjadi kendala jaringan pada AI Assistant. Silakan coba lagi.' },
      { status: 500 }
    );
  }
}
