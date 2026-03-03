import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Client for browser (read-only)
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Client for server (full access)
export const supabaseServer = createClient(supabaseUrl, supabaseServiceKey);

// Fetch venues by city
export async function fetchVenuesByCity(citySlug: string) {
  const { data, error } = await supabaseClient
    .from('venues')
    .select('*')
    .eq('city_id', (await getCityBySlug(citySlug))?.id)
    .order('name');

  if (error) {
    console.error('Error fetching venues:', error);
    return [];
  }

  return data || [];
}

// Fetch single venue by slug
export async function fetchVenueBySlug(slug: string) {
  const { data, error } = await supabaseClient
    .from('venues')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) {
    console.error('Error fetching venue:', error);
    return null;
  }

  return data;
}

// Fetch city by slug
export async function getCityBySlug(slug: string) {
  const { data, error } = await supabaseClient
    .from('cities')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) {
    console.error('Error fetching city:', error);
    return null;
  }

  return data;
}

// Fetch all cities
export async function fetchAllCities() {
  const { data, error } = await supabaseClient
    .from('cities')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error('Error fetching cities:', error);
    return [];
  }

  return data || [];
}

// Get venue deals
export async function fetchVenueDeals(venueId: string) {
  const { data, error } = await supabaseClient
    .from('deals')
    .select('*')
    .eq('venue_id', venueId)
    .eq('is_active', true)
    .order('start_time');

  if (error) {
    console.error('Error fetching deals:', error);
    return [];
  }

  return data || [];
}

// Update venue photos (server-side only)
export async function updateVenuePhotos(venueId: string, photos: string[]) {
  const { error } = await supabaseServer
    .from('venues')
    .update({ photos })
    .eq('id', venueId);

  if (error) {
    console.error('Error updating venue photos:', error);
    throw error;
  }

  return true;
}
