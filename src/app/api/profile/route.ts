import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// You should store this in .env.local
const PDL_API_KEY = process.env.PDL_API_KEY;
const PDL_BASE_URL = 'https://api.peopledatalabs.com/v5';

async function searchPerson(linkedinUrl: string) {
  try {
    // First, check if person exists in database
    const existingPerson = await prisma.person.findUnique({
      where: { linkedinUrl }
    });

    if (existingPerson) {
      console.log('Person found in database');
      return existingPerson.data;
    }

    // If not in database, fetch from PDL
    const params = new URLSearchParams({
      profile: linkedinUrl,
      pretty: 'true',
      titlecase: 'true'
    });

    const response = await fetch(`${PDL_BASE_URL}/person/enrich?${params.toString()}`, {
      method: 'GET',
      headers: {
        'X-Api-Key': PDL_API_KEY || '',
      },
    });

    if (!response.ok) {
      console.error('PDL API Error:', response.status, response.statusText);
      throw new Error(`PDL API Error: ${response.status} ${response.statusText}`);
    }

    const apiResponse = await response.json();
    const personData = apiResponse.data;

    // Save to database
    await prisma.person.create({
      data: {
        linkedinUrl,
        selling: personData.job_title || null,
        data: personData
      }
    });

    return personData;
  } catch (error) {
    console.error('Person Search Error:', error);
    throw error;
  }
}

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

    if (!PDL_API_KEY) {
      return NextResponse.json(
        { error: 'PDL API key is not configured' },
        { status: 500 }
      );
    }

    const personData = await searchPerson(linkedinUrl);

    if (!personData) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        linkedinUrl: personData.linkedinUrl,
        selling: personData.selling,
        name: personData.full_name || 'Unknown',
        position: personData.job_title || 'Unknown position',
        location: personData.location_name || personData.job_company_location_name || 'Unknown location',
        seniority: personData.job_title_levels?.[0] || 'Unknown',
        headline: personData.summary || personData.headline || '',
        photo_url: personData.profile_pic_url || null,
        createdAt: personData.createdAt,
        updatedAt: personData.updatedAt
      }
    });

  } catch (error) {
    console.error('Profile API Error:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'An error occurred while fetching the profile',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { linkedinUrl, selling } = body;

    if (!linkedinUrl) {
      return NextResponse.json(
        { error: 'LinkedIn URL is required' },
        { status: 400 }
      );
    }

    const person = await prisma.person.upsert({
      where: { linkedinUrl },
      update: {
        selling: selling || null
      },
      create: {
        linkedinUrl,
        selling: selling || null,
        data: {} // Empty data object, will be populated by source API
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Profile saved successfully',
      data: {
        linkedinUrl: person.linkedinUrl,
        selling: person.selling,
        createdAt: person.createdAt,
        updatedAt: person.updatedAt
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