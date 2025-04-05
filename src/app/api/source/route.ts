import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// You should store this in .env.local
const PDL_API_KEY = process.env.PDL_API_KEY;
const PDL_BASE_URL = 'https://api.peopledatalabs.com/v5';
const AUTOBOUND_API_KEY = process.env.AUTOBOUND_API_KEY;
const AUTOBOUND_BASE_URL = 'https://api.autobound.ai/api/external/generate-insights/v1.2';
const UNIPILE_API_KEY = process.env.UNIPILE_API_KEY;
const UNIPILE_BASE_URL = 'https://api1.unipile.com:13111/api/v1';

interface PDLPersonData {
  id: string;
  full_name: string;
  first_name: string;
  last_name: string;
  job_title: string;
  job_company_name: string;
  job_company_size: string;
  job_company_industry: string;
  job_company_location_country: string;
  job_company_linkedin_url: string;
  linkedin_url: string;
  [key: string]: any;
}

interface AutoboundInsights {
  linkedinPosts?: any[];
  podcastAppearances?: any[];
  awards?: any[];
  jobOpenings?: any[];
  newsArticles?: any[];
  [key: string]: any;
}

interface UnipileData {
  chats: any[];
  unreadCount: number;
  lastMessage?: {
    content: string;
    date: string;
  };
}

