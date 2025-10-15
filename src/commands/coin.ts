import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('coin')
  .setDescription('Puan bakiyenizi görüntüleyin');

export type Command = {
  data: SlashCommandBuilder;
};

export default { data } satisfies Command;

