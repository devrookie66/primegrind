# Deployment Guide: GitHub + Render.com

## Prerequisites
- GitHub account
- Render.com account (free tier works)
- Discord Bot Token, Client ID, and Guild ID

## Step 1: Push to GitHub

1. Initialize git repository (if not already):
```bash
git init
git add .
git commit -m "Initial commit: LinkSync Discord Bot"
```

2. Create a new repository on GitHub (don't initialize with README)

3. Push your code:
```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

## Step 2: Deploy on Render

### Option A: Using render.yaml (Recommended)

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **New** → **Blueprint**
3. Connect your GitHub repository
4. Render will detect `render.yaml` and create:
   - MongoDB database
   - Web service (the bot)
5. Add environment variables in the Render dashboard:
   - `DISCORD_TOKEN` = your bot token
   - `CLIENT_ID` = your Discord application client ID
   - `GUILD_ID` = your Discord server (guild) ID
6. Click **Apply** to deploy

### Option B: Manual Setup

1. **Create MongoDB Database:**
   - New → Database → MongoDB
   - Name: `linksync-mongodb`
   - Plan: Free
   - Copy the Internal Connection String

2. **Create Web Service:**
   - New → Web Service
   - Connect your GitHub repository
   - Name: `linksync-bot`
   - Runtime: Node
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run start`
   - Plan: Free
   - Add Environment Variables:
     - `DISCORD_TOKEN` = your token
     - `CLIENT_ID` = your client ID
     - `GUILD_ID` = your guild ID
     - `MONGO_URI` = MongoDB connection string from step 1
     - `PORT` = 3000
     - `ALLOWED_LINK_DOMAINS` = ouo.io,tr.link,cuty.io
     - `POINTS_PER_CLICK` = 1

3. Click **Create Web Service**

## Step 3: Register Discord Commands

After deployment succeeds:

1. Open the Render Shell (click **Shell** tab in your service)
2. Run:
```bash
npm run register
```

Or locally with your production env vars:
```bash
DISCORD_TOKEN=xxx CLIENT_ID=xxx GUILD_ID=xxx npm run register
```

## Step 4: Test the Bot

1. In your Discord server, run `/setup` in any channel
2. The bot will post two panels:
   - **Earn Links** - click "Get a Link"
   - **Submit Links** - click "Submit Link" or "Manage Budget"

## Troubleshooting

### Bot won't start
- Check Render logs for errors
- Verify all environment variables are set correctly
- Ensure MongoDB is running and connection string is correct

### Commands not showing
- Make sure you ran `npm run register`
- Verify `CLIENT_ID` and `GUILD_ID` are correct
- Wait a few minutes for Discord to sync commands

### Health check failing
- The bot exposes `/healthz` endpoint on PORT 3000
- Render's health check should use this path

## Important Notes

1. **Never commit `.env` file** - it's already in `.gitignore`
2. **Rotate your token** if accidentally exposed
3. **Free tier limitations:**
   - Render spins down after 15 min of inactivity
   - MongoDB has 512MB storage limit
   - Web service has 750 hours/month

## Monitoring

- View logs: Render Dashboard → Your Service → Logs
- Health check: `https://your-service.onrender.com/healthz`
- API endpoint: `https://your-service.onrender.com/api/link/next/USER_ID`


