#!/usr/bin/env node

/**
 * Batch photo scraper for all venues with websites
 * Usage: node scripts/scrape-all-photos.js
 */

const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const cheerio = require('cheerio');
const { URL } = require('url');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const MIN_WIDTH = 400;
const MIN_HEIGHT = 300;
const MAX_PHOTOS = 10;

function isLikelyRealPhoto(src) {
  const blacklist = [
    'logo', 'icon', 'favicon', 'avatar', 'profile',
    'button', 'badge', 'flag', 'star', 'arrow',
    'social', 'twitter', 'facebook', 'instagram',
    'placeholder', 'loading', 'error', 'default',
    '.svg', '.gif', 'transparent', '1x1', 'pixel'
  ];
  
  const srcLower = src.toLowerCase();
  return !blacklist.some(term => srcLower.includes(term));
}

function toAbsoluteUrl(url, baseUrl) {
  try {
    const base = new URL(baseUrl);
    return new URL(url, base).toString();
  } catch {
    return url;
  }
}

async function scrapeVenuePhotos(websiteUrl) {
  try {
    const response = await axios.get(websiteUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PhotoScraper/1.0)'
      }
    });

    const html = response.data;
    const $ = cheerio.load(html);
    const photos = [];

    // Extract images
    const sources = [
      { selector: 'img[src]', attr: 'src', priority: 1 },
      { selector: 'picture img[src]', attr: 'src', priority: 1 },
      { selector: '[style*="background-image"]', attr: 'style', priority: 2 },
    ];

    for (const source of sources) {
      $(source.selector).each((_, el) => {
        if (photos.length >= MAX_PHOTOS) return;

        let imageUrl = '';

        if (source.attr === 'style') {
          const style = $(el).attr(source.attr);
          const match = style?.match(/url\(['"]?([^'"()]+)['"]?\)/);
          if (match) imageUrl = match[1];
        } else {
          imageUrl = $(el).attr(source.attr) || '';
        }

        if (!imageUrl || !isLikelyRealPhoto(imageUrl)) return;

        const absoluteUrl = toAbsoluteUrl(imageUrl, websiteUrl);

        if (photos.some(p => p === absoluteUrl)) return;

        photos.push(absoluteUrl);
      });
    }

    return photos;
  } catch (error) {
    console.error(`  Error scraping ${websiteUrl}:`, error.message);
    return [];
  }
}

async function main() {
  console.log('📸 Starting batch photo scraper...\n');

  // Get all venues with websites
  const { data: venues, error } = await supabase
    .from('venues')
    .select('id, name, website')
    .not('website', 'is', null)
    .not('website', 'eq', '')
    .order('name');

  if (error) {
    console.error('Error fetching venues:', error);
    process.exit(1);
  }

  console.log(`Found ${venues.length} venues with websites\n`);

  let successCount = 0;
  let failedCount = 0;

  for (const venue of venues) {
    console.log(`[${successCount + failedCount + 1}/${venues.length}] ${venue.name}`);

    try {
      const photos = await scrapeVenuePhotos(venue.website);

      if (photos.length === 0) {
        console.log(`  ⚠️  No photos found\n`);
        failedCount++;
        continue;
      }

      // Update venue
      const { error: updateError } = await supabase
        .from('venues')
        .update({ photos })
        .eq('id', venue.id);

      if (updateError) {
        console.log(`  ❌ Update failed: ${updateError.message}\n`);
        failedCount++;
      } else {
        console.log(`  ✅ Updated with ${photos.length} photos\n`);
        successCount++;
      }
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}\n`);
      failedCount++;
    }

    // Rate limit: small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n📊 Summary:');
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${failedCount}`);
  console.log(`\nDone! Photos populated in Supabase.`);
}

main().catch(console.error);
