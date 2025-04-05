import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

const UNIPILE_API_KEY = process.env.UNIPILE_API_KEY;
const UNIPILE_BASE_URL = 'https://api1.unipile.com:13111/api/v1';

export async function GET(request: Request) {
  try {
    if (!UNIPILE_API_KEY) {
      return NextResponse.json(
        { error: 'Unipile API key is not configured' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const linkedinUrl = searchParams.get('linkedinUrl');

    if (!linkedinUrl) {
      return NextResponse.json(
        { error: 'LinkedIn URL is required' },
        { status: 400 }
      );
    }

    // First get all chats
    const chatsResponse = await fetch(`${UNIPILE_BASE_URL}/chats`, {
      headers: {
        'Authorization': `Bearer ${UNIPILE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('chatsResponse', chatsResponse);
    
    if (!chatsResponse.ok) {
      throw new Error('Failed to fetch chats from Unipile');
    }

    const chatsData = await chatsResponse.json();

    // Then get all messages
    const messagesResponse = await fetch(`${UNIPILE_BASE_URL}/messages`, {
      headers: {
        'Authorization': `Bearer ${UNIPILE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!messagesResponse.ok) {
      throw new Error('Failed to fetch messages from Unipile');
    }

    const messagesData = await messagesResponse.json();

    // Filter and combine relevant data
    const relevantChats = chatsData.data.filter((chat: any) => 
      chat.participants.some((participant: any) => 
        participant.linkedin_url === linkedinUrl
      )
    );

    const relevantMessages = messagesData.data.filter((message: any) =>
      relevantChats.some((chat: any) => chat.id === message.chat_id)
    );

    // Save to our database
    const chatPromises = relevantChats.map((chat: any) => {
      const lastMessage = relevantMessages
        .filter((msg: any) => msg.chat_id === chat.id)
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

      return prisma.linkedinMessage.create({
        data: {
          chatId: chat.id,
          linkedinUrl,
          participantName: chat.participants[0].name,
          lastMessage: lastMessage?.content || '',
          lastMessageDate: lastMessage?.created_at || new Date(),
          unreadCount: chat.unread_count || 0
        }
      });
    });

    await Promise.all(chatPromises);

    return NextResponse.json({
      success: true,
      data: {
        chats: relevantChats,
        messages: relevantMessages
      }
    });

  } catch (error) {
    console.error('LinkedIn Messages API Error:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Failed to fetch LinkedIn messages',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    if (!UNIPILE_API_KEY) {
      return NextResponse.json(
        { error: 'Unipile API key is not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { chatId, message } = body;

    if (!chatId || !message) {
      return NextResponse.json(
        { error: 'Chat ID and message are required' },
        { status: 400 }
      );
    }

    // Send message using Unipile
    const response = await fetch(`${UNIPILE_BASE_URL}/chats/${chatId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${UNIPILE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: message
      })
    });

    if (!response.ok) {
      throw new Error('Failed to send message through Unipile');
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error('LinkedIn Send Message API Error:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Failed to send LinkedIn message',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 