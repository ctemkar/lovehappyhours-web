import { type BlogPost } from '@/types'

export const blogPosts: BlogPost[] = [
  {
    slug: 'best-rooftop-bars-bangkok',
    title: 'The 7 Best Rooftop Bars in Bangkok for Happy Hour',
    excerpt: 'From the iconic Moon Bar to hidden gems, these rooftop bars offer the best sunset deals in the city. We\'ve tracked down every buy-one-get-one and half-price cocktail hour.',
    content: `
Bangkok's skyline is best enjoyed with a cocktail in hand — and ideally at half price. The city has more rooftop bars than almost anywhere on earth, and the competition means killer happy hour deals.

## 1. Red Sky Bar — Centara Grand at CentralWorld
**Happy Hour:** Daily 4–6PM, Buy 1 Get 1 on all drinks and snacks
The 55th floor views are hard to beat, and BOGOF on Champagne? Yes please. This is arguably the best-value luxury happy hour in Bangkok.

## 2. Moon Bar — Banyan Tree Bangkok  
**Happy Hour:** Daily 5–7PM, 30% off selected cocktails
At 61 floors up, this is one of the highest open-air rooftop bars in the world. Come for sunset, stay for the views of Lumpini Park below.

## 3. Char Rooftop Bar — Hotel Indigo
**Happy Hour:** Daily 5–7PM, Cocktails from ฿150
Craft cocktails at ฿150 with Wireless Road views — this might be Bangkok's best-kept happy hour secret.

## 4. Penthouse Bar + Grill — Park Hyatt Bangkok
**Happy Hour:** Daily 6–9PM, Prosecco from ฿250
The 35th floor of Central Embassy delivers premium vibes with prices that won't destroy your wallet.

## 5. Yao Rooftop Bar — Marriott The Surawongse
Stunning views of the Wat and river from the 32nd floor. Cocktails from ฿222.

## 6. Octave Rooftop Bar — Marriott Sukhumvit
Three levels of rooftop drinking at the 45th-49th floors. Happy hour with half-price cocktails 5-7PM.

## 7. Sky Bar — Lebua State Tower
Made famous by The Hangover Part II. No regular happy hour, but the experience is worth the premium.

---

*Prices and deals verified as of our last visit. Always check with the venue for the latest offers.*
    `,
    coverImage: '/images/blog/rooftop-bars.jpg',
    author: 'Love Happy Hours Team',
    publishedAt: '2025-12-15',
    city: 'Bangkok',
    tags: ['rooftop bars', 'happy hour', 'bangkok', 'cocktails', 'views'],
  },
  {
    slug: 'best-thai-massage-deals-bangkok',
    title: 'Where to Get the Best Thai Massage Deals in Bangkok',
    excerpt: 'From the historic Wat Pho school to luxury spa chains, here\'s where to find quality Thai massage at every price point in Bangkok.',
    content: `
Thai massage is a must-do in Bangkok, but prices vary wildly — from ฿200 street-side to ฿3,000+ at luxury spas. Here's where to find the sweet spot of quality and value.

## Budget: Under ฿400/hour

### Wat Pho Thai Traditional Massage School
The OG. This is literally where Thai massage was codified. A 1-hour traditional Thai massage costs ฿320 — incredible value for the quality and historic setting.

### Street massage on Khaosan Road
Prices start from ฿200/hour, but quality varies. Stick to shops with posted prices and good reviews.

## Mid-Range: ฿400–1,000/hour

### Health Land Spa & Massage
Bangkok's gold standard for consistent, quality massage at reasonable prices. 2-hour Thai massage for ฿650. Multiple branches — the Sathorn and Ekkamai locations are best.

### Asia Herb Association
Famous for their herbal ball treatments. Late-night deals after 9PM bring the 2-hour combo down to ฿999.

## Luxury: ฿1,000+/hour

### Divana Nurture Spa
Award-winning spa with a garden oasis setting. Book weekday mornings for 30% off — their aromatherapy packages are divine.

### Oriental Spa at Mandarin Oriental
The ultimate splurge. Riverside setting, impeccable service, and treatments from ฿4,000+.

---

*Pro tip: Book directly with venues rather than through third-party apps to get the best deals. Many places offer walk-in discounts during quiet hours.*
    `,
    coverImage: '/images/blog/thai-massage.jpg',
    author: 'Love Happy Hours Team',
    publishedAt: '2025-11-28',
    city: 'Bangkok',
    tags: ['thai massage', 'spa', 'bangkok', 'wellness', 'deals'],
  },
  {
    slug: 'thonglor-nightlife-guide',
    title: 'Thonglor Nightlife: The Complete Happy Hour Guide',
    excerpt: 'Thonglor (Sukhumvit Soi 55) is Bangkok\'s nightlife epicenter. From craft beer gardens to speakeasies, here\'s every happy hour deal worth knowing about.',
    content: `
Thonglor is where Bangkok goes out. This kilometer-long soi in upper Sukhumvit is packed with bars, clubs, restaurants, and everything in between. Here's your happy hour strategy.

## Start Early: 5–7PM

### Roots Coffee at The Commons
Not alcohol, but if you need a caffeine base before the night begins, their specialty coffee is top-tier. Morning deal: coffee + pastry for ฿179 before 10AM.

### Iron Fairies
Hidden gem down an alley — this steampunk fairy-themed bar serves craft cocktails. Gets packed later, so arrive early.

## Prime Time: 7–9PM

### Sing Sing Theater
The 1930s Shanghai-themed club opens at 9PM Thu–Sat. Arrive early for 2-for-1 cocktails before 11PM.

### Supanniga Eating Room
Not a bar, but their Eastern Thai food is the perfect dinner before a night out. Weekday lunch sets from ฿299.

## Late Night: After 10PM

### Asia Herb Association
Wind down with their late-night herbal ball combo — ฿999 after 9PM. The perfect way to end a Thonglor evening.

---

*Thonglor is best reached via BTS Thong Lo station. Most venues are a short walk or motorbike taxi ride from the station.*
    `,
    coverImage: '/images/blog/thonglor-nightlife.jpg',
    author: 'Love Happy Hours Team',
    publishedAt: '2025-11-10',
    city: 'Bangkok',
    tags: ['thonglor', 'nightlife', 'bangkok', 'happy hour', 'guide'],
  },
]

export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find(p => p.slug === slug)
}

export function getBlogPostsByCity(city: string): BlogPost[] {
  return blogPosts.filter(p => p.city === city)
}
