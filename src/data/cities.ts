import { type City } from '@/types'

export const cities: City[] = [
  {
    id: 'c001',
    name: 'Bangkok',
    slug: 'bangkok',
    country: 'Thailand',
    countryCode: 'TH',
    timezone: 'Asia/Bangkok',
    currency: 'THB',
    latitude: 13.7563,
    longitude: 100.5018,
    isActive: true,
    emoji: '🇹🇭',
    venueCount: 177,
    image: '/images/cities/bangkok.jpg',
    neighborhoods: [
      { name: 'Thonglor', slug: 'thonglor', latitude: 13.7302, longitude: 100.5826, description: 'Bangkok\'s trendiest neighborhood with upscale bars and nightlife.' },
      { name: 'Ekkamai', slug: 'ekkamai', latitude: 13.7222, longitude: 100.5872, description: 'Laid-back craft beer bars, hipster cafes, and artisanal eateries.' },
      { name: 'Sukhumvit', slug: 'sukhumvit', latitude: 13.7372, longitude: 100.561, description: 'Bangkok\'s long commercial spine with endless dining and nightlife.' },
      { name: 'Silom', slug: 'silom', latitude: 13.7276, longitude: 100.5271, description: 'Financial district by day, lively entertainment zone by night.' },
      { name: 'Sathorn', slug: 'sathorn', latitude: 13.7223, longitude: 100.5365, description: 'Business district with rooftop bars and fine dining.' },
      { name: 'Siam', slug: 'siam', latitude: 13.7465, longitude: 100.5348, description: 'Shopping heart with mega malls and hotel bars.' },
      { name: 'Ploenchit', slug: 'ploenchit', latitude: 13.744, longitude: 100.5468, description: 'Upscale central area with five-star hotels and premium bars.' },
      { name: 'Chinatown', slug: 'chinatown', latitude: 13.7401, longitude: 100.5101, description: 'Historic Yaowarat district with street food and speakeasies.' },
      { name: 'Riverside', slug: 'riverside', latitude: 13.7235, longitude: 100.5167, description: 'Iconic luxury hotels along the Chao Phraya River.' },
      { name: 'Old Town', slug: 'old-town', latitude: 13.7514, longitude: 100.4915, description: 'Historic heart with Grand Palace, Wat Pho, and Khaosan Road.' },
      { name: 'Ratchada', slug: 'ratchada', latitude: 13.7631, longitude: 100.5735, description: 'Vibrant nightlife district with night markets and bars.' },
      { name: 'On Nut', slug: 'on-nut', latitude: 13.7155, longitude: 100.5985, description: 'Up-and-coming area with local bars and affordable eats.' },
      { name: 'Phaya Thai', slug: 'phaya-thai', latitude: 13.7573, longitude: 100.534, description: 'Central area near Victory Monument with diverse dining.' },
      { name: 'Nonthaburi', slug: 'nonthaburi', latitude: 13.8621, longitude: 100.5144, description: 'Suburb across the river with emerging bar scene.' },
      { name: 'Pathumwan', slug: 'pathumwan', latitude: 13.745, longitude: 100.529, description: 'Central Bangkok area around MBK and National Stadium.' },
      { name: 'RCA', slug: 'rca', latitude: 13.757, longitude: 100.573, description: 'Bangkok\'s famous nightclub strip.' }
    ],
  },
  {
    id: 'c002',
    name: 'Mumbai',
    slug: 'mumbai',
    country: 'India',
    countryCode: 'IN',
    timezone: 'Asia/Kolkata',
    currency: 'INR',
    latitude: 19.0760,
    longitude: 72.8777,
    isActive: true,
    emoji: '🇮🇳',
    venueCount: 60,
    image: '/images/cities/mumbai.jpg',
    neighborhoods: [
      { name: 'Worli', slug: 'worli', latitude: 19.0176, longitude: 72.8153, description: 'Upscale area with sea views and premium bars.' },
      { name: 'Lower Parel', slug: 'lower-parel', latitude: 18.998, longitude: 72.8311, description: 'Hip mill-compound district with craft breweries and pubs.' },
      { name: 'Colaba', slug: 'colaba', latitude: 18.9067, longitude: 72.8147, description: 'South Mumbai\'s iconic neighborhood with heritage bars.' },
      { name: 'Bandra', slug: 'bandra', latitude: 19.0596, longitude: 72.8295, description: 'Trendy suburb with rooftop bars and nightlife.' },
      { name: 'Andheri', slug: 'andheri', latitude: 19.1136, longitude: 72.8697, description: 'Popular nightlife hub with bars and restaurants.' },
      { name: 'Juhu', slug: 'juhu', latitude: 19.0883, longitude: 72.8263, description: 'Beach-side dining and cocktail bars.' },
      { name: 'Powai', slug: 'powai', latitude: 19.1176, longitude: 72.906, description: 'IT hub with modern restaurants and bars.' },
      { name: 'BKC', slug: 'bkc', latitude: 19.0645, longitude: 72.8657, description: 'Business district with premium restaurants.' },
      { name: 'Malad', slug: 'malad', latitude: 19.1863, longitude: 72.8486, description: 'Suburban nightlife with popular pubs.' }
    ],
  },
  {
    id: 'c003',
    name: 'Pattaya',
    slug: 'pattaya',
    country: 'Thailand',
    countryCode: 'TH',
    timezone: 'Asia/Bangkok',
    currency: 'THB',
    latitude: 12.9236,
    longitude: 100.8825,
    isActive: true,
    emoji: '🇹🇭',
    venueCount: 40,
    image: '/images/cities/pattaya.jpg',
    neighborhoods: [
      { name: 'Pattaya Beach', slug: 'pattaya-beach', latitude: 12.9271, longitude: 100.8779, description: 'Main beach strip with hotels and rooftop bars.' },
      { name: 'Walking Street', slug: 'walking-street', latitude: 12.9262, longitude: 100.8725, description: 'Famous nightlife strip with bars and clubs.' },
      { name: 'Jomtien', slug: 'jomtien', latitude: 12.884, longitude: 100.867, description: 'Quieter beach area south of Pattaya.' },
      { name: 'Naklua', slug: 'naklua', latitude: 12.9625, longitude: 100.8853, description: 'North Pattaya with boutique bars and seafood.' }
    ],
  },
  {
    id: 'c004',
    name: 'New York City',
    slug: 'nyc',
    country: 'United States',
    countryCode: 'US',
    timezone: 'America/New_York',
    currency: 'USD',
    latitude: 40.7128,
    longitude: -74.0060,
    isActive: true,
    emoji: '🇺🇸',
    venueCount: 65,
    image: '/images/cities/nyc.jpg',
    neighborhoods: [
      { name: 'FiDi', slug: 'fidi', latitude: 40.7075, longitude: -74.0089, description: 'Historic financial district with iconic cocktail bars.' },
      { name: 'East Village', slug: 'east-village', latitude: 40.7265, longitude: -73.9815, description: 'Dive bars, cocktail dens, and late-night eats.' },
      { name: 'Midtown', slug: 'midtown', latitude: 40.7549, longitude: -73.984, description: 'Tourist hub with rooftop bars and hotel lounges.' },
      { name: 'Flatiron', slug: 'flatiron', latitude: 40.7395, longitude: -73.9903, description: 'Chic neighborhood with rooftop bars and cocktail lounges.' },
      { name: 'West Village', slug: 'west-village', latitude: 40.7358, longitude: -74.0036, description: 'Charming streets with wine bars and gastropubs.' },
      { name: 'Soho', slug: 'soho', latitude: 40.7233, longitude: -73.9985, description: 'Upscale bars and restaurants in historic loft buildings.' },
      { name: 'Williamsburg', slug: 'williamsburg', latitude: 40.7081, longitude: -73.9571, description: 'Brooklyn\'s hipster hub with craft cocktail bars.' },
      { name: 'Hell\'s Kitchen', slug: 'hells-kitchen', latitude: 40.7638, longitude: -73.9918, description: 'Theater district dining with pre-show happy hours.' }
    ],
  },
]

export function getCityBySlug(slug: string): City | undefined {
  return cities.find(c => c.slug === slug)
}

export function getActiveCities(): City[] {
  return cities.filter(c => c.isActive)
}
