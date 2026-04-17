import Groq from 'groq-sdk';

interface Env {
  GROQ_API_KEY: string;
  GOOGLE_API_KEY?: string;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const { systemInstruction, prompt } = await request.json() as {
      systemInstruction: string;
      prompt: string;
    };

    // Try Groq first
    try {
      const groq = new Groq({ apiKey: env.GROQ_API_KEY });
      const response = await groq.chat.completions.create({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: prompt },
        ],
        temperature: 0.1,
        top_p: 0.9,
        max_tokens: 4096,
        seed: 42,
      });

      const text = response.choices[0]?.message?.content;
      if (text) {
        return Response.json({ text, provider: 'groq' });
      }
    } catch (groqError: any) {
      const isRateLimit = groqError?.status === 429 ||
        groqError?.message?.toLowerCase().includes('rate limit') ||
        groqError?.message?.toLowerCase().includes('quota');

      console.log(`Groq failed (status ${groqError?.status}), trying Google AI Studio...`);

      // Fallback to Google AI Studio
      if (env.GOOGLE_API_KEY) {
        const googleResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GOOGLE_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: `${systemInstruction}\n\n${prompt}` }] }],
              generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 4096,
              },
            }),
          }
        );

        if (googleResponse.ok) {
          const googleData = await googleResponse.json() as any;
          const text = googleData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            return Response.json({ text, provider: 'google' });
          }
        }

        const googleError = await googleResponse.json().catch(() => ({})) as any;
        const googleIsRateLimit = googleResponse.status === 429 ||
          googleError?.error?.message?.toLowerCase().includes('quota') ||
          googleError?.error?.message?.toLowerCase().includes('rate limit');

        if (googleIsRateLimit || isRateLimit) {
          return Response.json(
            {
              error: 'Our free AI service is temporarily at capacity. Please try again in a few minutes. Remember, this is a free tool with limited daily usage.',
              status: 429,
            },
            { status: 429 }
          );
        }
      }

      if (isRateLimit) {
        return Response.json(
          {
            error: 'Our free AI service is temporarily at capacity. Please try again in a few minutes. Remember, this is a free tool with limited daily usage.',
            status: 429,
          },
          { status: 429 }
        );
      }

      return Response.json(
        { error: 'Failed to generate response. Please try again.', status: 500 },
        { status: 500 }
      );
    }

    return Response.json(
      { error: 'No response generated. Please try again.', status: 500 },
      { status: 500 }
    );
  } catch (e: any) {
    console.error('Request error:', e);
    return Response.json(
      { error: 'Invalid request. Please try again.', status: 400 },
      { status: 400 }
    );
  }
};
