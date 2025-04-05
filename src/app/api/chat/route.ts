import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, personName, personRole, company } = body;

    if (!message || !personName || !personRole || !company) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that generates personalized conversation starters and sales outreach messages. 
          You help craft messages that are professional, engaging, and tailored to the specific person and company.
          Keep responses concise, friendly, and focused on building genuine connections.`
        },
        {
          role: "user",
          content: `Help me craft a message to ${personName}, who is ${personRole} at ${company}. 
          My message/question is: ${message}`
        }
      ],
      temperature: 0.7,
      max_tokens: 200
    });

    const suggestedMessage = completion.choices[0].message.content;

    return NextResponse.json({
      success: true,
      message: suggestedMessage
    });

  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'An error occurred while generating the response',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 