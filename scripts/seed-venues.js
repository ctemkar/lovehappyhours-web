const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

function uuid() {
  return crypto.randomUUID();
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const bangkokCityId = '550e8400-e29b-41d4-a716-446655440001';

const cities = [
  {
    id: bangkokCityId,
    name: 'Bangkok',
    slug: 'bangkok',
    country: 'Thailand',
    country_code: 'TH',
    timezone: 'Asia/Bangkok',
    currency: 'THB',
    latitude: 13.7563,
    longitude: 100.5018,
    is_active: true,
    emoji: '🇹🇭'
  }
];

const venues = [
  {
    id: uuid(),
    name: 'Sky on 20',
    slug: 'sky-on-20',
    description: 'Rooftop bar with stunning Bangkok skyline views',
    category: 'bar',
    city_id: bangkokCityId,
    address: '20 Sukhumvit Soi 20, Bangkok',
    latitude: 13.7500,
    longitude: 100.5200,
    website: 'https://skyon20rooftopbar.com/?trackingCode=GMB',
    phone: '+66 2-xxx-xxxx',
    rating: 4.5,
    review_count: 120,
    is_verified: true,
    price_range: 3,
    opening_hours: {}
  },
  {
    id: uuid(),
    name: 'The Londoner Brewpub',
    slug: 'the-londoner-brewpub',
    description: 'British pub with craft beers',
    category: 'bar',
    city_id: bangkokCityId,
    address: 'Sukhumvit, Bangkok',
    latitude: 13.7450,
    longitude: 100.5150,
    website: 'http://www.the-londoner.com/',
    phone: '+66 2-xxx-xxxx',
    rating: 4.3,
    review_count: 95,
    is_verified: true,
    price_range: 2,
    opening_hours: {}
  },
  {
    id: uuid(),
    name: 'Tulum Skybar',
    slug: 'tulum-skybar',
    description: 'Trendy skybar with great cocktails',
    category: 'bar',
    city_id: bangkokCityId,
    address: 'Wireless Road, Bangkok',
    latitude: 13.7550,
    longitude: 100.5100,
    website: 'https://tulum.asia/',
    phone: '+66 2-xxx-xxxx',
    rating: 4.6,
    review_count: 150,
    is_verified: true,
    price_range: 3,
    opening_hours: {}
  }
];

async function seedData() {
  console.log('🌱 Starting database seed...\n');

  try {
    console.log('📍 Inserting cities...');
    const { error: cityError } = await supabase
      .from('cities')
      .insert(cities);

    if (cityError) {
      console.error('City insert error:', cityError);
      return;
    }
    console.log(`✅ Inserted ${cities.length} cities\n`);

    console.log('🏢 Inserting venues...');
    const { error: venueError } = await supabase
      .from('venues')
      .insert(venues);

    if (venueError) {
      console.error('Venue insert error:', venueError);
      return;
    }
    console.log(`✅ Inserted ${venues.length} venues\n`);

    console.log('✨ Seed complete! Ready for photo scraping.');
  } catch (error) {
    console.error('Seed error:', error.message);
    process.exit(1);
  }
}

seedData();
