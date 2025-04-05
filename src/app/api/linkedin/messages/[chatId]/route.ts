import { NextResponse } from 'next/server';

const UNIPILE_API_KEY = process.env.UNIPILE_API_KEY;
const UNIPILE_BASE_URL = 'https://api1.unipile.com:13111/api/v1';

export async function GET(
  request: Request,
  { params }: { params: { chatId: string } }
) {
  try {
    if (!UNIPILE_API_KEY) {
      return NextResponse.json(
        { error: 'Unipile API key is not configured' },
        { status: 500 }
      );
    }

    const chatId = params.chatId;

    // Get messages for the specific chat
    const messagesResponse = await fetch(`${UNIPILE_BASE_URL}/messages?chat_id=${chatId}`, {
      headers: {
        'Authorization': `Bearer ${UNIPILE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!messagesResponse.ok) {
      throw new Error('Failed to fetch messages from Unipile');
    }

    const messagesData = await messagesResponse.json();

    // Get chat details to get participant information
    const chatResponse = await fetch(`${UNIPILE_BASE_URL}/chats/${chatId}`, {
      headers: {
        'Authorization': `Bearer ${UNIPILE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!chatResponse.ok) {
      throw new Error('Failed to fetch chat details from Unipile');
    }

    const chatData = await chatResponse.json();
    const participantsMap = new Map(
      chatData.data.participants.map((p: any) => [p.id, p.name])
    );

    // Process messages with sender information
    const messages = messagesData.data.map((msg: any) => ({
      id: msg.id,
      chat_id: msg.chat_id,
      content: msg.content,
      created_at: msg.created_at,
      sender_id: msg.sender_id,
      sender_name: participantsMap.get(msg.sender_id) || 'Unknown'
    }));

    return NextResponse.json({
      success: true,
      messages: messages
    });
  } catch (error) {
    console.error('LinkedIn Messages API Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch messages'
      },
      { status: 500 }
    );
  }
} 