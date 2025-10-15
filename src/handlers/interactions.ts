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
import { 
  earnLinkButton, 
  manageBudgetModal, 
  submitLinkModal, 
  submitPanelButtons, 
  verifyVisitButtons,
  adminPanelButtons,
  adminPanelButtons2,
  userListButtons,
  linkListButtons,
  setUserBalanceModal,
  addPointsModal,
  deleteLinkModal,
  getUserInfoModal,
  getLinkInfoModal,
  deleteUserLinksModal,
  userLinksListButtons
} from '../ui/components';
import { getNextLinkForUser, enqueueLink, addBudget, removeBudget, markVisited, getUserLinks } from '../services/linkQueue';
import { addPoints, getUserBalance, removePoints } from '../services/economy';
import { config, isAllowedDomain } from '../config';
import {
  isAdmin,
  isAdminChannel,
  getSystemStats,
  getAllUsers,
  getAllLinks,
  setUserBalance,
  deleteLink,
  deleteLinksByUser,
  getUserInfo,
  getLinkInfo
} from '../services/adminPanel';

export async function handleInteraction(interaction: Interaction) {
  if (interaction.isChatInputCommand()) return handleSlash(interaction);
  if (interaction.isButton()) return handleButton(interaction);
  if (interaction.isModalSubmit()) return handleModal(interaction);
}

