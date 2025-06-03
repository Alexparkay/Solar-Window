# Solar Window - Deployment Guide

## Vercel Deployment

This guide will help you deploy the Solar Window application to Vercel.

### Prerequisites

1. A [Vercel account](https://vercel.com/signup)
2. A [Google Maps API key](https://developers.google.com/maps/documentation/javascript/get-api-key)
3. (Optional) An [EIA API key](https://www.eia.gov/opendata/register.php) for regional energy data

### Environment Variables

Before deploying, you need to configure the following environment variables in your Vercel project:

#### Required Variables

- `VITE_GOOGLE_MAPS_API_KEY`: Your Google Maps JavaScript API key
  - Get it from: https://console.cloud.google.com/google/maps-apis/
  - Make sure to enable the following APIs:
    - Maps JavaScript API
    - Solar API
    - Geocoding API

#### Optional Variables

- `VITE_EIA_API_KEY`: Your EIA (Energy Information Administration) API key
  - Get it from: https://www.eia.gov/opendata/register.php
  - If not provided, the app will use a default key with limited quota

### Deployment Steps

#### Option 1: Deploy via Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy the project:
   ```bash
   vercel
   ```

4. Set environment variables:
   ```bash
   vercel env add VITE_GOOGLE_MAPS_API_KEY
   vercel env add VITE_EIA_API_KEY
   ```

5. Redeploy with environment variables:
   ```bash
   vercel --prod
   ```

#### Option 2: Deploy via Vercel Dashboard

1. Push your code to GitHub
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "New Project"
4. Import your GitHub repository
5. Configure environment variables in the project settings:
   - Go to Settings → Environment Variables
   - Add `VITE_GOOGLE_MAPS_API_KEY`
   - Add `VITE_EIA_API_KEY` (optional)
6. Deploy

### Build Configuration

The project is already configured with:
- ✅ `@sveltejs/adapter-vercel` for Vercel deployment
- ✅ `vercel.json` configuration file
- ✅ Proper build scripts in `package.json`

### API Setup Required

#### Google Maps API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the following APIs:
   - Maps JavaScript API
   - Solar API  
   - Geocoding API
4. Create credentials (API Key)
5. Restrict the API key to your domain for security

#### Google Solar API Setup

Make sure your Google Cloud project has the Solar API enabled:
1. Go to APIs & Services → Library
2. Search for "Solar API"
3. Click Enable

### Post-Deployment

After successful deployment:

1. Test the application with different addresses
2. Verify that the Solar API responses are working
3. Check that regional energy data loads (if EIA API is configured)
4. Test the embedding functionality

### Troubleshooting

#### Common Issues

1. **"Solar API not enabled"**: Make sure Solar API is enabled in your Google Cloud project
2. **"API key not valid"**: Check that your API key is correct and has proper restrictions
3. **"Quota exceeded"**: Check your Google Cloud billing and quota limits
4. **Build fails**: Make sure all dependencies are installed and TypeScript types are correct

#### Environment Variable Issues

- Environment variables in Vite must start with `VITE_`
- Make sure to redeploy after adding environment variables
- Check Vercel function logs for runtime errors

### Performance Considerations

- The application includes large GeoTIFF processing libraries
- Consider implementing dynamic imports for better performance
- Monitor bundle sizes and Core Web Vitals

### Security

- Restrict your Google Maps API key to your production domain
- Use environment variables for all sensitive keys
- Never commit API keys to your repository

## Support

For deployment issues:
1. Check Vercel function logs
2. Review the application console for client-side errors
3. Verify API quotas and billing in Google Cloud Console 