import dotenv from 'dotenv';
dotenv.config();

export const config = {
  discordToken: process.env.DISCORD_TOKEN || '',
  clientId: process.env.CLIENT_ID || '',
  guildId: process.env.GUILD_ID || '',
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/linksync',
  port: parseInt(process.env.PORT || '3000', 10),
  allowedLinkDomains: (process.env.ALLOWED_LINK_DOMAINS || 'ouo.io,tr.link,cuty.io')
    .split(',')
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean),
  pointsPerVerifiedClick: parseInt(process.env.POINTS_PER_CLICK || '1', 10),
  adminPassword: process.env.ADMIN_PASSWORD || 'admin123',
  adminUsers: (process.env.ADMIN_USERS || '')
    .split(',')
    .map((u) => u.trim())
    .filter(Boolean),
};

export function isAllowedDomain(url: string, allowedDomains: string[]): boolean {
  try {
    const u = new URL(url);
    const hostname = u.hostname.toLowerCase();
    return allowedDomains.some((d) => hostname === d || hostname.endsWith(`.${d}`));
  } catch {
    return false;
  }
}


