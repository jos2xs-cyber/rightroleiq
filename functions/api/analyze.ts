import Groq from 'groq-sdk';

interface Env {
  GROQ_API_KEY: string;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
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
};
