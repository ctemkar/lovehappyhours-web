# Love Happy Hours — Website Build Brief

## Domain Setup
- **Marketing site:** lovehappyhours.com (this project)
- **App:** app.lovehappyhours.com (existing Flutter app, don't touch)

## Stack
- **Framework:** Next.js 14+ (App Router, TypeScript)
- **Styling:** Tailwind CSS + shadcn/ui
- **Database:** Supabase (PostgreSQL + PostGIS)
- **Hosting:** Vercel
- **Maps:** Mapbox GL JS or Google Maps

## What To Build (MVP)

### Pages
1. **Homepage** — City selector, hero section, featured deals, category cards
2. **City page** (`/bangkok/`) — All deals in a city, map view, category filters
3. **Category page** (`/bangkok/bars/`) — Filtered by category
4. **Neighborhood page** (`/bangkok/thonglor/`) — Filtered by area
5. **Neighborhood + Category** (`/bangkok/thonglor/bars/`)
6. **Venue page** (`/venue/[slug]/`) — Full venue details, deals, photos, map, hours
7. **Blog/Editorial** (`/blog/`) — SEO content like "Best Rooftop Bars Bangkok"
8. **About page** — What is Love Happy Hours

### SEO Requirements (CRITICAL)
- Every page server-rendered (SSR or SSG)
- Proper meta tags (title, description, OG image) per page
- JSON-LD structured data (LocalBusiness + Offer schemas)
- Sitemap.xml auto-generated
- robots.txt
- Canonical URLs
- Beautiful social sharing previews (OG tags with images)
- Fast Core Web Vitals (LCP < 2.5s, CLS < 0.1)
- Mobile-first responsive design

### AI Search Optimization
- Structured data that AI models can parse (JSON-LD, clean semantic HTML)
- FAQ sections on category/city pages (common questions about happy hours)
- Clear, descriptive content (not just listings — context about neighborhoods, tips)
- Schema.org markup for every entity type
- OpenGraph and Twitter cards for social + AI discovery

### Key Features
- "Happening NOW" filter — time-aware deal discovery
- Map view with deal pins
- Category filters (bars, restaurants, cafes, spas, salons, massage, etc.)
- Area/neighborhood filters
- Search
- Mobile responsive (80%+ users on phones)

### Data Models
See RESEARCH.md in parent directory for full data schema (venue, deal, user, city, review).

### Design Direction
- Purple/white theme (matching existing Flutter app branding)
- Clean, modern, fast
- Think: Airbnb meets Yelp for deals
- Card-based deal listings with photos

## Categories
🍺 Bars | 🍽️ Restaurants | ☕ Cafes | 💆 Spas | 💇 Barber Shops | 💅 Salons | 🧖 Massage | 🏋️ Gyms | 🎱 Entertainment | 🏨 Hotels | 🍰 Bakeries | 🧋 Bubble Tea

## Cities (start with)
Bangkok 🇹🇭 (home base, seed with real data if possible)

## Build Order
1. Project scaffold (Next.js + Tailwind + shadcn + Supabase)
2. Data models + Supabase schema
3. Seed data (Bangkok venues + deals — can be sample data)
4. Homepage + city page + venue page
5. Category + neighborhood pages
6. SEO infrastructure (sitemap, JSON-LD, meta tags, OG images)
7. Blog system
8. Map integration
9. "Happening Now" feature
10. Polish + Core Web Vitals optimization
