import { NextResponse } from 'next/server';

const UNIPILE_API_KEY = process.env.UNIPILE_API_KEY;
const UNIPILE_BASE_URL = 'https://api1.unipile.com:13111/api/v1';

export async function POST(request: Request) {
  try {
    if (!UNIPILE_API_KEY) {
      return NextResponse.json(
        { error: 'Unipile API key is not configured' },
        { status: 500 }
      );
    }

    const { chatId, message } = await request.json();

    if (!chatId || !message) {
      return NextResponse.json(
        { error: 'Chat ID and message are required' },
        { status: 400 }
      );
    }

    // Send message through Unipile
    const response = await fetch(`${UNIPILE_BASE_URL}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${UNIPILE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id: chatId,
        content: message
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to send message');
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      messageId: data.data.id
    });
  } catch (error) {
    console.error('LinkedIn Send Message Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send message'
      },
      { status: 500 }
    );
  }
} 