async function handleSlash(interaction: ChatInputCommandInteraction) {
  // /coin komutu
  if (interaction.commandName === 'coin') {
    await interaction.deferReply({ ephemeral: true });

    const userId = interaction.user.id;
    const balance = await getUserBalance(userId);

    const embed = new EmbedBuilder()
      .setColor(0xFFD700)
      .setTitle('💰 Puan Bakiyeniz')
      .setDescription(
        `**Toplam Puanınız:** ${balance}\n\n` +
        `🎯 Daha fazla puan kazanmak için <#1426988133375017001> kanalından link alabilirsiniz!\n` +
        `📤 Puanlarınızı harcayarak kendi linkinizi sisteme ekleyebilirsiniz!`
      )
      .setFooter({ text: `Kullanıcı: ${interaction.user.username}` })
      .setThumbnail(interaction.user.displayAvatarURL())
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
    return;
  }

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

  if (interaction.commandName === 'admin') {
    await interaction.deferReply({ ephemeral: false });

    // Yetki kontrolü
    if (!isAdmin(interaction.user.id)) {
      return interaction.editReply('❌ Bu komutu kullanma yetkiniz yok!');
    }

    // Kanal kontrolü
    if (!isAdminChannel(interaction.channelId)) {
      return interaction.editReply('❌ Bu komut sadece admin kanalında kullanılabilir!');
    }

    const stats = await getSystemStats();

    const adminEmbed = new EmbedBuilder()
      .setColor(0xFF0000)
      .setTitle('🛡️ Admin Kontrol Paneli')
      .setDescription('PrimeGrind Bot Yönetim Paneline Hoş Geldiniz!')
      .addFields(
        { name: '👥 Toplam Kullanıcı', value: stats.totalUsers.toString(), inline: true },
        { name: '🔗 Toplam Link', value: stats.totalLinks.toString(), inline: true },
        { name: '✅ Aktif Link', value: stats.activeLinks.toString(), inline: true },
        { name: '💰 Sistemdeki Toplam Puan', value: stats.totalPoints.toString(), inline: true },
        { name: '📊 Son Güncelleme', value: new Date().toLocaleString('tr-TR'), inline: false }
      )
      .setFooter({ text: 'Admin ID: ' + interaction.user.id })
      .setTimestamp();

    await interaction.editReply({
      embeds: [adminEmbed],
      components: [adminPanelButtons(), adminPanelButtons2()]
    });
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

    // Tracking token'ı al
    const tracking = link.clickTracking?.get(interaction.user.id);
    const trackingUrl = tracking ? `${config.baseUrl}/track/${link._id}/${interaction.user.id}/${tracking.token}` : link.url;

    // Kullanıcıya link ve doğrulama paneli gönder
    const embed = new EmbedBuilder()
      .setColor(0x00FF00)
      .setTitle('✅ Link Hazır!')
      .setDescription(
        `🔗 **Linkiniz:** ${trackingUrl}\n\n` +
        `**Yapılacaklar:**\n` +
        `1. Yukarıdaki linke tıklayın\n` +
        `2. Açılan sayfaları geçip hedef linke ulaşın\n` +
        `3. Aşağıdaki "Ziyaret Ettim" butonuna tıklayın\n\n` +
        `💰 Kazanacağınız puan: **${config.pointsPerVerifiedClick}**\n\n` +
        `⚠️ **ÖNEMLİ:** Linke tıklamadan "Ziyaret Ettim" butonuna basarsanız puan kazanamazsınız!`
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
          content: '❌ Linke tıklamadınız veya link bulunamadı! Önce linke tıklayıp hedef sayfaya ulaştıktan sonra bu butona basın.',
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
    await interaction.deferReply({ ephemeral: true });
    
    // Kullanıcının linklerini getir
    const userLinksData = await getUserLinks(interaction.user.id, 0, 5);
    
    if (userLinksData.links.length === 0) {
      return interaction.editReply({
        content: '❌ Henüz sisteme link eklememişsiniz! Önce "Submit Link" butonuna basıp link ekleyin.',
      });
    }
    
    const linksEmbed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('🔗 Linkleriniz')
      .setDescription(
        userLinksData.links.map((link, i) => 
          `**${i + 1}.** ${link.url.substring(0, 60)}${link.url.length > 60 ? '...' : ''}\n` +
          `├ 🆔 ID: \`${link._id.toString()}\`\n` +
          `├ 💰 Budget: **${link.budget}** puan\n` +
          `├ 👁️ Ziyaretçi: **${link.visitors.length}**\n` +
          `└ 📅 Tarih: ${new Date(link.createdAt).toLocaleDateString('tr-TR')}`
        ).join('\n\n')
      )
      .setFooter({ text: `Toplam ${userLinksData.total} linkiniz var • Sayfa 1` })
      .setTimestamp();
    
    await interaction.editReply({
      embeds: [linksEmbed],
      components: [userLinksListButtons(0, userLinksData.hasMore)]
    });
    return;
  }
  
  // Kullanıcının linklerini sayfalama
  if (id.includes('user_links:')) {
    await interaction.deferUpdate();
    
    let page = 0;
    if (id.includes(':next:')) {
      page = parseInt(id.split(':').pop() || '0') + 1;
    } else if (id.includes(':prev:')) {
      page = Math.max(0, parseInt(id.split(':').pop() || '0') - 1);
    }
    
    const userLinksData = await getUserLinks(interaction.user.id, page, 5);
    
    const linksEmbed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('🔗 Linkleriniz')
      .setDescription(
        userLinksData.links.map((link, i) => 
          `**${page * 5 + i + 1}.** ${link.url.substring(0, 60)}${link.url.length > 60 ? '...' : ''}\n` +
          `├ 🆔 ID: \`${link._id.toString()}\`\n` +
          `├ 💰 Budget: **${link.budget}** puan\n` +
          `├ 👁️ Ziyaretçi: **${link.visitors.length}**\n` +
          `└ 📅 Tarih: ${new Date(link.createdAt).toLocaleDateString('tr-TR')}`
        ).join('\n\n') || 'Link bulunamadı.'
      )
      .setFooter({ text: `Toplam ${userLinksData.total} linkiniz var • Sayfa ${page + 1}` })
      .setTimestamp();
    
    await interaction.editReply({
      embeds: [linksEmbed],
      components: [userLinksListButtons(page, userLinksData.hasMore)]
    });
    return;
  }
  
  // Budget modal'ı aç
  if (id === 'user_links:manage_budget') {
    return interaction.showModal(manageBudgetModal());
  }

  // Admin Panel Butonları
  if (id.startsWith('admin:')) {
    // Yetki kontrolü
    if (!isAdmin(interaction.user.id)) {
      return interaction.reply({ content: '❌ Bu özelliği kullanma yetkiniz yok!', ephemeral: true });
    }

    // İstatistikler
    if (id === 'admin:stats' || id === 'admin:refresh' || id === 'admin:back') {
      await interaction.deferUpdate();
      const stats = await getSystemStats();

      const adminEmbed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('🛡️ Admin Kontrol Paneli')
        .setDescription('PrimeGrind Bot Yönetim Paneline Hoş Geldiniz!')
        .addFields(
          { name: '👥 Toplam Kullanıcı', value: stats.totalUsers.toString(), inline: true },
          { name: '🔗 Toplam Link', value: stats.totalLinks.toString(), inline: true },
          { name: '✅ Aktif Link', value: stats.activeLinks.toString(), inline: true },
          { name: '💰 Sistemdeki Toplam Puan', value: stats.totalPoints.toString(), inline: true },
          { name: '📊 Son Güncelleme', value: new Date().toLocaleString('tr-TR'), inline: false }
        )
        .setFooter({ text: 'Admin ID: ' + interaction.user.id })
        .setTimestamp();

      await interaction.editReply({
        embeds: [adminEmbed],
        components: [adminPanelButtons(), adminPanelButtons2()]
      });
      return;
    }

    // Kullanıcı listesi
    if (id === 'admin:users' || id.includes('admin:users:')) {
      await interaction.deferUpdate();
      
      let page = 0;
      if (id.includes(':next:')) {
        page = parseInt(id.split(':').pop() || '0') + 1;
      } else if (id.includes(':prev:')) {
        page = Math.max(0, parseInt(id.split(':').pop() || '0') - 1);
      }

      const userData = await getAllUsers(page, 10);

      const userListEmbed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle('👥 Kullanıcı Listesi')
        .setDescription(
          userData.users.map((u, i) => 
            `**${page * 10 + i + 1}.** <@${u.userId}>\n` +
            `├ 💰 Bakiye: **${u.balance}** puan\n` +
            `├ 🔗 Ziyaret: **${u.visitedCount}** link\n` +
            `└ 📅 Katılma: ${new Date(u.createdAt).toLocaleDateString('tr-TR')}`
          ).join('\n\n') || 'Henüz kullanıcı yok.'
        )
        .setFooter({ text: `Sayfa ${page + 1} • Toplam ${userData.total} kullanıcı` })
        .setTimestamp();

      await interaction.editReply({
        embeds: [userListEmbed],
        components: [userListButtons(page, userData.hasMore)]
      });
      return;
    }

    // Link listesi
    if (id === 'admin:links' || id.includes('admin:links:')) {
      await interaction.deferUpdate();
      
      let page = 0;
      if (id.includes(':next:')) {
        page = parseInt(id.split(':').pop() || '0') + 1;
      } else if (id.includes(':prev:')) {
        page = Math.max(0, parseInt(id.split(':').pop() || '0') - 1);
      }

      const linkData = await getAllLinks(page, 10);

      const linkListEmbed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle('🔗 Link Listesi')
        .setDescription(
          linkData.links.map((l, i) => 
            `**${page * 10 + i + 1}.** ${l.url.substring(0, 50)}${l.url.length > 50 ? '...' : ''}\n` +
            `├ 🆔 ID: \`${l.id}\`\n` +
            `├ 👤 Sahibi: <@${l.ownerUserId}>\n` +
            `├ 💰 Budget: **${l.budget}**\n` +
            `├ 👁️ Ziyaretçi: **${l.visitorsCount}**\n` +
            `└ 📅 Tarih: ${new Date(l.createdAt).toLocaleDateString('tr-TR')}`
          ).join('\n\n') || 'Henüz link yok.'
        )
        .setFooter({ text: `Sayfa ${page + 1} • Toplam ${linkData.total} link` })
        .setTimestamp();

      await interaction.editReply({
        embeds: [linkListEmbed],
        components: [linkListButtons(page, linkData.hasMore)]
      });
      return;
    }

    // Kullanıcı yönetimi modallari
    if (id === 'admin:user_manage') {
      return interaction.reply({
        content: '**👤 Kullanıcı Yönetimi**\n\nAşağıdaki işlemlerden birini seçin:',
        ephemeral: true,
        components: [
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder().setCustomId('admin:modal:set_balance').setLabel('💰 Bakiye Ayarla').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('admin:modal:add_points').setLabel('➕ Puan Ekle/Çıkar').setStyle(ButtonStyle.Success)
          ),
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder().setCustomId('admin:modal:user_info').setLabel('📊 Kullanıcı Bilgisi').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('admin:modal:delete_user_links').setLabel('🗑️ Kullanıcı Linkleri Sil').setStyle(ButtonStyle.Danger)
          )
        ]
      });
    }

    // Link yönetimi modallari
    if (id === 'admin:link_manage') {
      return interaction.reply({
        content: '**🔗 Link Yönetimi**\n\nAşağıdaki işlemlerden birini seçin:',
        ephemeral: true,
        components: [
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder().setCustomId('admin:modal:link_info').setLabel('📊 Link Bilgisi').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('admin:modal:delete_link').setLabel('🗑️ Link Sil').setStyle(ButtonStyle.Danger)
          )
        ]
      });
    }

    // Modal açma butonları
    if (id === 'admin:modal:set_balance') {
      return interaction.showModal(setUserBalanceModal());
    }
    if (id === 'admin:modal:add_points') {
      return interaction.showModal(addPointsModal());
    }
    if (id === 'admin:modal:delete_link') {
      return interaction.showModal(deleteLinkModal());
    }
    if (id === 'admin:modal:user_info') {
      return interaction.showModal(getUserInfoModal());
    }
    if (id === 'admin:modal:link_info') {
      return interaction.showModal(getLinkInfoModal());
    }
    if (id === 'admin:modal:delete_user_links') {
      return interaction.showModal(deleteUserLinksModal());
    }
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

  // Admin Panel Modals
  if (interaction.customId.startsWith('admin:')) {
    // Yetki kontrolü
    if (!isAdmin(interaction.user.id)) {
      return interaction.reply({ content: '❌ Bu özelliği kullanma yetkiniz yok!', ephemeral: true });
    }

    // Kullanıcı bakiyesi ayarla
    if (interaction.customId === 'admin:set_balance') {
      await interaction.deferReply({ ephemeral: true });
      const userId = interaction.fields.getTextInputValue('admin:user_id').trim();
      const balance = Math.max(0, parseInt(interaction.fields.getTextInputValue('admin:balance')));

      if (isNaN(balance)) {
        return interaction.editReply('❌ Geçersiz bakiye değeri!');
      }

      const newBalance = await setUserBalance(userId, balance);
      
      const embed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle('✅ Bakiye Güncellendi')
        .setDescription(`<@${userId}> kullanıcısının bakiyesi güncellendi!`)
        .addFields(
          { name: '💰 Yeni Bakiye', value: newBalance.toString(), inline: true },
          { name: '👤 Kullanıcı ID', value: userId, inline: true }
        )
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    }

    // Kullanıcıya puan ekle/çıkar
    if (interaction.customId === 'admin:add_points') {
      await interaction.deferReply({ ephemeral: true });
      const userId = interaction.fields.getTextInputValue('admin:user_id').trim();
      const pointsStr = interaction.fields.getTextInputValue('admin:points').trim();
      const points = parseInt(pointsStr);

      if (isNaN(points)) {
        return interaction.editReply('❌ Geçersiz puan değeri!');
      }

      const currentBalance = await getUserBalance(userId);
      let newBalance: number;

      if (points > 0) {
        newBalance = await addPoints(userId, points);
      } else {
        newBalance = await removePoints(userId, Math.abs(points));
      }

      const embed = new EmbedBuilder()
        .setColor(points > 0 ? 0x00FF00 : 0xFF0000)
        .setTitle(points > 0 ? '➕ Puan Eklendi' : '➖ Puan Çıkarıldı')
        .setDescription(`<@${userId}> kullanıcısına **${points > 0 ? '+' : ''}${points}** puan ${points > 0 ? 'eklendi' : 'çıkarıldı'}!`)
        .addFields(
          { name: '💰 Eski Bakiye', value: currentBalance.toString(), inline: true },
          { name: '💰 Yeni Bakiye', value: newBalance.toString(), inline: true },
          { name: '📊 Değişim', value: `${points > 0 ? '+' : ''}${points}`, inline: true }
        )
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    }

    // Link sil
    if (interaction.customId === 'admin:delete_link') {
      await interaction.deferReply({ ephemeral: true });
      const linkId = interaction.fields.getTextInputValue('admin:link_id').trim();

      const linkInfo = await getLinkInfo(linkId);
      if (!linkInfo) {
        return interaction.editReply('❌ Link bulunamadı!');
      }

      const deleted = await deleteLink(linkId);
      
      if (deleted) {
        const embed = new EmbedBuilder()
          .setColor(0xFF0000)
          .setTitle('🗑️ Link Silindi')
          .setDescription(`Link başarıyla silindi!`)
          .addFields(
            { name: '🔗 URL', value: linkInfo.url },
            { name: '👤 Sahibi', value: `<@${linkInfo.ownerUserId}>` },
            { name: '💰 Kalan Budget', value: linkInfo.budget.toString() }
          )
          .setTimestamp();

        return interaction.editReply({ embeds: [embed] });
      } else {
        return interaction.editReply('❌ Link silinemedi!');
      }
    }

    // Kullanıcı bilgisi
    if (interaction.customId === 'admin:user_info') {
      await interaction.deferReply({ ephemeral: true });
      const userId = interaction.fields.getTextInputValue('admin:user_id').trim();

      const userInfo = await getUserInfo(userId);
      
      if (!userInfo) {
        return interaction.editReply('❌ Kullanıcı bulunamadı!');
      }

      const embed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle('📊 Kullanıcı Bilgileri')
        .setDescription(`<@${userId}> kullanıcısının detaylı bilgileri:`)
        .addFields(
          { name: '💰 Bakiye', value: userInfo.balance.toString(), inline: true },
          { name: '🔗 Ziyaret Edilen', value: userInfo.visitedCount.toString(), inline: true },
          { name: '📝 Oluşturulan Link', value: userInfo.ownedLinksCount.toString(), inline: true },
          { name: '💵 Aktif Budget', value: userInfo.activeBudget.toString(), inline: true },
          { name: '📅 Katılma Tarihi', value: new Date(userInfo.createdAt).toLocaleString('tr-TR'), inline: false }
        )
        .setFooter({ text: 'User ID: ' + userId })
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    }

    // Link bilgisi
    if (interaction.customId === 'admin:link_info') {
      await interaction.deferReply({ ephemeral: true });
      const linkId = interaction.fields.getTextInputValue('admin:link_id').trim();

      const linkInfo = await getLinkInfo(linkId);
      
      if (!linkInfo) {
        return interaction.editReply('❌ Link bulunamadı!');
      }

      const embed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle('📊 Link Bilgileri')
        .setDescription(`Link detaylı bilgileri:`)
        .addFields(
          { name: '🔗 URL', value: linkInfo.url },
          { name: '👤 Sahibi', value: `<@${linkInfo.ownerUserId}>`, inline: true },
          { name: '💰 Budget', value: linkInfo.budget.toString(), inline: true },
          { name: '👁️ Ziyaretçi Sayısı', value: linkInfo.visitorsCount.toString(), inline: true },
          { name: '📅 Oluşturulma', value: new Date(linkInfo.createdAt).toLocaleString('tr-TR'), inline: true },
          { name: '🔄 Son Güncelleme', value: new Date(linkInfo.updatedAt).toLocaleString('tr-TR'), inline: true }
        )
        .setFooter({ text: 'Link ID: ' + linkId })
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    }

    // Kullanıcının tüm linklerini sil
    if (interaction.customId === 'admin:delete_user_links') {
      await interaction.deferReply({ ephemeral: true });
      const userId = interaction.fields.getTextInputValue('admin:user_id').trim();

      const deletedCount = await deleteLinksByUser(userId);

      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('🗑️ Kullanıcı Linkleri Silindi')
        .setDescription(`<@${userId}> kullanıcısının tüm linkleri silindi!`)
        .addFields(
          { name: '📊 Silinen Link Sayısı', value: deletedCount.toString() }
        )
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    }
  }
}


