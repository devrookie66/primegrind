import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder().setName('setup').setDescription('Post setup panels in this channel');

export type Command = {
  data: SlashCommandBuilder;
};

export default { data } satisfies Command;


