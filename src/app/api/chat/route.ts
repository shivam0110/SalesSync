import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

function formatInsights(insights: any[]) {
  if (!insights || !Array.isArray(insights)) return '';

  const relevantInsights = insights.filter(insight => {
    // Filter out insights that aren't useful for conversation
    if (!insight || !insight.variables) return false;
    
    // Include specific insight types that are good for conversation
    const usefulTypes = ['linkedin', 'podcast', 'receives_award', 'jobOpening', 'news'];
    return usefulTypes.includes(insight.type) || usefulTypes.includes(insight.subType);
  });

  return relevantInsights.map(insight => {
    switch (insight.type) {
      case 'linkedin':
        if (insight.variables.first500CharactersOfPost) {
          return `- Recent LinkedIn Post: "${insight.variables.first500CharactersOfPost.substring(0, 200)}..."`;
        }
        break;
      case 'podcast':
        return `- Appeared on podcast: ${insight.variables.podcastName || 'Unknown podcast'}`;
      case 'receives_award':
        return `- Received award: ${insight.variables.insightAward}`;
      case 'jobOpening':
        return `- Company is hiring: ${insight.variables.quantity} ${insight.variables.name}`;
      case 'news':
        return `- Recent news: ${insight.variables.insightTitle}`;
      default:
        return null;
    }
  }).filter(Boolean).join('\n');
}

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
      isInitialPrompt,
      linkedinUrl,
      autobound_insights
    } = await request.json();

    // For initial prompt, we don't need to validate the message content
    if (!isInitialPrompt && !message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    if (!personName || !personRole || !company || !linkedinUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: personName, personRole, company, and linkedinUrl are required' },
        { status: 400 }
      );
    }

    // Get recent chat history
    const recentChats = await prisma.chat.findMany({
      where: {
        linkedinUrl
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5,
      select: {
        message: true,
        response: true
      }
    });

    let prompt = '';
    if (isInitialPrompt) {
      const insightsText = formatInsights(autobound_insights);
      
      prompt = `You are a sales assistant helping to craft conversation starters with ${personName}, who is a ${personRole} at ${company}.

Additional context about ${personName}:
${personLocation ? `- Location: ${personLocation}` : ''}
${personSeniority ? `- Seniority: ${personSeniority}` : ''}
${personHeadline ? `- Headline: ${personHeadline}` : ''}

Company context:
${companySize ? `- Company Size: ${companySize}` : ''}
${companyIndustry ? `- Industry: ${companyIndustry}` : ''}
${companyLocation ? `- Location: ${companyLocation}` : ''}

Recent activities and insights:
${insightsText || 'No recent activities found.'}

Previous conversations with this person:
${recentChats.map(chat => `
User: ${chat.message}
Assistant: ${chat.response}`).join('\n')}

Please provide 3-4 conversation starters that:
1. Reference relevant insights from their recent activities when available
2. Show understanding of their role and industry challenges
3. Demonstrate value without being too sales-focused
4. Are personalized based on their background, company, and previous conversations

Format the response with clear bullet points and include brief explanations of why each topic could be effective.`;
    } else {
      prompt = `Context: You are chatting with ${personName}, ${personRole} at ${company}.

Previous conversations with this person:
${recentChats.map(chat => `
User: ${chat.message}
Assistant: ${chat.response}`).join('\n')}

Current message: ${message}

Please provide a helpful response that:
1. Maintains a professional and engaging tone
2. Shows understanding of previous context
3. Focuses on building rapport and understanding their needs
4. Avoids being overly sales-focused
5. References relevant points from previous conversations when appropriate`;
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a helpful sales assistant focused on building genuine connections and understanding potential clients' needs. Use previous conversation context to provide more personalized and relevant responses."
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

    // Store the conversation in the database
    await prisma.chat.create({
      data: {
        linkedinUrl,
        message: isInitialPrompt ? "Generate conversation starters" : message,
        response,
        personName,
        personRole,
        company
      }
    });

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