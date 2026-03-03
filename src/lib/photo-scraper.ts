import axios from 'axios';
import * as cheerio from 'cheerio';
import { URL } from 'url';

interface ScrapedPhoto {
  url: string;
  source: string;
  width?: number;
  height?: number;
}

const MIN_WIDTH = 400;
const MIN_HEIGHT = 300;
const MAX_PHOTOS = 10;

// Check if URL is allowed by robots.txt
async function checkRobotsAllowed(websiteUrl: string): Promise<boolean> {
  try {
    const urlObj = new URL(websiteUrl);
    const robotsUrl = `${urlObj.protocol}//${urlObj.hostname}/robots.txt`;
    
    const response = await axios.get(robotsUrl, { timeout: 5000 });
    // If robots.txt exists and doesn't explicitly disallow, allow scraping
    const text = response.data.toLowerCase();
    
    // Simple check: if it says "Disallow: /", be conservative
    if (text.includes('disallow: /')) {
      return false;
    }
    
    return true;
  } catch (error) {
    // If robots.txt doesn't exist or error, allow scraping
    return true;
  }
}

// Extract absolute URL from relative or absolute URLs
function toAbsoluteUrl(url: string, baseUrl: string): string {
  try {
    const base = new URL(baseUrl);
    return new URL(url, base).toString();
  } catch {
    return url;
  }
}

// Check if image is likely to be a real photo (not icon/logo)
function isLikelyRealPhoto(src: string): boolean {
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

// Scrape photos from a website
export async function scrapeVenuePhotos(websiteUrl: string): Promise<ScrapedPhoto[]> {
  if (!websiteUrl) return [];
  
  try {
    // Check robots.txt first
    const allowed = await checkRobotsAllowed(websiteUrl);
    if (!allowed) {
      console.log(`[SCRAPER] robots.txt disallows scraping: ${websiteUrl}`);
      return [];
    }
    
    // Fetch HTML
    const response = await axios.get(websiteUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PhotoScraper/1.0; +http://lovehappyhours.com)'
      }
    });
    
    const html = response.data;
    const $ = cheerio.load(html);
    const photos: ScrapedPhoto[] = [];
    
    // Extract images from various sources
    const sources = [
      { selector: 'img[src]', attr: 'src', priority: 1 },
      { selector: 'picture img[src]', attr: 'src', priority: 1 },
      { selector: '[style*="background-image"]', attr: 'style', priority: 2 },
      { selector: 'img[data-src]', attr: 'data-src', priority: 2 }
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
        
        if (!imageUrl) return;
        
        // Filter out poor candidates
        if (!isLikelyRealPhoto(imageUrl)) return;
        
        // Convert to absolute URL
        const absoluteUrl = toAbsoluteUrl(imageUrl, websiteUrl);
        
        // Check if already in list
        if (photos.some(p => p.url === absoluteUrl)) return;
        
        photos.push({
          url: absoluteUrl,
          source: new URL(websiteUrl).hostname,
        });
      });
    }
    
    // Additional: Try to find images from common gallery selectors
    if (photos.length < MAX_PHOTOS) {
      $('[class*="gallery"] img, [class*="carousel"] img, [class*="slider"] img').each((_, el) => {
        if (photos.length >= MAX_PHOTOS) return;
        
        const src = $(el).attr('src') || $(el).attr('data-src');
        if (!src || !isLikelyRealPhoto(src)) return;
        
        const absoluteUrl = toAbsoluteUrl(src, websiteUrl);
        if (photos.some(p => p.url === absoluteUrl)) return;
        
        photos.push({
          url: absoluteUrl,
          source: new URL(websiteUrl).hostname,
        });
      });
    }
    
    console.log(`[SCRAPER] Found ${photos.length} photos from ${websiteUrl}`);
    return photos;
  } catch (error) {
    console.error(`[SCRAPER] Error scraping ${websiteUrl}:`, error);
    return [];
  }
}

// Format photos for storage (just URLs + attribution)
export function formatPhotosForStorage(photos: ScrapedPhoto[]): string[] {
  return photos.map(p => p.url).filter(url => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  });
}
