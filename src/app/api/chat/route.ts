import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

function formatInsights(insights: any) {
  if (!insights || !Array.isArray(insights)) return '';

  const relevantInsights = insights.filter(insight => {
    if (!insight || !insight.variables) return false;
    
    // Include specific insight types that are good for conversation
    const usefulTypes = ['linkedin', 'podcast', 'receives_award', 'jobOpening', 'news', 'github', 'tech_stack', 'funding'];
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
      case 'github':
        return `- GitHub activity: ${insight.variables.description}`;
      case 'tech_stack':
        return `- Tech stack: ${insight.variables.technologies.join(', ')}`;
      case 'funding':
        return `- Funding news: ${insight.variables.description}`;
      default:
        return null;
    }
  }).filter(Boolean).join('\n');
}

async function getPersonInsights(linkedinUrl: string) {
  try {
    const person = await prisma.person.findUnique({
      where: { linkedinUrl },
      select: { autobound_insights: true }
    });
    return person?.autobound_insights || null;
  } catch (error) {
    console.error('Error fetching person insights:', error);
    return null;
  }
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

    // Get insights from database if not provided
    const insights = autobound_insights || await getPersonInsights(linkedinUrl);
    const insightsText = formatInsights(insights);

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

${insightsText ? `Recent activities and insights:\n${insightsText}` : ''}

Previous conversations with this person:
${recentChats.map(chat => `
User: ${chat.message}
Assistant: ${chat.response}`).join('\n')}

Please provide 3-4 conversation starters that:
1. Reference specific insights from their recent activities when available (GitHub activity, tech stack, LinkedIn posts, etc.)
2. Show understanding of their role and industry challenges
3. Demonstrate value without being too sales-focused
4. Connect their recent activities to relevant business opportunities
5. Are personalized based on their background, company context, and previous conversations
6. Note that user belongs to Salesmonk.ai, and that they are a sales development representative

Format each conversation starter with:
• The conversation starter
• Why it's relevant (referencing specific insights)
• How it connects to their current role/challenges`;
    } else {
      prompt = `Context: You are chatting with ${personName}, ${personRole} at ${company}.

${insightsText ? `Recent activities and insights about ${personName}:\n${insightsText}` : ''}

Previous conversations with this person:
${recentChats.map(chat => `
User: ${chat.message}
Assistant: ${chat.response}`).join('\n')}

Current message: ${message}

Please provide a helpful response that:
1. Maintains a professional and engaging tone
2. References relevant insights from their recent activities when appropriate
3. Shows understanding of their context and challenges
4. Focuses on building rapport and understanding their needs
5. Avoids being overly sales-focused
6. Uses their tech stack and GitHub activity to make the conversation more relevant`;
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a helpful sales assistant focused on building genuine connections and understanding potential clients' needs. Use insights from their recent activities, tech stack, and GitHub activity to provide more personalized and relevant responses."
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