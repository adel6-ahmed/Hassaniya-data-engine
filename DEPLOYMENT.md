# Deployment Guide - Hassaniya Dataset Platform

This guide explains how to deploy the Hassaniya Dataset Platform to production.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Setup](#database-setup)
4. [Deployment Options](#deployment-options)
5. [Post-Deployment Verification](#post-deployment-verification)

---

## Prerequisites

- Node.js 18+ 
- npm or yarn
- PostgreSQL database (Supabase is recommended)
- Supabase account (for vector search, file storage, auth)
- Git (for version control)

---

## Environment Setup

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/hassaniya-dataset-platform.git
cd hassaniya-dataset-platform
npm install
```

### 2. Configure Environment Variables
Copy the example environment file and fill in your production values:

```bash
cp .env.example .env.local
```

Edit `.env.local` and set:

#### Authentication
```bash
AUTH_SECRET=<generate-with: openssl rand -base64 32>
AUTH_URL=https://yourdomain.com
AUTH_GOOGLE_ID=<from Google Cloud Console>
AUTH_GOOGLE_SECRET=<from Google Cloud Console>
AUTH_GITHUB_ID=<from GitHub OAuth settings>
AUTH_GITHUB_SECRET=<from GitHub OAuth settings>
```

#### Database (PostgreSQL)
```bash
DATABASE_URL=postgresql://user:password@host:5432/database
DIRECT_URL=postgresql://user:password@host:5432/database
```

#### Supabase
```bash
NEXT_PUBLIC_SUPABASE_URL=https://project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## Database Setup

### 1. Create Database (if using self-hosted PostgreSQL)
```sql
CREATE DATABASE hassaniya_db;
CREATE USER app_user WITH PASSWORD 'strong_password';
GRANT ALL PRIVILEGES ON DATABASE hassaniya_db TO app_user;
```

### 2. Run Prisma Migrations
```bash
# Deploy all pending migrations to production
npx prisma migrate deploy

# Optional: Seed initial data
npx prisma db seed
```

### 3. Verify Database
```bash
npx prisma studio  # Opens Prisma data explorer
```

---

## Deployment Options

### Option 1: Vercel (Recommended for Next.js)

1. **Connect GitHub Repository**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository

2. **Configure Environment Variables**
   - In Vercel dashboard, go to Settings → Environment Variables
   - Add all variables from `.env.example`
   - Ensure sensitive keys (SERVICE_ROLE_KEY, AUTH_SECRET) are marked as secret

3. **Deploy**
   - Vercel automatically detects Next.js
   - Click "Deploy"
   - Vercel runs `npm run build` and deploys

4. **Enable Production Database**
   - Set `NODE_ENV=production` in environment variables
   - Verify DATABASE_URL points to production database

### Option 2: Netlify

1. **Connect GitHub**
   - Go to [netlify.com](https://netlify.com)
   - Click "New site from Git"
   - Choose GitHub and your repository

2. **Build Configuration**
   - Build command: `npm run build`
   - Publish directory: `.next`

3. **Environment Variables**
   - In Netlify: Site settings → Build & deploy → Environment
   - Add all variables from `.env.example`

4. **Deploy**
   - Netlify automatically triggers deployment on Git push

### Option 3: Self-Hosted (Docker/VPS)

1. **Build Docker Image**
   ```bash
   docker build -t hassaniya:latest .
   ```
   
   *Create `Dockerfile` if not present:*
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --omit=dev
   COPY . .
   RUN npm run build
   EXPOSE 3000
   CMD ["npm", "start"]
   ```

2. **Run Container**
   ```bash
   docker run -p 3000:3000 \
     -e DATABASE_URL=$DATABASE_URL \
     -e AUTH_SECRET=$AUTH_SECRET \
     -e NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
     -e NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY \
     -e SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY \
     hassaniya:latest
   ```

3. **Nginx Reverse Proxy** (Optional)
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

### Option 4: Railway, Render, or Similar PaaS

1. **Connect Repository**
   - Follow platform's GitHub integration steps
   - Select `main` or `production` branch

2. **Add Environment Variables**
   - Use platform's dashboard to add all `.env.example` variables

3. **Configure Build & Start Commands**
   - Build: `npm run build`
   - Start: `npm start`

4. **Connect to Database**
   - Use platform's managed PostgreSQL, or
   - Provide external DATABASE_URL

---

## Post-Deployment Verification

### 1. Test Application
```bash
# After deployment, visit your domain
curl https://yourdomain.com

# Should return HTML with status 200
```

### 2. Verify Authentication
- Visit `/auth/signin`
- Try signing up if Credentials provider is enabled
- Test Google/GitHub OAuth if configured

### 3. Check Database Connection
- Go to `/dashboard`
- Create sample content (sentence, proverb, FAQ, etc.)
- Verify data appears in database

### 4. Check Logs
```bash
# Vercel
vercel logs

# Railway/Render
# Use platform's log viewer
```

### 5. Lightouse & Performance
```bash
# Test performance
npm run build
npm run start
# Visit https://pagespeed.web.dev
```

### 6. Security Checklist
- [ ] `AUTH_SECRET` is a strong random value
- [ ] `.env.local` is in `.gitignore`
- [ ] Service role key is not exposed to frontend
- [ ] HTTPS is enforced
- [ ] CORS is properly configured
- [ ] Database backups are enabled

---

## Troubleshooting

### Build Fails
```bash
# Clear cache and rebuild locally
rm -rf .next node_modules
npm install
npm run build
```

### Database Connection Error
```bash
# Test connection
npx prisma db execute --stdin < /dev/null

# Check connection string format
# postgresql://user:password@host:port/database
```

### Authentication Not Working
- Verify `AUTH_SECRET` is set
- Verify `AUTH_URL` matches your domain
- Check OAuth credentials (Google/GitHub) are correct
- Ensure NEXTAUTH_URL environment variable is NOT set (use AUTH_URL)

### Supabase Integration Issues
- Verify project URL and keys in Supabase dashboard
- Check RLS (Row Level Security) policies are correct
- Ensure Edge Functions are deployed (if using)

---

## Monitoring & Maintenance

### Enable Error Tracking
- Integrate Sentry or similar for error monitoring
- Set up alerts for critical errors

### Database Backups
- Supabase: Automatic daily backups enabled by default
- Self-hosted: Set up automated backups using `pg_dump`

### Update Dependencies
```bash
# Check for updates
npm outdated

# Update packages (carefully)
npm update
npm audit fix
```

### Monitor Performance
- Use Next.js Analytics
- Monitor database query performance
- Set up uptime monitoring (UptimeRobot, etc.)

---

## Questions?

See [README.md](./README.md) for architecture and development details.
