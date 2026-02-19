/**
 * Generate dynamic sitemap.xml including all published articles from Firestore
 * 
 * Usage:
 * 1. Make sure you have .env file with Firebase config
 * 2. Run: node scripts/generate-sitemap.js
 * 3. The sitemap.xml will be generated in public/sitemap.xml
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const SITE_URL = 'https://www.ranw.tech';

async function generateSitemap() {
  console.log('🚀 Starting sitemap generation...');
  
  // Static pages
  const staticPages = [
    { url: '/', priority: '1.0', changefreq: 'weekly' },
    { url: '/privacy', priority: '0.5', changefreq: 'monthly' },
    { url: '/accessibility', priority: '0.5', changefreq: 'monthly' },
  ];
  
  // Fetch published articles from Firestore
  console.log('📚 Fetching published articles from Firestore...');
  const articlesQuery = query(
    collection(db, 'articles'),
    where('status', '==', 'published')
  );
  const articlesSnapshot = await getDocs(articlesQuery);
  
  const articles = articlesSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      slug: data.slug,
      updatedAt: data.updatedAt?.toDate() || data.createdAt?.toDate() || new Date(),
    };
  });
  
  console.log(`✅ Found ${articles.length} published articles`);
  
  // Generate XML
  const today = new Date().toISOString().split('T')[0];
  
  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
  
  // Add static pages
  staticPages.forEach(page => {
    sitemap += `
  <url>
    <loc>${SITE_URL}${page.url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
  });
  
  // Add article pages
  articles.forEach(article => {
    const lastmod = article.updatedAt.toISOString().split('T')[0];
    sitemap += `
  <url>
    <loc>${SITE_URL}/articles/${article.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;
  });
  
  sitemap += `
</urlset>`;
  
  // Write to file
  const outputPath = join(__dirname, '..', 'public', 'sitemap.xml');
  writeFileSync(outputPath, sitemap, 'utf-8');
  
  console.log(`✅ Sitemap generated successfully at: ${outputPath}`);
  console.log(`📊 Total URLs: ${staticPages.length + articles.length}`);
  console.log(`   - Static pages: ${staticPages.length}`);
  console.log(`   - Article pages: ${articles.length}`);
  
  process.exit(0);
}

generateSitemap().catch(error => {
  console.error('❌ Error generating sitemap:', error);
  process.exit(1);
});
