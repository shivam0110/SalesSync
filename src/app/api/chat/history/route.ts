import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const linkedinUrl = searchParams.get('linkedinUrl');

    if (!linkedinUrl) {
      return NextResponse.json(
        { error: 'LinkedIn URL is required' },
        { status: 400 }
      );
    }

    // Get chat history from the database
    const chatHistory = await prisma.chat.findMany({
      where: {
        linkedinUrl
      },
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        message: true,
        response: true,
        createdAt: true
      }
    });

    return NextResponse.json({
      success: true,
      history: chatHistory
    });
  } catch (error) {
    console.error('Chat History Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch chat history'
      },
      { status: 500 }
    );
  }
} 