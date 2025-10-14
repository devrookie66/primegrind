import { Client, TextChannel, EmbedBuilder, Message } from 'discord.js';
import { submitPanelButtons } from '../ui/components';

const SUBMIT_CHANNEL_ID = '1426988133375017001'; // Aynı kanalda olabilir veya farklı

let submitPanelMessage: Message | null = null;

export async function startSubmitPanel(client: Client) {
  try {
    const channel = await client.channels.fetch(SUBMIT_CHANNEL_ID);
    
    if (!channel || !channel.isTextBased()) {
      console.error('Submit kanalı bulunamadı veya metin kanalı değil');
      return;
    }

    const textChannel = channel as TextChannel;

    // Panel embed'i oluştur
    const embed = new EmbedBuilder()
      .setColor(0x57F287)
      .setTitle('📤 Link Gönderme ve Yönetim Paneli')
      .setDescription(
        '**Link Nasıl Gönderilir?**\n\n' +
        '1️⃣ **"Link Gönder"** butonuna tıklayın\n' +
        '2️⃣ Kısaltılmış linkinizi ve başlangıç budget\'ınızı girin\n' +
        '3️⃣ Budget olarak verdiğiniz puan bakiyenizden düşülür\n' +
        '4️⃣ Linkiniz sisteme eklenir ve diğer kullanıcılar tıklayabilir\n\n' +
        '**Budget Yönetimi:**\n' +
        '• **"Budget Yönet"** butonu ile linkinize budget ekleyebilir veya çıkarabilirsiniz\n' +
        '• Budget eklerken puan harcanır, çıkarırken puan iade edilir\n' +
        '• Link ID\'nizi link gönderdiğinizde alırsınız\n\n' +
        '💡 **İpucu:** Budget bittiğinde linkiniz otomatik olarak devre dışı kalır'
      )
      .setFooter({ text: 'İzin verilen domainler: ouo.io, tr.link, cuty.io' });

    // Panel mesajını gönder
    submitPanelMessage = await textChannel.send({ 
      embeds: [embed], 
      components: [submitPanelButtons()] 
    });

    console.log('Submit paneli başlatıldı');
  } catch (error) {
    console.error('Submit paneli başlatılırken hata:', error);
  }
}

export function getSubmitPanelMessage() {
  return submitPanelMessage;
}

