# LinkSync Discord Bot

A Discord bot that lets users earn points by visiting shortened links and spend points to submit their own links into rotation.

## Features
- 🔗 Earn points by visiting verified links
- 💰 Submit links with points-backed budget
- 📊 Manage link budgets (add/remove points)
- 🔄 Circular queue avoids repeat visits per user
- 💾 MongoDB persistence
- 🌐 Express API with health checks
- 🎛️ Web-based Admin Panel with real-time statistics
- 📈 Auto-updating status panels in Discord
- ☁️ Ready for Render.com deployment

## Quick Start

### Local Development
```bash
npm install
npm run build
npm run start
```

Register commands:
```bash
npm run register:dev
```

### Deploy to Render.com
See [DEPLOY.md](./DEPLOY.md) for complete deployment instructions.

**Quick steps:**
1. Push to GitHub
2. Create Blueprint on Render using `render.yaml`
3. Add Discord env vars (`DISCORD_TOKEN`, `CLIENT_ID`, `GUILD_ID`)
4. Run `npm run register` in Render shell
5. Use `/setup` command in Discord

## Environment Variables

Create `.env` for local development:

```env
DISCORD_TOKEN=your_discord_bot_token
CLIENT_ID=your_discord_app_client_id
GUILD_ID=your_guild_id
MONGO_URI=mongodb://localhost:27017/linksync
PORT=3000
ALLOWED_LINK_DOMAINS=ouo.io,tr.link,cuty.io
POINTS_PER_CLICK=1
ADMIN_PASSWORD=your_secure_admin_password
ADMIN_USERS=admin_discord_user_id_1,admin_discord_user_id_2
```

## Discord Setup
1. Create Application at [Discord Developer Portal](https://discord.com/developers/applications)
2. Create bot and copy token
3. Enable intents: `MESSAGE_CONTENT`, `GUILD_MESSAGES`, `GUILD_MEMBERS`
4. Invite bot to server with `applications.commands` scope
5. Run `/setup` in a channel to post interaction panels

## API Endpoints

### Public Endpoints
- `GET /api/link/next/:userId` → returns next available link
- `POST /api/verify-click` → verifies visit and awards points
- `GET /healthz` → health check

### Admin Panel
- `GET /admin` → Web-based admin panel (password protected)
- `GET /api/admin/config` → Get current configuration
- `PUT /api/admin/config` → Update configuration
- `GET /api/admin/statistics` → Get system statistics
- `GET /api/admin/links` → List all links with pagination
- `DELETE /api/admin/links/:linkId` → Delete a link
- `GET /api/admin/users` → List all users with pagination
- `PUT /api/admin/users/:userId` → Update user balance

**Access Admin Panel:** Navigate to `http://localhost:3000/admin` (or your deployed URL)

## Admin Panel Features

The admin panel provides a comprehensive web interface for managing your bot:

### 📊 Real-time Statistics
- Total links in system
- Active links (with budget > 0)
- Total users registered
- Total budget across all links
- Total points in circulation
- Auto-refreshes every 30 seconds

### ⚙️ Configuration Management
- **Points per Click**: Adjust reward amount for verified link visits
- **Allowed Domains**: Manage which link shortener domains are permitted
- Changes apply instantly without bot restart

### 🔗 Link Management
- View all submitted links with pagination
- See budget, owner, visitor count for each link
- Delete problematic links
- Monitor link creation dates

### 👥 User Management
- List all users with their balances
- Edit user balances directly
- Sort by richest users
- Track user engagement

### 🏆 Leaderboards
- Top 10 links by remaining budget
- Top 10 users by balance
- Quick overview of most active participants

### 🔐 Security
- Password-protected access (Bearer token authentication)
- Secure admin-only routes
- Token stored in browser localStorage
- Automatic logout on unauthorized access

## Tech Stack
- Node.js + TypeScript
- discord.js v14
- Express
- MongoDB (Mongoose)
- Docker (optional)

## Project Structure
```
src/
├── commands/       # Slash commands
├── handlers/       # Interaction handlers
├── models/         # MongoDB schemas
├── services/       # Business logic
├── ui/             # Discord UI components
├── api/            # Express server
├── config.ts       # Configuration
└── index.ts        # Entry point
```


