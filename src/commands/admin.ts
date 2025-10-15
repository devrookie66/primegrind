import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('admin')
  .setDescription('Admin kontrol paneli (Sadece yetkili kullanıcılar için)');

export type Command = {
  data: SlashCommandBuilder;
};

export default { data } satisfies Command;

