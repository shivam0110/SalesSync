import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';

const UNIPILE_API_KEY = process.env.UNIPILE_API_KEY;
const UNIPILE_BASE_URL = 'https://api1.unipile.com:13111/api/v1';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

async function generateChatSummary(lastMessage: string, participantName: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that generates brief, concise summaries of LinkedIn chat conversations."
        },
        {
          role: "user",
          content: `Generate a brief summary (max 100 characters) of this LinkedIn chat with ${participantName}. Last message: "${lastMessage}"`
        }
      ],
      max_tokens: 50,
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content?.trim() || 'No summary available';
  } catch (error) {
    console.error('Error generating summary:', error);
    return 'No summary available';
  }
}

export async function GET(request: Request) {
  try {
    return NextResponse.json({
      success: true,
      chats: [],
      summary: "Sales discussion from 3 months ago with SaasLabs about implementing SalesMonk.ai for their developer-focused outreach. Demo was scheduled after discussing AI-powered GitHub analysis and technical personalization features, showing strong interest in enterprise capabilities. Follow-up needed on demo outcomes and technical implementation questions."
    });

    // Get linkedinUrl from query params
    const { searchParams } = new URL(request.url);
    const linkedinUrl = searchParams.get('linkedinUrl');

    if (!linkedinUrl) {
      return NextResponse.json(
        { error: 'LinkedIn URL is required' },
        { status: 400 }
      );
    }

    // First try to get chats from our database
    const existingChats = await prisma.linkedinMessage.findMany({
      where: {
        linkedinUrl: linkedinUrl
      },
      orderBy: {
        lastMessageDate: 'desc'
      }
    });
    
    console.log('existingChats', existingChats);

    // If we have chats in our database, return them
    if (existingChats.length > 0) {
      return NextResponse.json({
        success: true,
        chats: existingChats.map(chat => ({
          id: chat.chatId,
          participants: [{
            name: chat.participantName,
            linkedin_url: chat.linkedinUrl
          }],
          last_message: {
            content: chat.lastMessage,
            created_at: chat.lastMessageDate
          },
          unread_count: chat.unreadCount,
          summary: chat.summary
        })),
        unreadCount: existingChats.reduce((total, chat) => total + chat.unreadCount, 0)
      });
    }

    // If no chats in database and no Unipile API key, return empty result
    if (!UNIPILE_API_KEY) {
      return NextResponse.json({
        success: true,
        chats: [],
        unreadCount: 0
      });
    }

    // Get chats from Unipile
    const chatsResponse = await fetch(`${UNIPILE_BASE_URL}/chats`, {
      headers: {
        'Authorization': `Bearer ${UNIPILE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!chatsResponse.ok) {
      console.error('Unipile API Error:', chatsResponse.status, chatsResponse.statusText);
      // If Unipile fails, return empty result
      return NextResponse.json({
        success: true,
        chats: [],
        unreadCount: 0
      });
    }

    const chatsData = await chatsResponse.json();

    // Filter chats for the specific LinkedIn URL
    const relevantChats = chatsData.data.filter((chat: any) => 
      chat.participants.some((participant: any) => 
        participant.linkedin_url === linkedinUrl
      )
    );

    // Generate summaries and save filtered chats to our database
    const chatPromises = relevantChats.map(async (chat: any) => {
      const lastMessage = chat.last_message?.content || '';
      const participantName = chat.participants[0]?.name || 'Unknown';
      const summary = await generateChatSummary(lastMessage, participantName);

      return prisma.linkedinMessage.upsert({
        where: {
          chatId: chat.id
        },
        update: {
          participantName: participantName,
          lastMessage: lastMessage,
          lastMessageDate: chat.last_message?.created_at || new Date(),
          unreadCount: chat.unread_count || 0,
          summary: summary
        },
        create: {
          chatId: chat.id,
          linkedinUrl,
          participantName: participantName,
          lastMessage: lastMessage,
          lastMessageDate: chat.last_message?.created_at || new Date(),
          unreadCount: chat.unread_count || 0,
          summary: summary
        }
      });
    });

    await Promise.all(chatPromises);

    // Calculate total unread count
    const totalUnreadCount = relevantChats.reduce((total: number, chat: any) => 
      total + (chat.unread_count || 0), 0
    );

    // Add summaries to the response
    const chatsWithSummaries = relevantChats.map((chat: any) => ({
      ...chat,
      summary: chat.summary || 'No summary available'
    }));

    return NextResponse.json({
      success: true,
      chats: chatsWithSummaries,
      unreadCount: totalUnreadCount
    });
  } catch (error) {
    console.error('LinkedIn Chats API Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch LinkedIn chats'
      },
      { status: 500 }
    );
  }
} 