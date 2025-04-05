import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { linkedinUrl, offering } = body;

    // Validate input
    if (!linkedinUrl || !offering) {
      return NextResponse.json(
        { error: 'LinkedIn URL and offering are required' },
        { status: 400 }
      );
    }

    // Validate LinkedIn URL format
    const linkedinUrlPattern = /^https:\/\/[w.]*linkedin\.com\/in\/[\w-]+\/?$/;
    if (!linkedinUrlPattern.test(linkedinUrl)) {
      return NextResponse.json(
        { error: 'Invalid LinkedIn URL format' },
        { status: 400 }
      );
    }

    // TODO: Add your database logic here
    // For now, we'll just return success
    return NextResponse.json({
      success: true,
      message: 'Profile saved successfully',
      data: {
        linkedinUrl,
        offering,
        createdAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Profile API Error:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'An error occurred while saving the profile',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 