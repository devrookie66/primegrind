import { Client, TextChannel, EmbedBuilder, Message } from 'discord.js';
import { earnLinkButton } from '../ui/components';

const EARN_CHANNEL_ID = '1426988133375017001';

let earnPanelMessage: Message | null = null;

export async function startEarnPanel(client: Client) {
  try {
    const channel = await client.channels.fetch(EARN_CHANNEL_ID);
    
    if (!channel || !channel.isTextBased()) {
      console.error('Earn kanalı bulunamadı veya metin kanalı değil');
      return;
    }

    const textChannel = channel as TextChannel;

    // Panel embed'i oluştur
    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('🎯 Link Kazanma Paneli')
      .setDescription(
        '**Nasıl Çalışır?**\n\n' +
        '1️⃣ Aşağıdaki butona tıklayarak link talep edin\n' +
        '2️⃣ Size özel bir link ve doğrulama paneli verilecek\n' +
        '3️⃣ Linki ziyaret edin ve hedef sayfaya ulaşın\n' +
        '4️⃣ "Ziyaret Ettim" butonuna tıklayarak puanınızı kazanın\n\n' +
        '💰 Her başarılı ziyaret için puan kazanırsınız!\n' +
        '🔄 Daha önce tıklamadığınız linkler size gösterilir'
      )
      .setFooter({ text: 'Her tıklama sayılır, hile yapmayın!' })
      .setTimestamp();

    // Panel mesajını gönder
    earnPanelMessage = await textChannel.send({ 
      embeds: [embed], 
      components: [earnLinkButton()] 
    });

    console.log('Earn paneli başlatıldı');
  } catch (error) {
    console.error('Earn paneli başlatılırken hata:', error);
  }
}

export function getEarnPanelMessage() {
  return earnPanelMessage;
}

