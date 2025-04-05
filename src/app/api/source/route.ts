import { NextResponse } from 'next/server';

// You should store this in .env.local
const PDL_API_KEY = process.env.PDL_API_KEY;
const PDL_BASE_URL = 'https://api.peopledatalabs.com/v5';

async function searchPerson(linkedinUrl: string){
  try {
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

    // Transform PDL data to match our frontend expectations
    const personData = apiResponse.data;

    const currentJob = personData.experience?.find((exp: any) => exp.is_primary) || personData.experience?.[0];
    
    const transformedData = {
      company: {
        name: currentJob?.company?.name || personData.job_company_name || 'Unknown',
        employees: currentJob?.company?.size || personData.job_company_size || 'Unknown employees',
        founded: currentJob?.company?.founded || personData.job_company_founded || 'Unknown',
        description: `${currentJob?.company?.name || personData.job_company_name || 'Unknown'} is a ${currentJob?.company?.type || personData.job_company_type || ''} company in the ${currentJob?.company?.industry || personData.job_company_industry || 'Unknown'} industry.`,
      },
      metrics: {
        revenueRange: personData.job_company_inferred_revenue || 'Unknown',
        location: personData.job_company_location_name || currentJob?.company?.location?.name || 'Unknown',
        industry: personData.job_company_industry || currentJob?.company?.industry || 'Unknown',
        type: personData.job_company_type || currentJob?.company?.type || 'Unknown'
      },
      person: {
        name: `${personData.first_name} ${personData.last_name}`,
        position: personData.job_title || currentJob?.title?.name || 'Unknown position',
        location: personData.location_name || 'Unknown location',
        seniority: personData.job_title_levels?.[0] || currentJob?.title?.levels?.[0] || 'Unknown',
        headline: personData.summary || personData.headline || '',
        photo_url: personData?.profile_pic_url || null,
        employment_history: (personData.experience || []).map((exp: any) => ({
          organization: exp.company?.name || '',
          title: exp.title?.name || '',
          start_date: exp.start_date || '',
          end_date: exp.end_date || '',
          location: exp.company?.location?.name || exp.location_names?.[0] || '',
          description: exp.summary || ''
        }))
      }
    };

    return transformedData;
  } catch (error) {
    console.error('PDL Person Search Error:', error);
    throw error;
  }
}

async function getCompanyInfo(companyName: string) {
  try {
    const params = new URLSearchParams({
      name: companyName,
      pretty: 'true',
      titlecase: 'true'
    });

    const response = await fetch(`${PDL_BASE_URL}/company/enrich?${params}`, {
      method: 'GET',
      headers: {
        'X-Api-Key': `${PDL_API_KEY}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch company data');
    }

    const data = await response.json();

    return data;
  } catch (error) {
    console.error('PDL Company Search Error:', error);
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
    const { linkedinUrl, companyDomain } = body;

    // Validate input
    if (!linkedinUrl) {
      return NextResponse.json(
        { error: 'LinkedIn URL is required' },
        { status: 400 }
      );
    }

    // Fetch person data from PDL
    const personData = await searchPerson(linkedinUrl);
    
    if (!personData) {
      return NextResponse.json(
        { error: 'No data found for the provided LinkedIn URL' },
        { status: 404 }
      );
    }

    // Get company data if available
    let companyData = null;
    if (personData.company.name) {
      companyData = await getCompanyInfo(personData.company.name);
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
          name: personData.company.name || 'Unknown',
          employees: personData.company.employees || 'Unknown employees',
          founded: personData.company.founded || 'Unknown',
          description: personData.company.description || `${personData.company.name || 'Unknown'} company.`
        },
        metrics: companyData?.data ? {
          revenueRange: companyData.data.inferred_revenue || 'Unknown',
          location: companyData.data.location?.name || 'Unknown',
          industry: companyData.data.industry || 'Unknown',
          type: companyData.data.type || 'Unknown'
        } : {
          revenueRange: 'Unknown',
          location: personData.metrics.location || 'Unknown',
          industry: personData.metrics.industry || 'Unknown',
          type: personData.metrics.type || 'Unknown'
        },
        person: {
          name: personData.person.name,
          position: personData.person.position || 'Unknown position',
          location: personData.person.location || 'Unknown location',
          seniority: personData.person.seniority || 'Unknown',
          headline: personData.person.headline || '',
          photo_url: personData.person.photo_url || null,
          employment_history: personData.person.employment_history || []
        }
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
