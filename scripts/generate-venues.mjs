#!/usr/bin/env node
/**
 * Parse all CSV files and generate TypeScript venue/city data files.
 */
import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(__dirname, '..')
const dataRoot = resolve(projectRoot, '..') // happy-hours folder

// Simple CSV parser that handles quoted fields
function parseCSV(text) {
  const lines = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') { current += '"'; i++; continue }
      inQuotes = !inQuotes; continue
    }
    if (ch === '\n' && !inQuotes) {
      lines.push(current); current = ''; continue
    }
    if (ch === '\r' && !inQuotes) continue
    current += ch
  }
  if (current.trim()) lines.push(current)

  const rows = lines.map(line => {
    const fields = []; let field = ''; let q = false
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') { q = !q; continue }
      if (line[i] === ',' && !q) { fields.push(field.trim()); field = ''; continue }
      field += line[i]
    }
    fields.push(field.trim())
    return fields
  })
  return rows
}

function slugify(s) {
  let slug = s.toLowerCase()
    .replace(/['']/g, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .replace(/-+/g, '-')
  // If slug is empty (e.g. all Thai chars), generate from venue id
  if (!slug) slug = 'venue-' + (++fallbackCounter)
  return slug
}
let fallbackCounter = 0

function categorize(name, desc = '') {
  const t = (name + ' ' + desc).toLowerCase()
  if (/\bspa\b|onsen|wellness/.test(t)) return 'spa'
  if (/\bmassage\b/.test(t)) return 'massage'
  if (/\bsalon\b|\bhair\b|\bbarber\b/.test(t)) return 'salon'
  if (/\bcafe\b|café|coffee|coffeebar/.test(t)) return 'cafe'
  if (/\bgym\b|fitness|virgin active/.test(t)) return 'gym'
  if (/\bbakery\b|\bbake\b/.test(t)) return 'bakery'
  if (/\brestaurant\b|\bdining\b|\bkitchen\b|\bbistro\b|\bpizzeria\b|\bpizza\b|\bburger\b|\bdiner\b|\btrattoria\b|\bgrill\b|\btapas\b/.test(t) && !/\bbar\b|\brooftop\b|\bpub\b/.test(t)) return 'restaurant'
  if (/\brestaurant\b.*\bbar\b|\bbar\b.*\brestaurant\b/.test(t)) return 'bar'
  return 'bar' // default for bars, pubs, rooftop bars, clubs, etc.
}

// Neighborhood extraction
const BANGKOK_NEIGHBORHOODS = {
  'thonglor': { pattern: /thong\s*lo|ทองหล่อ|sukhumvit\s*(soi\s*)?55/i, lat: 13.7302, lng: 100.5826, desc: "Bangkok's trendiest neighborhood with upscale bars and nightlife." },
  'ekkamai': { pattern: /ekkamai|เอกมัย|sukhumvit\s*(soi\s*)?63/i, lat: 13.7222, lng: 100.5872, desc: "Laid-back craft beer bars, hipster cafes, and artisanal eateries." },
  'sukhumvit': { pattern: /sukhumvit|สุขุมวิท/i, lat: 13.7372, lng: 100.5610, desc: "Bangkok's long commercial spine with endless dining and nightlife." },
  'silom': { pattern: /silom|สีลม|sala\s*daeng/i, lat: 13.7276, lng: 100.5271, desc: "Financial district by day, lively entertainment zone by night." },
  'sathorn': { pattern: /sathorn|สาทร|sathon/i, lat: 13.7223, lng: 100.5365, desc: "Business district with rooftop bars and fine dining." },
  'siam': { pattern: /siam|สยาม|centralworld|central\s*world|rama\s*1/i, lat: 13.7465, lng: 100.5348, desc: "Shopping heart with mega malls and hotel bars." },
  'ploenchit': { pattern: /ploenchit|เพลินจิต|wireless|วิทยุ|langsuan|หลังสวน|rajadamri|ราชดำริ|lumphini|ลุมพินี|chitlom/i, lat: 13.7440, lng: 100.5468, desc: "Upscale central area with five-star hotels and premium bars." },
  'ari': { pattern: /\bari\b|อารี|phahon|พหลโยธิน|saman\s*pao|intamara|pradipat|ประดิพัทธ์/i, lat: 13.7794, lng: 100.5455, desc: "Charming café district with independent coffee shops." },
  'chinatown': { pattern: /chinatown|yaowarat|เยาวราช|charoen\s*krung|เจริญกรุง|samphanthawong|สัมพันธวงศ์|nana\s*(soi|แขวง)|ป้อมปราบ|ไมตรีจิตต์/i, lat: 13.7401, lng: 100.5101, desc: "Historic Yaowarat district with street food and speakeasies." },
  'riverside': { pattern: /riverside|charoennakorn|เจริญนคร|bang\s*rak|บางรัก|oriental|charoen\s*nakorn/i, lat: 13.7235, lng: 100.5167, desc: "Iconic luxury hotels along the Chao Phraya River." },
  'old-town': { pattern: /old\s*town|rattanakosin|khaosan|khao\s*san|rambut|พระนคร|phra\s*nakhon|banglamphu|ดินสอ|พระสุเมรุ|กรุงเกษม/i, lat: 13.7514, lng: 100.4915, desc: "Historic heart with Grand Palace, Wat Pho, and Khaosan Road." },
  'ratchada': { pattern: /ratchada|รัชดา|din\s*daeng|ดินแดง|huai\s*khwang|ห้วยขวาง|asoke\s*ratchada/i, lat: 13.7631, lng: 100.5735, desc: "Vibrant nightlife district with night markets and bars." },
  'on-nut': { pattern: /on\s*nut|อ่อนนุช|phra\s*khanong|พระโขนง/i, lat: 13.7155, lng: 100.5985, desc: "Up-and-coming area with local bars and affordable eats." },
  'phaya-thai': { pattern: /phaya\s*thai|พญาไท/i, lat: 13.7573, lng: 100.5340, desc: "Central area near Victory Monument with diverse dining." },
  'nonthaburi': { pattern: /nonthaburi|นนทบุรี|บางกรวย|ราชพฤกษ์/i, lat: 13.8621, lng: 100.5144, desc: "Suburb across the river with emerging bar scene." },
  'thonburi': { pattern: /thonburi|ธนบุรี|คลองสาน|ตลิ่งชัน/i, lat: 13.7190, lng: 100.4870, desc: "West bank of the Chao Phraya with riverside venues." },
  'pathumwan': { pattern: /pathumwan|ปทุมวัน|mbk|เกษมสันต์|rama\s*(iv|4)|พระราม\s*4/i, lat: 13.7450, lng: 100.5290, desc: "Central Bangkok area around MBK and National Stadium." },
  'rca': { pattern: /rca|royal\s*city\s*avenue|บางกะปิ/i, lat: 13.7570, lng: 100.5730, desc: "Bangkok's famous nightclub strip." },
}

const MUMBAI_NEIGHBORHOODS = {
  'worli': { pattern: /worli|worl/i, lat: 19.0176, lng: 72.8153, desc: "Upscale area with sea views and premium bars." },
  'lower-parel': { pattern: /lower\s*parel|raghuvanshi/i, lat: 18.9980, lng: 72.8311, desc: "Hip mill-compound district with craft breweries and pubs." },
  'colaba': { pattern: /colaba|apollo\s*bunder|wodehouse/i, lat: 18.9067, lng: 72.8147, desc: "South Mumbai's iconic neighborhood with heritage bars." },
  'bandra': { pattern: /bandra/i, lat: 19.0596, lng: 72.8295, desc: "Trendy suburb with rooftop bars and nightlife." },
  'andheri': { pattern: /andheri/i, lat: 19.1136, lng: 72.8697, desc: "Popular nightlife hub with bars and restaurants." },
  'juhu': { pattern: /juhu/i, lat: 19.0883, lng: 72.8263, desc: "Beach-side dining and cocktail bars." },
  'fort': { pattern: /fort|kala\s*ghoda/i, lat: 18.9322, lng: 72.8347, desc: "Heritage district with speakeasies and wine bars." },
  'powai': { pattern: /powai|hiranandani/i, lat: 19.1176, lng: 72.9060, desc: "IT hub with modern restaurants and bars." },
  'mahalaxmi': { pattern: /mahalaxmi|racecourse/i, lat: 18.9821, lng: 72.8214, desc: "Upscale area with fine dining venues." },
  'bkc': { pattern: /bkc|bandra\s*kurla/i, lat: 19.0645, lng: 72.8657, desc: "Business district with premium restaurants." },
  'malad': { pattern: /malad|goregaon|mind\s*space/i, lat: 19.1863, lng: 72.8486, desc: "Suburban nightlife with popular pubs." },
}

const PATTAYA_NEIGHBORHOODS = {
  'pattaya-beach': { pattern: /pattaya\s*beach|beach\s*road|pattaya\s*2nd|central\s*pattaya/i, lat: 12.9271, lng: 100.8779, desc: "Main beach strip with hotels and rooftop bars." },
  'walking-street': { pattern: /walking\s*street/i, lat: 12.9262, lng: 100.8725, desc: "Famous nightlife strip with bars and clubs." },
  'jomtien': { pattern: /jomtien/i, lat: 12.8840, lng: 100.8670, desc: "Quieter beach area south of Pattaya." },
  'naklua': { pattern: /naklua|wong\s*amat/i, lat: 12.9625, lng: 100.8853, desc: "North Pattaya with boutique bars and seafood." },
  'pratumnak': { pattern: /pratumnak|phra\s*tamnak/i, lat: 12.9133, lng: 100.8698, desc: "Upscale hill area between Pattaya and Jomtien." },
}

const NYC_NEIGHBORHOODS = {
  'fidi': { pattern: /financial\s*district|fidi|water\s*st|wall\s*st/i, lat: 40.7075, lng: -74.0089, desc: "Historic financial district with iconic cocktail bars." },
  'east-village': { pattern: /east\s*village|e\s*\d+th\s*st.*(?:10009|10003)/i, lat: 40.7265, lng: -73.9815, desc: "Dive bars, cocktail dens, and late-night eats." },
  'midtown': { pattern: /midtown|5th\s*ave|mitchell|beekman|murray\s*hill/i, lat: 40.7549, lng: -73.9840, desc: "Tourist hub with rooftop bars and hotel lounges." },
  'flatiron': { pattern: /flatiron|gramercy|230\s*5th|park\s*ave\s*s/i, lat: 40.7395, lng: -73.9903, desc: "Chic neighborhood with rooftop bars and cocktail lounges." },
  'les': { pattern: /lower\s*east\s*side|les|orchard\s*st|rivington|ludlow|allen\s*st|delancey/i, lat: 40.7150, lng: -73.9843, desc: "Trendy nightlife with speakeasies and cocktail bars." },
  'west-village': { pattern: /west\s*village|greenwich|bleecker|hudson\s*st|christopher/i, lat: 40.7358, lng: -74.0036, desc: "Charming streets with wine bars and gastropubs." },
  'soho': { pattern: /soho|spring\s*st|broome|prince/i, lat: 40.7233, lng: -73.9985, desc: "Upscale bars and restaurants in historic loft buildings." },
  'williamsburg': { pattern: /williamsburg|bedford|berry|wythe/i, lat: 40.7081, lng: -73.9571, desc: "Brooklyn's hipster hub with craft cocktail bars." },
  'chelsea': { pattern: /chelsea|w\s*\d+th.*100(01|11)/i, lat: 40.7465, lng: -74.0014, desc: "Art galleries, rooftop bars, and trendy restaurants." },
  'hells-kitchen': { pattern: /hell'?s?\s*kitchen|9th\s*ave|10th\s*ave/i, lat: 40.7638, lng: -73.9918, desc: "Theater district dining with pre-show happy hours." },
  'upper-east-side': { pattern: /upper\s*east/i, lat: 40.7736, lng: -73.9566, desc: "Classic cocktail bars and upscale lounges." },
  'tribeca': { pattern: /tribeca|greenwich\s*st.*10013/i, lat: 40.7163, lng: -74.0086, desc: "Upscale dining and cocktail bars in converted warehouses." },
  'harlem': { pattern: /harlem/i, lat: 40.8116, lng: -73.9465, desc: "Jazz clubs and soulful dining experiences." },
  'astoria': { pattern: /astoria/i, lat: 40.7720, lng: -73.9301, desc: "Queens neighborhood with diverse bars and restaurants." },
  'bushwick': { pattern: /bushwick/i, lat: 40.6944, lng: -73.9213, desc: "Brooklyn arts district with creative bar scene." },
}

function extractNeighborhood(address, city, name = '') {
  const text = address + ' ' + name
  let map
  if (city === 'bangkok') map = BANGKOK_NEIGHBORHOODS
  else if (city === 'mumbai') map = MUMBAI_NEIGHBORHOODS
  else if (city === 'pattaya') map = PATTAYA_NEIGHBORHOODS
  else if (city === 'nyc') map = NYC_NEIGHBORHOODS
  else return null

  for (const [slug, info] of Object.entries(map)) {
    if (info.pattern.test(text)) return slug
  }
  return null
}

function parseTime(t) {
  if (!t) return ''
  t = t.replace(/\s+/g, ' ').trim()
  // Remove day prefixes like "MON ", "SUN ", "THUR ", "Sun-ThR"
  t = t.replace(/^(MON|TUE|WED|THU|THUR|FRI|SAT|SUN|Mon-Wed|Sun-ThR)\s*/i, '')
  const m = t.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i)
  if (!m) return ''
  let h = parseInt(m[1])
  const min = m[2]
  const ampm = (m[3] || '').toUpperCase()
  if (ampm === 'PM' && h < 12) h += 12
  if (ampm === 'AM' && h === 12) h = 0
  return `${h.toString().padStart(2, '0')}:${min}`
}

function parseOpeningHours(text) {
  if (!text) return null
  // Default: same hours every day
  const timeMatch = text.match(/(\d{1,2}:\d{2}\s*(?:AM|PM)?)\s*[-–]\s*(\d{1,2}:\d{2}\s*(?:AM|PM)?)/i)
  if (!timeMatch) return null
  const open = parseTime(timeMatch[1])
  const close = parseTime(timeMatch[2])
  if (!open || !close) return null
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  const hours = {}
  for (const d of days) hours[d] = { open, close }
  // Check for "closed monday" etc.
  const closedMatch = text.match(/closed?\s+(on\s+)?(every\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i)
  if (closedMatch) {
    const closedDay = closedMatch[3].toLowerCase()
    hours[closedDay] = { open: '00:00', close: '00:00' }
  }
  return hours
}

function parseDaysActive(remark, openHours) {
  // Default all days
  const allDays = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
  const r = (remark || '').toLowerCase()
  if (/mon-thu/i.test(r)) return ['mon', 'tue', 'wed', 'thu']
  if (/mon-fri/i.test(r)) return ['mon', 'tue', 'wed', 'thu', 'fri']
  if (/mon-wed/i.test(r)) return ['mon', 'tue', 'wed']
  if (/only\s*sunday/i.test(r)) return ['sun']
  if (/only\s*wednesday/i.test(r)) return ['wed']
  if (/except\s*fri-sat/i.test(r) || /except\s*fri.*sat/i.test(r)) return ['mon', 'tue', 'wed', 'thu', 'sun']
  return allDays
}

// ── PARSE ALL CSVs ──────────────────────────────────────

let venueId = 100
let dealId = 100
const allVenues = []
const usedSlugs = new Set()

function makeUniqueSlug(base) {
  let s = base
  let i = 2
  while (usedSlugs.has(s)) { s = `${base}-${i}`; i++ }
  usedSlugs.add(s)
  return s
}

// Parse primary Bangkok CSV (venues-data.csv)
function parsePrimaryBangkok() {
  const text = readFileSync(resolve(dataRoot, 'venues-data.csv'), 'utf-8')
  const rows = parseCSV(text)
  // Skip header
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i]
    if (!r || r.length < 8) continue
    const [num, name, desc, address, website, image, logo, openHrs, hhStart, hhEnd, hasHH, phone, remark] = r
    if (!name || name.trim() === '') continue

    const cleanName = name.trim()
    const cat = categorize(cleanName, desc || '')
    const slug = makeUniqueSlug(slugify(cleanName))
    const neighborhood = extractNeighborhood(address || '', 'bangkok', cleanName)
    const hasHappyHour = (hasHH || '').toUpperCase() === 'TRUE'
    const hhStartTime = parseTime(hhStart)
    const hhEndTime = parseTime(hhEnd)
    const hours = parseOpeningHours(openHrs)
    const daysActive = parseDaysActive(remark, openHrs)

    venueId++
    dealId++

    const venue = {
      id: `v${venueId}`,
      name: cleanName,
      slug,
      description: (desc || `Popular ${cat} in Bangkok.`).replace(/"""/g, '').replace(/"$/g, '').trim(),
      category: cat,
      subcategories: [],
      city: 'Bangkok',
      citySlug: 'bangkok',
      neighborhood: neighborhood ? Object.entries(BANGKOK_NEIGHBORHOODS).find(([k]) => k === neighborhood)?.[0] : 'sukhumvit',
      neighborhoodSlug: neighborhood || 'sukhumvit',
      address: (address || '').trim(),
      latitude: 13.75,
      longitude: 100.55,
      phone: (phone || '').trim(),
      website: (website || '').startsWith('http') ? website.trim() : '',
      instagram: '',
      lineId: '',
      photos: [],
      logo: '',
      coverImage: '',
      priceRange: 2,
      rating: 4.0 + Math.random() * 0.8,
      reviewCount: Math.floor(200 + Math.random() * 2000),
      isVerified: true,
      openingHours: hours || { monday: { open: '17:00', close: '01:00' }, tuesday: { open: '17:00', close: '01:00' }, wednesday: { open: '17:00', close: '01:00' }, thursday: { open: '17:00', close: '01:00' }, friday: { open: '17:00', close: '01:00' }, saturday: { open: '17:00', close: '01:00' }, sunday: { open: '17:00', close: '01:00' } },
      deals: [],
    }

    // Fix neighborhood name from slug
    const nMap = { 'thonglor': 'Thonglor', 'ekkamai': 'Ekkamai', 'sukhumvit': 'Sukhumvit', 'silom': 'Silom', 'sathorn': 'Sathorn', 'siam': 'Siam', 'ploenchit': 'Ploenchit', 'ari': 'Ari', 'chinatown': 'Chinatown', 'riverside': 'Riverside', 'old-town': 'Old Town', 'ratchada': 'Ratchada', 'on-nut': 'On Nut', 'phaya-thai': 'Phaya Thai', 'nonthaburi': 'Nonthaburi', 'thonburi': 'Thonburi', 'pathumwan': 'Pathumwan', 'rca': 'RCA' }
    venue.neighborhood = nMap[venue.neighborhoodSlug] || 'Sukhumvit'

    if (hasHappyHour && hhStartTime && hhEndTime) {
      venue.deals.push({
        id: `d${dealId}`,
        venueId: venue.id,
        title: `Happy Hour at ${cleanName}`,
        description: (remark || desc || `Happy hour deals available.`).trim().substring(0, 200),
        dealType: 'happy_hour',
        categoryTags: [cat],
        daysActive,
        startTime: hhStartTime,
        endTime: hhEndTime,
        isRecurring: true,
        dealTerms: (remark || 'Check with venue for details.').trim(),
        image: '',
        isActive: true,
        isVerified: true,
      })
    }

    allVenues.push(venue)
  }
}

// Parse additional CSVs (bangkok-additional, mumbai, pattaya, nyc)
function parseAdditionalCSV(filePath, cityName, citySlug, neighborhoodMap, timezone) {
  const text = readFileSync(filePath, 'utf-8')
  const rows = parseCSV(text)

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i]
    if (!r || r.length < 8) continue
    const [num, name, desc, address, website, image, logo, openHrs, hhStart, hhEnd, hasHH, phone, remark] = r
    if (!name || name.trim() === '') continue

    const cleanName = name.trim()
    const cat = categorize(cleanName, desc || '')
    const slug = makeUniqueSlug(slugify(cleanName))
    const neighborhood = extractNeighborhood(address || '', citySlug, cleanName)
    const hasHappyHour = (hasHH || '').toUpperCase() === 'TRUE'
    const isUnverified = (hasHH || '').toUpperCase() === 'UNVERIFIED'
    const hhStartTime = parseTime(hhStart)
    const hhEndTime = parseTime(hhEnd)
    const hours = parseOpeningHours(openHrs)
    const daysActive = parseDaysActive(remark, openHrs)

    venueId++
    dealId++

    const nMap = {}
    for (const [k, v] of Object.entries(neighborhoodMap)) {
      nMap[k] = k.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    }
    // Special name fixes
    if (nMap['fidi']) nMap['fidi'] = 'FiDi'
    if (nMap['les']) nMap['les'] = 'Lower East Side'
    if (nMap['bkc']) nMap['bkc'] = 'BKC'
    if (nMap['rca']) nMap['rca'] = 'RCA'
    if (nMap['upper-east-side']) nMap['upper-east-side'] = 'Upper East Side'
    if (nMap['hells-kitchen']) nMap['hells-kitchen'] = "Hell's Kitchen"

    const defaultNeighborhood = Object.keys(neighborhoodMap)[0]

    const venue = {
      id: `v${venueId}`,
      name: cleanName,
      slug,
      description: (desc || `Popular ${cat} in ${cityName}.`).replace(/"""/g, '').replace(/"$/g, '').trim(),
      category: cat,
      subcategories: [],
      city: cityName,
      citySlug,
      neighborhood: nMap[neighborhood || defaultNeighborhood] || cityName,
      neighborhoodSlug: neighborhood || defaultNeighborhood,
      address: (address || '').trim(),
      latitude: 0,
      longitude: 0,
      phone: (phone || '').trim(),
      website: (website || '').startsWith('http') ? website.trim() : '',
      instagram: '',
      lineId: '',
      photos: [],
      logo: '',
      coverImage: '',
      priceRange: 2,
      rating: 4.0 + Math.random() * 0.8,
      reviewCount: Math.floor(200 + Math.random() * 2000),
      isVerified: !isUnverified,
      openingHours: hours || { monday: { open: '17:00', close: '01:00' }, tuesday: { open: '17:00', close: '01:00' }, wednesday: { open: '17:00', close: '01:00' }, thursday: { open: '17:00', close: '01:00' }, friday: { open: '17:00', close: '01:00' }, saturday: { open: '17:00', close: '01:00' }, sunday: { open: '17:00', close: '01:00' } },
      deals: [],
    }

    if ((hasHappyHour || isUnverified) && hhStartTime && hhEndTime) {
      venue.deals.push({
        id: `d${dealId}`,
        venueId: venue.id,
        title: `Happy Hour at ${cleanName}`,
        description: (remark || desc || `Happy hour deals available.`).replace(/"""/g, '').replace(/"$/g, '').trim().substring(0, 200),
        dealType: 'happy_hour',
        categoryTags: [cat],
        daysActive,
        startTime: hhStartTime,
        endTime: hhEndTime,
        isRecurring: true,
        dealTerms: (remark || 'Check with venue for details.').trim(),
        image: '',
        isActive: true,
        isVerified: !isUnverified,
      })
    }

    allVenues.push(venue)
  }
}

// Run parsers
parsePrimaryBangkok()

parseAdditionalCSV(
  resolve(dataRoot, 'data/bangkok-additional.csv'),
  'Bangkok', 'bangkok', BANGKOK_NEIGHBORHOODS, 'Asia/Bangkok'
)

parseAdditionalCSV(
  resolve(dataRoot, 'data/mumbai.csv'),
  'Mumbai', 'mumbai', MUMBAI_NEIGHBORHOODS, 'Asia/Kolkata'
)

parseAdditionalCSV(
  resolve(dataRoot, 'data/pattaya.csv'),
  'Pattaya', 'pattaya', PATTAYA_NEIGHBORHOODS, 'Asia/Bangkok'
)

parseAdditionalCSV(
  resolve(dataRoot, 'data/nyc.csv'),
  'New York City', 'nyc', NYC_NEIGHBORHOODS, 'America/New_York'
)

console.log(`Total venues parsed: ${allVenues.length}`)
console.log(`Bangkok: ${allVenues.filter(v => v.citySlug === 'bangkok').length}`)
console.log(`Mumbai: ${allVenues.filter(v => v.citySlug === 'mumbai').length}`)
console.log(`Pattaya: ${allVenues.filter(v => v.citySlug === 'pattaya').length}`)
console.log(`NYC: ${allVenues.filter(v => v.citySlug === 'nyc').length}`)

// ── GENERATE venues.ts ──────────────────────────────────
function escStr(s) {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n')
}

function genVenueTS(v) {
  const ohLines = Object.entries(v.openingHours).map(([d, t]) =>
    `      ${d}: { open: '${t.open}', close: '${t.close}' }`
  ).join(',\n')

  const dealLines = v.deals.map(d => `      {
        id: '${d.id}',
        venueId: '${d.venueId}',
        title: '${escStr(d.title)}',
        description: '${escStr(d.description)}',
        dealType: '${d.dealType}',
        categoryTags: [${d.categoryTags.map(t => `'${t}'`).join(', ')}],
        daysActive: [${d.daysActive.map(t => `'${t}'`).join(', ')}],
        startTime: '${d.startTime}',
        endTime: '${d.endTime}',
        isRecurring: true,
        dealTerms: '${escStr(d.dealTerms)}',
        image: '',
        isActive: true,
        isVerified: ${d.isVerified},
      }`).join(',\n')

  return `  {
    id: '${v.id}',
    name: '${escStr(v.name)}',
    slug: '${v.slug}',
    description: '${escStr(v.description)}',
    category: '${v.category}',
    subcategories: [],
    city: '${escStr(v.city)}',
    citySlug: '${v.citySlug}',
    neighborhood: '${escStr(v.neighborhood)}',
    neighborhoodSlug: '${v.neighborhoodSlug}',
    address: '${escStr(v.address)}',
    latitude: ${v.latitude.toFixed(4)},
    longitude: ${v.longitude.toFixed(4)},
    phone: '${escStr(v.phone)}',
    website: '${escStr(v.website)}',
    instagram: '',
    lineId: '',
    photos: [],
    logo: '',
    coverImage: '',
    priceRange: ${v.priceRange} as PriceRange,
    rating: ${v.rating.toFixed(1)},
    reviewCount: ${v.reviewCount},
    isVerified: ${v.isVerified},
    openingHours: {
${ohLines},
    },
    deals: [
${dealLines}
    ],
  }`
}

const venuesTS = `import { type Venue, type Deal, type PriceRange } from '@/types'

// Auto-generated from CSV data. ${allVenues.length} venues across 4 cities.
// Generated on ${new Date().toISOString().split('T')[0]}

export const venues: Venue[] = [
${allVenues.map(genVenueTS).join(',\n')}
]

// Helper functions
export function getVenueBySlug(slug: string): Venue | undefined {
  return venues.find(v => v.slug === slug)
}

export function getVenuesByCity(citySlug: string): Venue[] {
  return venues.filter(v => v.citySlug === citySlug)
}

export function getVenuesByCategory(citySlug: string, categorySlug: string): Venue[] {
  const { CATEGORY_MAP } = require('@/types')
  const category = Object.entries(CATEGORY_MAP).find(([_, v]: [string, any]) => v.slug === categorySlug)?.[0]
  return venues.filter(v => v.citySlug === citySlug && v.category === category)
}

export function getVenuesByNeighborhood(citySlug: string, neighborhoodSlug: string): Venue[] {
  return venues.filter(v => v.citySlug === citySlug && v.neighborhoodSlug === neighborhoodSlug)
}

export function getActiveDeals(timezone = 'Asia/Bangkok'): { venue: Venue; deal: Deal }[] {
  const { isDealActiveNow } = require('@/lib/utils')
  const results: { venue: Venue; deal: Deal }[] = []
  for (const venue of venues) {
    for (const deal of venue.deals) {
      if (isDealActiveNow(deal, timezone)) {
        results.push({ venue, deal })
      }
    }
  }
  return results
}
`

writeFileSync(resolve(projectRoot, 'src/data/venues.ts'), venuesTS)
console.log('✅ Written src/data/venues.ts')

// ── GENERATE cities.ts ──────────────────────────────────
function genNeighborhoods(citySlug, neighborhoodMap) {
  const cityVenues = allVenues.filter(v => v.citySlug === citySlug)
  const usedNeighborhoods = new Set(cityVenues.map(v => v.neighborhoodSlug))

  return Object.entries(neighborhoodMap)
    .filter(([slug]) => usedNeighborhoods.has(slug))
    .map(([slug, info]) => {
      const name = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
      // Fix special names
      const nameMap = { 'fidi': 'FiDi', 'les': 'Lower East Side', 'bkc': 'BKC', 'rca': 'RCA', 'upper-east-side': 'Upper East Side', 'hells-kitchen': "Hell's Kitchen", 'old-town': 'Old Town', 'on-nut': 'On Nut', 'phaya-thai': 'Phaya Thai', 'pattaya-beach': 'Pattaya Beach', 'walking-street': 'Walking Street', 'lower-parel': 'Lower Parel', 'west-village': 'West Village', 'east-village': 'East Village' }
      const displayName = nameMap[slug] || name
      return `      { name: '${escStr(displayName)}', slug: '${slug}', latitude: ${info.lat}, longitude: ${info.lng}, description: '${escStr(info.desc)}' }`
    }).join(',\n')
}

const bangkokCount = allVenues.filter(v => v.citySlug === 'bangkok').length
const mumbaiCount = allVenues.filter(v => v.citySlug === 'mumbai').length
const pattayaCount = allVenues.filter(v => v.citySlug === 'pattaya').length
const nycCount = allVenues.filter(v => v.citySlug === 'nyc').length

const citiesTS = `import { type City } from '@/types'

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
    venueCount: ${bangkokCount},
    image: '/images/cities/bangkok.jpg',
    neighborhoods: [
${genNeighborhoods('bangkok', BANGKOK_NEIGHBORHOODS)}
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
    venueCount: ${mumbaiCount},
    image: '/images/cities/mumbai.jpg',
    neighborhoods: [
${genNeighborhoods('mumbai', MUMBAI_NEIGHBORHOODS)}
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
    venueCount: ${pattayaCount},
    image: '/images/cities/pattaya.jpg',
    neighborhoods: [
${genNeighborhoods('pattaya', PATTAYA_NEIGHBORHOODS)}
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
    venueCount: ${nycCount},
    image: '/images/cities/nyc.jpg',
    neighborhoods: [
${genNeighborhoods('nyc', NYC_NEIGHBORHOODS)}
    ],
  },
]

export function getCityBySlug(slug: string): City | undefined {
  return cities.find(c => c.slug === slug)
}

export function getActiveCities(): City[] {
  return cities.filter(c => c.isActive)
}
`

writeFileSync(resolve(projectRoot, 'src/data/cities.ts'), citiesTS)
console.log('✅ Written src/data/cities.ts')
