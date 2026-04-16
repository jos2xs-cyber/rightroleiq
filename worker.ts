import Groq from 'groq-sdk';

export interface Env {
  GROQ_API_KEY: string;
  ASSETS: Fetcher;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/api/analyze' && request.method === 'POST') {
      try {
        const { systemInstruction, prompt } = await request.json() as {
          systemInstruction: string;
          prompt: string;
        };

        const groq = new Groq({ apiKey: env.GROQ_API_KEY });
        const response = await groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: prompt },
          ],
          temperature: 0.1,
          top_p: 0.9,
          max_tokens: 8192,
          seed: 42,
        });

        return Response.json({ text: response.choices[0]?.message?.content ?? '' });
      } catch (e: any) {
        return Response.json(
          { error: e?.message ?? 'Unknown error', status: e?.status },
          { status: e?.status ?? 500 }
        );
      }
    }

    return env.ASSETS.fetch(request);
  },
};
