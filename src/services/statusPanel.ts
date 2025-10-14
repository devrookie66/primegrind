import { Client, TextChannel, EmbedBuilder, Message } from 'discord.js';
import { LinkModel } from '../models/Link';

const STATUS_CHANNEL_ID = '1426988472190894080';
const UPDATE_INTERVAL = 30000; // 30 saniyede bir güncelle

let statusMessage: Message | null = null;
let updateInterval: NodeJS.Timeout | null = null;

export async function startStatusPanel(client: Client) {
  try {
    const channel = await client.channels.fetch(STATUS_CHANNEL_ID);
    
    if (!channel || !channel.isTextBased()) {
      console.error('Status kanalı bulunamadı veya metin kanalı değil');
      return;
    }

    const textChannel = channel as TextChannel;

    // İlk embed'i oluştur ve gönder
    const embed = await createStatusEmbed();
    statusMessage = await textChannel.send({ embeds: [embed] });

    // Periyodik güncelleme başlat
    updateInterval = setInterval(async () => {
      await updateStatusPanel();
    }, UPDATE_INTERVAL);

    console.log('Status paneli başlatıldı');
  } catch (error) {
    console.error('Status paneli başlatılırken hata:', error);
  }
}

async function createStatusEmbed(): Promise<EmbedBuilder> {
  // Toplam link sayısı
  const totalLinks = await LinkModel.countDocuments();
  
  // Aktif linkler (budget > 0)
  const activeLinks = await LinkModel.countDocuments({ budget: { $gt: 0 } });
  
  // Pasif linkler (budget = 0)
  const inactiveLinks = totalLinks - activeLinks;

  // Toplam budget
  const result = await LinkModel.aggregate([
    { $group: { _id: null, totalBudget: { $sum: '$budget' } } }
  ]);
  const totalBudget = result.length > 0 ? result[0].totalBudget : 0;

  const embed = new EmbedBuilder()
    .setColor(0x00AE86)
    .setTitle('📊 Sistem Durumu')
    .setDescription('Link sistemi istatistikleri')
    .addFields(
      { name: '🔗 Toplam Link', value: `**${totalLinks}**`, inline: true },
      { name: '✅ Aktif Link', value: `**${activeLinks}**`, inline: true },
      { name: '❌ Pasif Link', value: `**${inactiveLinks}**`, inline: true },
      { name: '💰 Toplam Budget', value: `**${totalBudget}**`, inline: true }
    )
    .setFooter({ text: 'Son güncelleme' })
    .setTimestamp();

  return embed;
}

async function updateStatusPanel() {
  if (!statusMessage) return;

  try {
    const embed = await createStatusEmbed();
    await statusMessage.edit({ embeds: [embed] });
  } catch (error) {
    console.error('Status paneli güncellenirken hata:', error);
  }
}

export function stopStatusPanel() {
  if (updateInterval) {
    clearInterval(updateInterval);
    updateInterval = null;
  }
  statusMessage = null;
}

