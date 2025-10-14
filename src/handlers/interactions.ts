import {
  ButtonInteraction,
  ChatInputCommandInteraction,
  EmbedBuilder,
  Interaction,
  ModalSubmitInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import { earnLinkButton, manageBudgetModal, submitLinkModal, submitPanelButtons, verifyVisitButtons } from '../ui/components';
import { getNextLinkForUser, enqueueLink, addBudget, removeBudget, markVisited } from '../services/linkQueue';
import { addPoints, getUserBalance, removePoints } from '../services/economy';
import { config, isAllowedDomain } from '../config';

export async function handleInteraction(interaction: Interaction) {
  if (interaction.isChatInputCommand()) return handleSlash(interaction);
  if (interaction.isButton()) return handleButton(interaction);
  if (interaction.isModalSubmit()) return handleModal(interaction);
}

async function handleSlash(interaction: ChatInputCommandInteraction) {
  if (interaction.commandName === 'setup') {
    await interaction.deferReply({ ephemeral: true });

    const earnEmbed = new EmbedBuilder()
      .setTitle('Earn Points by Visiting Links')
      .setDescription('Click the button to receive a link. Visiting verified links earns you points!');

    const submitEmbed = new EmbedBuilder()
      .setTitle('Submit and Manage Links')
      .setDescription('Submit your shortened link and manage its budget.');

    const channel = interaction.channel;
    if (!channel) return interaction.editReply('No channel found to send setup panels.');
    if (!channel.isTextBased() || channel.isDMBased()) {
      return interaction.editReply('Setup can only be used in server text channels.');
    }

    await channel.send({ embeds: [earnEmbed], components: [earnLinkButton()] });
    await channel.send({ embeds: [submitEmbed], components: [submitPanelButtons()] });

    await interaction.editReply('Setup messages sent.');
  }
}

async function handleButton(interaction: ButtonInteraction) {
  const id = interaction.customId;
  
  // Link talep et
  if (id === 'earn:get_link') {
    await interaction.deferReply({ ephemeral: true });
    const link = await getNextLinkForUser(interaction.user.id);
    
    if (!link) {
      return interaction.editReply({
        content: '❌ Şu anda uygun link bulunamadı. Lütfen daha sonra tekrar deneyin.',
      });
    }

    // Kullanıcıya link ve doğrulama paneli gönder
    const embed = new EmbedBuilder()
      .setColor(0x00FF00)
      .setTitle('✅ Link Hazır!')
      .setDescription(
        `🔗 **Linkiniz:** ${link.url}\n\n` +
        `**Yapılacaklar:**\n` +
        `1. Yukarıdaki linke tıklayın\n` +
        `2. Açılan sayfaları geçip hedef linke ulaşın\n` +
        `3. Aşağıdaki "Ziyaret Ettim" butonuna tıklayın\n\n` +
        `💰 Kazanacağınız puan: **${config.pointsPerVerifiedClick}**`
      )
      .setFooter({ text: 'Link ID: ' + link._id.toString() })
      .setTimestamp();

    await interaction.editReply({
      embeds: [embed],
      components: [verifyVisitButtons(link._id.toString())],
    });
    return;
  }

  // Ziyaret doğrulama
  if (id.startsWith('earn:verify:')) {
    await interaction.deferReply({ ephemeral: true });
    const linkId = id.split(':')[2];
    
    try {
      // Ziyareti işaretle ve budget'ı azalt
      const updatedLink = await markVisited(linkId, interaction.user.id);
      
      if (!updatedLink) {
        return interaction.editReply({
          content: '❌ Link bulunamadı veya zaten ziyaret ettiniz.',
        });
      }

      // Kullanıcıya puan ekle
      const newBalance = await addPoints(interaction.user.id, config.pointsPerVerifiedClick);

      const successEmbed = new EmbedBuilder()
        .setColor(0xFFD700)
        .setTitle('🎉 Tebrikler!')
        .setDescription(
          `✅ Linki başarıyla ziyaret ettiniz!\n\n` +
          `💰 Kazandığınız puan: **+${config.pointsPerVerifiedClick}**\n` +
          `💳 Yeni bakiyeniz: **${newBalance}** puan\n\n` +
          `Daha fazla puan kazanmak için ana panelden yeni link alabilirsiniz!`
        )
        .setTimestamp();

      await interaction.editReply({
        embeds: [successEmbed],
        components: [], // Butonları kaldır
      });
    } catch (error) {
      console.error('Doğrulama hatası:', error);
      return interaction.editReply({
        content: '❌ Doğrulama sırasında bir hata oluştu. Lütfen tekrar deneyin.',
      });
    }
    return;
  }

  if (id === 'submit:open') {
    return interaction.showModal(submitLinkModal());
  }

  if (id === 'budget:open') {
    return interaction.showModal(manageBudgetModal());
  }
}

async function handleModal(interaction: ModalSubmitInteraction) {
  if (interaction.customId === 'submit:modal') {
    await interaction.deferReply({ ephemeral: true });
    const url = interaction.fields.getTextInputValue('submit:url');
    const budgetStr = interaction.fields.getTextInputValue('submit:budget');
    const budget = Math.max(0, Math.floor(Number(budgetStr)) || 0);

    if (!isAllowedDomain(url, config.allowedLinkDomains)) {
      return interaction.editReply('Domain not allowed. Please submit a supported shortened link.');
    }

    const balance = await getUserBalance(interaction.user.id);
    if (balance < budget) {
      return interaction.editReply(`Insufficient points. Your balance is ${balance}.`);
    }

    await removePoints(interaction.user.id, budget);
    const created = await enqueueLink(interaction.user.id, url, budget);
    await interaction.editReply(`Link submitted with budget ${budget}. Link ID: ${created._id}`);
    return;
  }

  if (interaction.customId === 'budget:modal') {
    await interaction.deferReply({ ephemeral: true });
    const linkId = interaction.fields.getTextInputValue('budget:linkId');
    const deltaStr = interaction.fields.getTextInputValue('budget:delta').trim();
    const delta = Math.floor(Number(deltaStr));

    if (Number.isNaN(delta) || delta === 0) return interaction.editReply('Enter a non-zero integer for points.');

    if (delta > 0) {
      const balance = await getUserBalance(interaction.user.id);
      if (balance < delta) return interaction.editReply('Insufficient points.');
      await removePoints(interaction.user.id, delta);
      await addBudget(linkId, delta);
      return interaction.editReply(`Added ${delta} points to link budget.`);
    }

    // remove budget, refund to user
    const amount = Math.abs(delta);
    await addPoints(interaction.user.id, amount);
    await removeBudget(linkId, amount);
    return interaction.editReply(`Removed ${amount} points from link budget and refunded.`);
  }
}