async function getUnipileData(linkedinUrl: string): Promise<UnipileData | null> {
  try {
    if (!UNIPILE_API_KEY) {
      console.warn('Unipile API key not configured');
      return null;
    }

    // Get all chats from Unipile
    const chatsResponse = await fetch(`${UNIPILE_BASE_URL}/chats`, {
      headers: {
        'Authorization': `Bearer ${UNIPILE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!chatsResponse.ok) {
      console.error('Unipile API Error:', chatsResponse.status, chatsResponse.statusText);
      return null;
    }

    const chatsData = await chatsResponse.json();

    // Filter chats for the specific LinkedIn URL
    const relevantChats = chatsData.data.filter((chat: any) => 
      chat.participants.some((participant: any) => 
        participant.linkedin_url === linkedinUrl
      )
    );

    // Calculate total unread count and get the last message
    const unreadCount = relevantChats.reduce((total: number, chat: any) => total + (chat.unread_count || 0), 0);
    const lastMessage = relevantChats[0]?.last_message ? {
      content: relevantChats[0].last_message.content,
      date: relevantChats[0].last_message.created_at
    } : undefined;

    return {
      chats: relevantChats,
      unreadCount,
      lastMessage
    };
  } catch (error) {
    console.error('Unipile Data Error:', error);
    return null;
  }
}

async function getAutoboundInsights(linkedinUrl: string): Promise<AutoboundInsights | null> {
  try {
    const response = await fetch(AUTOBOUND_BASE_URL, {
      method: 'POST',
      headers: {
        'X-API-KEY': AUTOBOUND_API_KEY || '',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contactLinkedinUrl: linkedinUrl
      })
    });

    if (!response.ok) {
      console.error('Autobound API Error:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    return data.insights;
  } catch (error) {
    console.error('Autobound Insights Error:', error);
    return null;
  }
}

async function searchPerson(linkedinUrl: string): Promise<PDLPersonData & { autobound_insights?: AutoboundInsights | null, unipile_data?: UnipileData | null }> {
  try {
    // First, check if person exists in database
    const existingPerson = await prisma.person.findUnique({
      where: { linkedinUrl }
    });

    if (existingPerson) {
      console.log('Person found in database');
      return {
        ...(existingPerson.data as PDLPersonData),
        autobound_insights: existingPerson.autobound_insights as AutoboundInsights || null,
        unipile_data: await getUnipileData(linkedinUrl)
      };
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
    const personData = apiResponse.data as PDLPersonData;

    // Get Autobound insights and Unipile data
    const [insights, unipileData] = await Promise.all([
      getAutoboundInsights(linkedinUrl),
      getUnipileData(linkedinUrl)
    ]);

    // Save to database with separate autobound_insights
    const person = await prisma.person.create({
      data: {
        linkedinUrl,
        selling: personData.job_title || null,
        data: personData,
        autobound_insights: insights || {}
      }
    });

    return {
      ...personData,
      autobound_insights: insights || {},
      unipile_data: unipileData
    };
  } catch (error) {
    console.error('Person Search Error:', error);
    throw error;
  }
}

async function getCompanyInfo(companyName: string, companyLinkedinUrl?: string) {
  try {
    // If we have company LinkedIn URL, check database first
    if (companyLinkedinUrl) {
      const existingCompany = await prisma.company.findUnique({
        where: { linkedinUrl: companyLinkedinUrl }
      });

      if (existingCompany) {
        console.log('Company found in database');
        return { data: existingCompany.data };
      }
    }

    // If not in database or no LinkedIn URL, fetch from PDL
    const params = new URLSearchParams({
      name: companyName,
      pretty: 'true',
      titlecase: 'true'
    });

    const response = await fetch(`${PDL_BASE_URL}/company/enrich?${params}`, {
      method: 'GET',
      headers: {
        'X-Api-Key': PDL_API_KEY || ''
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch company data');
    }

    const data = await response.json();
    console.log("data", data);

    // Save to database if we have LinkedIn URL
    if (companyLinkedinUrl && data) {
      await prisma.company.create({
        data: {
          linkedinUrl: companyLinkedinUrl,
          data: data // Save the entire response as JSON
        }
      });
    }

    return data;
  } catch (error) {
    console.error('Company Search Error:', error);
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    if (!PDL_API_KEY) {
      return NextResponse.json(
        { error: 'PDL API key is not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { linkedinUrl } = body;

    if (!linkedinUrl) {
      return NextResponse.json(
        { error: 'LinkedIn URL is required' },
        { status: 400 }
      );
    }

    const personData = await searchPerson(linkedinUrl);
    
    if (!personData) {
      return NextResponse.json(
        { error: 'No data found for the provided LinkedIn URL' },
        { status: 404 }
      );
    }

    // Get company data if available
    let companyData = null;
    if (personData.job_company_name) {
      const companyLinkedinUrl = personData.job_company_linkedin_url;
      companyData = await getCompanyInfo(personData.job_company_name, companyLinkedinUrl);
    }

    return NextResponse.json({
      success: true,
      message: 'Data retrieved successfully',
      data: {
        company: companyData?.data ? {
          name: companyData.data.name,
          employees: companyData.data.size ? 
            `${companyData.data.size}` : 'Unknown employees',
          founded: companyData.data.founded || 'Unknown',
          description: companyData.data.summary || `${companyData.data.name} is a company based in ${companyData.data.location?.name || 'Unknown'}.`,
        } : {
          name: personData.job_company_name || 'Unknown',
          employees: personData.job_company_size || 'Unknown employees',
          founded: personData.job_company_founded || 'Unknown',
          description: `${personData.job_company_name || 'Unknown'} is a company in the ${personData.job_company_industry || 'Unknown'} industry.`
        },
        metrics: companyData?.data ? {
          revenueRange: companyData.data.inferred_revenue || 'Unknown',
          location: companyData.data.location?.name || 'Unknown',
          industry: companyData.data.industry || 'Unknown',
          type: companyData.data.type || 'Unknown'
        } : {
          revenueRange: personData.job_company_inferred_revenue || 'Unknown',
          location: personData.job_company_location_name || 'Unknown',
          industry: personData.job_company_industry || 'Unknown',
          type: personData.job_company_type || 'Unknown'
        },
        person: {
          name: personData.full_name || 'Unknown',
          position: personData.job_title || 'Unknown position',
          location: personData.location_name || personData.job_company_location_name || 'Unknown location',
          seniority: personData.job_title_levels?.[0] || 'Unknown',
          headline: personData.summary || personData.headline || '',
          photo_url: personData.profile_pic_url || null,
          linkedin_url: personData.linkedin_url || linkedinUrl || '',
          employment_history: (personData.experience || []).map((exp: any) => ({
            organization: exp.company?.name || '',
            title: exp.title?.name || '',
            start_date: exp.start_date || '',
            end_date: exp.end_date || '',
            location: exp.company?.location?.name || exp.location_names?.[0] || '',
            description: exp.summary || ''
          }))
        },
        unipile: personData.unipile_data || {
          chats: [],
          unreadCount: 0
        },
        autobound_insights: personData.autobound_insights || {}
      }
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'An error occurred while processing your request',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
