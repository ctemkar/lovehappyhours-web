export type DealType = 'happy_hour' | 'daily_deal' | 'ladies_night' | 'early_bird' | 'late_night' | 'weekend_special'
export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'
export type PriceRange = 1 | 2 | 3 | 4
export type Category = 'bar' | 'restaurant' | 'cafe' | 'spa' | 'salon' | 'barber' | 'massage' | 'gym' | 'entertainment' | 'hotel' | 'bakery' | 'bubble_tea'

export interface Venue {
  id: string
  name: string
  slug: string
  description: string
  category: Category
  subcategories: string[]
  city: string
  citySlug: string
  neighborhood: string
  neighborhoodSlug: string
  address: string
  latitude: number
  longitude: number
  phone: string
  website: string
  instagram: string
  lineId: string
  photos: string[]
  logo: string
  coverImage: string
  priceRange: PriceRange
  rating: number
  reviewCount: number
  isVerified: boolean
  openingHours: Record<string, { open: string; close: string }>
  deals: Deal[]
}

export interface Deal {
  id: string
  venueId: string
  title: string
  description: string
  dealType: DealType
  categoryTags: string[]
  daysActive: DayOfWeek[]
  startTime: string
  endTime: string
  validFrom?: string
  validUntil?: string
  isRecurring: boolean
  originalPrice?: number
  dealPrice?: number
  discountPercent?: number
  dealTerms: string
  image: string
  isActive: boolean
  isVerified: boolean
}

export interface City {
  id: string
  name: string
  slug: string
  country: string
  countryCode: string
  timezone: string
  currency: string
  latitude: number
  longitude: number
  isActive: boolean
  neighborhoods: Neighborhood[]
  emoji: string
  venueCount: number
  image: string
}

export interface Neighborhood {
  name: string
  slug: string
  latitude: number
  longitude: number
  description: string
}

export interface BlogPost {
  slug: string
  title: string
  excerpt: string
  content: string
  coverImage: string
  author: string
  publishedAt: string
  city: string
  tags: string[]
}

export const CATEGORY_MAP: Record<Category, { label: string; emoji: string; slug: string }> = {
  bar: { label: 'Bars', emoji: '🍺', slug: 'bars' },
  restaurant: { label: 'Restaurants', emoji: '🍽️', slug: 'restaurants' },
  cafe: { label: 'Cafes', emoji: '☕', slug: 'cafes' },
  spa: { label: 'Spas', emoji: '💆', slug: 'spas' },
  salon: { label: 'Salons', emoji: '💅', slug: 'salons' },
  barber: { label: 'Barber Shops', emoji: '💇', slug: 'barbers' },
  massage: { label: 'Massage', emoji: '🧖', slug: 'massage' },
  gym: { label: 'Gyms', emoji: '🏋️', slug: 'gyms' },
  entertainment: { label: 'Entertainment', emoji: '🎱', slug: 'entertainment' },
  hotel: { label: 'Hotels', emoji: '🏨', slug: 'hotels' },
  bakery: { label: 'Bakeries', emoji: '🍰', slug: 'bakeries' },
  bubble_tea: { label: 'Bubble Tea', emoji: '🧋', slug: 'bubble-tea' },
}

export const DEAL_TYPE_MAP: Record<DealType, { label: string; color: string }> = {
  happy_hour: { label: 'Happy Hour', color: 'bg-brand-600' },
  daily_deal: { label: 'Daily Deal', color: 'bg-green-600' },
  ladies_night: { label: 'Ladies Night', color: 'bg-pink-600' },
  early_bird: { label: 'Early Bird', color: 'bg-amber-600' },
  late_night: { label: 'Late Night', color: 'bg-indigo-600' },
  weekend_special: { label: 'Weekend Special', color: 'bg-teal-600' },
}
