import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request: Request) {
  try {
    const { messages, personName, company } = await request.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages are required and must be an array' },
        { status: 400 }
      );
    }

    const prompt = `Please provide a concise summary of the following conversation between a sales representative and ${personName} from ${company}. Focus on the key points discussed and any action items or next steps:\n\n${messages.map(m => `${m.role}: ${m.content}`).join('\n')}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that summarizes sales conversations. Keep summaries concise, professional, and focused on key points and next steps."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 300
    });

    const summary = completion.choices[0]?.message?.content || "Could not generate summary.";

    return NextResponse.json({
      success: true,
      summary
    });
  } catch (error) {
    console.error('Chat Summary Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate summary'
      },
      { status: 500 }
    );
  }
} 