import { REST, Routes } from 'discord.js';
import { config } from './config';
import setup from './commands/setup';

async function main() {
  const rest = new REST({ version: '10' }).setToken(config.discordToken);
  const commands = [setup.data.toJSON()];
  if (!config.clientId) throw new Error('CLIENT_ID missing');
  if (!config.guildId) throw new Error('GUILD_ID missing');
  await rest.put(Routes.applicationGuildCommands(config.clientId, config.guildId), { body: commands });
  // eslint-disable-next-line no-console
  console.log('Registered guild commands');
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});


