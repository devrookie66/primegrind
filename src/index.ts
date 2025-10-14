import { Client, GatewayIntentBits, Partials, Events } from 'discord.js';
import { config } from './config';
import { handleInteraction } from './handlers/interactions';
import { connectDatabase } from './services/db';
import { startServer } from './api/server';
import { startStatusPanel } from './services/statusPanel';
import { startEarnPanel } from './services/earnPanel';
import { startSubmitPanel } from './services/submitPanel';

async function bootstrap() {
  if (!config.discordToken) throw new Error('Missing DISCORD_TOKEN');

  await connectDatabase();
  await startServer();

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Channel, Partials.Message],
  });

  client.on(Events.InteractionCreate, handleInteraction);

  client.once(Events.ClientReady, async (c) => {
    // eslint-disable-next-line no-console
    console.log(`Logged in as ${c.user.tag}`);
    
    // Panelleri başlat
    await startEarnPanel(c);
    await startSubmitPanel(c);
    await startStatusPanel(c);
  });

  await client.login(config.discordToken);
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});


