# Sitemap Generation Guide

## 📍 Overview

This project includes a dynamic sitemap generator that automatically creates a `sitemap.xml` file including:
- All static pages (Home, Privacy, Accessibility)
- All published articles from Firestore

## 🚀 Quick Start

### Generate Sitemap Manually

```bash
npm run generate-sitemap
```

This will:
1. Connect to your Firestore database
2. Fetch all published articles
3. Generate `public/sitemap.xml` with all URLs
4. Include proper lastmod dates from article `updatedAt` timestamps

## 📁 File Locations

- **Sitemap Output**: `public/sitemap.xml`
- **Generator Script**: `scripts/generate-sitemap.js`
- **Robots.txt**: `public/robots.txt` (includes sitemap reference)

## 🌐 Production URL

After deployment to Vercel, your sitemap will be available at:

```
https://www.ranw.tech/sitemap.xml
```

## 🔄 Workflow

### Option 1: Manual Generation (Before Deployment)

1. Run the generator locally:
   ```bash
   npm run generate-sitemap
   ```

2. Commit the updated `sitemap.xml`:
   ```bash
   git add public/sitemap.xml
   git commit -m "Update sitemap"
   git push
   ```

3. Vercel will automatically deploy with the new sitemap

### Option 2: Automate on Build (Recommended)

You can add the sitemap generation to your build process by updating `package.json`:

```json
{
  "scripts": {
    "prebuild": "npm run generate-sitemap",
    "build": "vite build"
  }
}
```

This will automatically regenerate the sitemap before each build.

## 📊 Sitemap Structure

### Static Pages (Priority)
- Homepage: `priority: 1.0`, `changefreq: weekly`
- Privacy: `priority: 0.5`, `changefreq: monthly`
- Accessibility: `priority: 0.5`, `changefreq: monthly`

### Dynamic Pages (Articles)
- Articles: `priority: 0.8`, `changefreq: monthly`
- Uses actual `updatedAt` date from Firestore

## 🔍 Submit to Search Engines

### Google Search Console
1. Go to https://search.google.com/search-console
2. Add property: `https://www.ranw.tech`
3. Submit sitemap: `https://www.ranw.tech/sitemap.xml`

### Bing Webmaster Tools
1. Go to https://www.bing.com/webmasters
2. Add site: `https://www.ranw.tech`
3. Submit sitemap: `https://www.ranw.tech/sitemap.xml`

## 🛠️ Customization

To add more static pages, edit `scripts/generate-sitemap.js`:

```javascript
const staticPages = [
  { url: '/', priority: '1.0', changefreq: 'weekly' },
  { url: '/privacy', priority: '0.5', changefreq: 'monthly' },
  { url: '/accessibility', priority: '0.5', changefreq: 'monthly' },
  // Add your new page here:
  { url: '/about', priority: '0.7', changefreq: 'monthly' },
];
```

## ✅ Verification

After deployment, verify your sitemap:

1. Visit: https://www.ranw.tech/sitemap.xml
2. Use [XML Sitemap Validator](https://www.xml-sitemaps.com/validate-xml-sitemap.html)
3. Check in Google Search Console

## 🔧 Troubleshooting

### Sitemap not found (404)
- Make sure `public/sitemap.xml` exists
- Verify it's committed to git
- Check Vercel deployment logs

### Articles missing from sitemap
- Check that articles have `status: 'published'` in Firestore
- Run the generator script and check the output count
- Verify Firebase credentials in `.env`

### Sitemap not updating
- Delete old `public/sitemap.xml`
- Run `npm run generate-sitemap` again
- Commit and push the new file

## 📝 Notes

- The sitemap is generated from your **production Firestore database**
- Make sure your `.env` file has correct Firebase credentials
- Only articles with `status === 'published'` are included
- The script uses the article's `updatedAt` or `createdAt` for the `lastmod` date
