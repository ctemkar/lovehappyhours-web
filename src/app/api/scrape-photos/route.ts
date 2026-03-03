import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-client';
import { scrapeVenuePhotos, formatPhotosForStorage } from '@/lib/photo-scraper';

export async function POST(request: NextRequest) {
  try {
    const { venueId, websiteUrl } = await request.json();

    if (!venueId || !websiteUrl) {
      return NextResponse.json(
        { error: 'Missing venueId or websiteUrl' },
        { status: 400 }
      );
    }

    // Scrape photos
    console.log(`[API] Scraping photos for venue ${venueId} from ${websiteUrl}`);
    const scrapedPhotos = await scrapeVenuePhotos(websiteUrl);

    if (scrapedPhotos.length === 0) {
      return NextResponse.json(
        { success: true, photos: [], message: 'No photos found' },
        { status: 200 }
      );
    }

    // Format and store in Supabase
    const photoUrls = formatPhotosForStorage(scrapedPhotos);

    const { error } = await supabaseServer
      .from('venues')
      .update({ photos: photoUrls })
      .eq('id', venueId);

    if (error) {
      console.error('[API] Error updating venue photos:', error);
      return NextResponse.json(
        { error: 'Failed to update venue photos' },
        { status: 500 }
      );
    }

    console.log(`[API] Successfully stored ${photoUrls.length} photos for venue ${venueId}`);

    return NextResponse.json({
      success: true,
      photos: photoUrls,
      count: photoUrls.length,
    });
  } catch (error) {
    console.error('[API] Error in scrape-photos endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to trigger scraping for a specific venue (useful for admin/testing)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const venueId = searchParams.get('venueId');

  if (!venueId) {
    return NextResponse.json(
      { error: 'Missing venueId parameter' },
      { status: 400 }
    );
  }

  try {
    // Get venue details
    const { data: venue, error } = await supabaseServer
      .from('venues')
      .select('id, website')
      .eq('id', venueId)
      .single();

    if (error || !venue || !venue.website) {
      return NextResponse.json(
        { error: 'Venue not found or has no website' },
        { status: 404 }
      );
    }

    // Trigger scraping
    const scrapedPhotos = await scrapeVenuePhotos(venue.website);

    if (scrapedPhotos.length === 0) {
      return NextResponse.json({
        success: true,
        photos: [],
        message: 'No photos found for this venue',
      });
    }

    const photoUrls = formatPhotosForStorage(scrapedPhotos);

    // Update venue
    const { error: updateError } = await supabaseServer
      .from('venues')
      .update({ photos: photoUrls })
      .eq('id', venueId);

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update venue' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      photos: photoUrls,
      count: photoUrls.length,
    });
  } catch (error) {
    console.error('[API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
