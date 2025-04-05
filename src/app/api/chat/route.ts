import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request: Request) {
  try {
    const {
      message,
      personName,
      personRole,
      company,
      personLocation,
      personSeniority,
      personHeadline,
      companySize,
      companyIndustry,
      companyLocation,
      isInitialPrompt
    } = await request.json();

    if (!message || !personName || !personRole || !company) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    let prompt = '';
    if (isInitialPrompt) {
      prompt = `You are a sales assistant helping to craft conversation starters with ${personName}, who is a ${personRole} at ${company}.

Additional context about ${personName}:
${personLocation ? `- Location: ${personLocation}` : ''}
${personSeniority ? `- Seniority: ${personSeniority}` : ''}
${personHeadline ? `- Headline: ${personHeadline}` : ''}

Company context:
${companySize ? `- Company Size: ${companySize}` : ''}
${companyIndustry ? `- Industry: ${companyIndustry}` : ''}
${companyLocation ? `- Location: ${companyLocation}` : ''}

Please provide 3-4 conversation starters that:
1. Highlight commonalities and potential points of connection
2. Show understanding of their role and industry challenges
3. Demonstrate value without being too sales-focused
4. Are personalized based on their background and company

Format the response with clear bullet points and include brief explanations of why each topic could be effective.`;
    } else {
      prompt = `Context: You are chatting with ${personName}, ${personRole} at ${company}.

Previous message: ${message}

Please provide a helpful response that maintains a professional and engaging tone while focusing on building rapport and understanding their needs. Avoid being overly sales-focused.`;
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful sales assistant focused on building genuine connections and understanding potential clients' needs."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    const response = completion.choices[0]?.message?.content || "I apologize, but I couldn't generate a response. Please try again.";

    return NextResponse.json({
      success: true,
      message: response
    });
  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate response'
      },
      { status: 500 }
    );
  }
} 