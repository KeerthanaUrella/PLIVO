# Deployment Guide - AI Playground

This guide will help you deploy the AI Playground application to Vercel.

## 🚀 Quick Deploy to Vercel

### Option 1: Deploy with Vercel CLI (Recommended)

1. **Install Vercel CLI globally**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy from project directory**
   ```bash
   vercel
   ```

4. **Follow the prompts**
   - Project name: `ai-playground-app`
   - Framework preset: `Vite`
   - Build command: `npm run build`
   - Output directory: `dist`
   - Install dependencies: `Yes`

### Option 2: Deploy via GitHub Integration

1. **Push code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/ai-playground-app.git
   git push -u origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Configure build settings:
     - Framework Preset: `Vite`
     - Build Command: `npm run build`
     - Output Directory: `dist`
   - Click "Deploy"

### Option 3: Manual Deployment

1. **Build the project**
   ```bash
   npm install
   npm run build
   ```

2. **Upload to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Choose "Upload"
   - Upload the `dist` folder
   - Deploy

## 🔧 Environment Configuration

### For Production Deployment

Create a `.env` file in the root directory:

```env
# API Configuration (for future real AI integration)
VITE_API_URL=https://your-api-endpoint.com
VITE_AI_SERVICE_KEY=your_ai_service_key

# Application Configuration
VITE_APP_NAME=AI Playground
VITE_APP_VERSION=1.0.0
```

### Vercel Environment Variables

In your Vercel dashboard:
1. Go to Project Settings
2. Navigate to Environment Variables
3. Add the variables from your `.env` file

## 📁 Project Structure for Deployment

```
ai-playground-app/
├── public/
│   └── vite.svg
├── src/
│   ├── components/
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── ConversationAnalysis.tsx
│   │   ├── ImageAnalysis.tsx
│   │   └── DocumentSummarization.tsx
│   ├── contexts/
│   │   └── AuthContext.tsx
│   ├── data/
│   │   └── demoData.ts
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css
│   └── App.css
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vercel.json
├── .gitignore
└── README.md
```

## 🎯 Post-Deployment Checklist

- [ ] Application loads without errors
- [ ] Login functionality works
- [ ] All three AI skills are accessible
- [ ] File upload works for all supported formats
- [ ] Mock AI processing displays realistic results
- [ ] Responsive design works on mobile devices
- [ ] Navigation between pages functions correctly

## 🔍 Troubleshooting

### Common Issues

1. **Build fails with TypeScript errors**
   ```bash
   npm run type-check
   ```
   Fix any TypeScript errors before deploying.

2. **Assets not loading**
   - Check that `vercel.json` is properly configured
   - Ensure all file paths are correct

3. **Routing issues**
   - Verify that `vercel.json` includes the rewrite rule for SPA routing
   - Check that React Router is properly configured

4. **Environment variables not working**
   - Ensure variables are prefixed with `VITE_`
   - Check Vercel environment variable configuration

### Performance Optimization

1. **Enable compression**
   ```json
   {
     "headers": [
       {
         "source": "/(.*)",
         "headers": [
           {
             "key": "Content-Encoding",
             "value": "gzip"
           }
         ]
       }
     ]
   }
   ```

2. **Cache static assets**
   ```json
   {
     "headers": [
       {
         "source": "/assets/(.*)",
         "headers": [
           {
             "key": "Cache-Control",
             "value": "public, max-age=31536000, immutable"
           }
         ]
       }
     ]
   }
   ```

## 🌐 Custom Domain (Optional)

1. **Add custom domain in Vercel**
   - Go to Project Settings
   - Navigate to Domains
   - Add your custom domain

2. **Configure DNS**
   - Add CNAME record pointing to your Vercel deployment
   - Wait for DNS propagation

## 📊 Analytics and Monitoring

### Vercel Analytics
- Enable Vercel Analytics in project settings
- Monitor performance and user behavior

### Error Tracking
- Consider integrating Sentry for error tracking
- Monitor application health and performance

## 🔄 Continuous Deployment

### GitHub Integration
- Connect your GitHub repository to Vercel
- Automatic deployments on every push to main branch
- Preview deployments for pull requests

### Branch Deployments
- `main` branch → Production
- `develop` branch → Preview
- Feature branches → Preview deployments

## 🎉 Success!

Your AI Playground application is now deployed and ready for use! Users can:

1. Visit your deployed URL
2. Login with any email/password
3. Explore the three AI capabilities
4. Upload files and see mock AI processing
5. Experience the modern, responsive interface

## 📞 Support

If you encounter any issues during deployment:

1. Check the Vercel deployment logs
2. Review the troubleshooting section above
3. Open an issue in the GitHub repository
4. Contact Vercel support if needed

---

**Note**: This is a demonstration application with simulated AI processing. For production use with real AI services, integrate actual AI APIs and implement proper security measures.
