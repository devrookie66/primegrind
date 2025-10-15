import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';

export const earnLinkButton = () =>
  new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId('earn:get_link').setLabel('Get a Link').setStyle(ButtonStyle.Primary)
  );

export const submitPanelButtons = () =>
  new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId('submit:open').setLabel('Submit Link').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('budget:open').setLabel('Manage Budget').setStyle(ButtonStyle.Secondary)
  );

export const submitLinkModal = () =>
  new ModalBuilder()
    .setCustomId('submit:modal')
    .setTitle('Submit Shortened Link')
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder().setCustomId('submit:url').setLabel('Shortened URL').setStyle(TextInputStyle.Short).setRequired(true)
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('submit:budget')
          .setLabel('Initial Budget (points)')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      )
    );

export const manageBudgetModal = () =>
  new ModalBuilder()
    .setCustomId('budget:modal')
    .setTitle('Manage Link Budget')
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder().setCustomId('budget:linkId').setLabel('Link ID').setStyle(TextInputStyle.Short).setRequired(true)
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('budget:delta')
          .setLabel('Add (+) or Remove (-) Points')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      )
    );

export const verifyVisitButtons = (linkId: string) =>
  new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId(`earn:verify:${linkId}`).setLabel('I visited').setStyle(ButtonStyle.Success)
  );

// Admin Panel Components
export const adminPanelButtons = () =>
  new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId('admin:stats').setLabel('📊 İstatistikler').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('admin:users').setLabel('👥 Kullanıcılar').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('admin:links').setLabel('🔗 Linkler').setStyle(ButtonStyle.Secondary)
  );

export const adminPanelButtons2 = () =>
  new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId('admin:user_manage').setLabel('⚙️ Kullanıcı Yönet').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('admin:link_manage').setLabel('⚙️ Link Yönet').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('admin:refresh').setLabel('🔄 Yenile').setStyle(ButtonStyle.Primary)
  );

export const userListButtons = (page: number, hasMore: boolean) => {
  const row = new ActionRowBuilder<ButtonBuilder>();
  
  if (page > 0) {
    row.addComponents(
      new ButtonBuilder().setCustomId(`admin:users:prev:${page}`).setLabel('◀️ Önceki').setStyle(ButtonStyle.Secondary)
    );
  }
  
  row.addComponents(
    new ButtonBuilder().setCustomId('admin:users:refresh').setLabel('🔄 Yenile').setStyle(ButtonStyle.Primary)
  );
  
  if (hasMore) {
    row.addComponents(
      new ButtonBuilder().setCustomId(`admin:users:next:${page}`).setLabel('Sonraki ▶️').setStyle(ButtonStyle.Secondary)
    );
  }
  
  row.addComponents(
    new ButtonBuilder().setCustomId('admin:back').setLabel('🏠 Ana Panel').setStyle(ButtonStyle.Danger)
  );
  
  return row;
};

export const linkListButtons = (page: number, hasMore: boolean) => {
  const row = new ActionRowBuilder<ButtonBuilder>();
  
  if (page > 0) {
    row.addComponents(
      new ButtonBuilder().setCustomId(`admin:links:prev:${page}`).setLabel('◀️ Önceki').setStyle(ButtonStyle.Secondary)
    );
  }
  
  row.addComponents(
    new ButtonBuilder().setCustomId('admin:links:refresh').setLabel('🔄 Yenile').setStyle(ButtonStyle.Primary)
  );
  
  if (hasMore) {
    row.addComponents(
      new ButtonBuilder().setCustomId(`admin:links:next:${page}`).setLabel('Sonraki ▶️').setStyle(ButtonStyle.Secondary)
    );
  }
  
  row.addComponents(
    new ButtonBuilder().setCustomId('admin:back').setLabel('🏠 Ana Panel').setStyle(ButtonStyle.Danger)
  );
  
  return row;
};

// Admin Modals
export const setUserBalanceModal = () =>
  new ModalBuilder()
    .setCustomId('admin:set_balance')
    .setTitle('Kullanıcı Bakiyesi Ayarla')
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('admin:user_id')
          .setLabel('Kullanıcı ID')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('admin:balance')
          .setLabel('Yeni Bakiye')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setPlaceholder('Pozitif bir sayı girin')
      )
    );

export const addPointsModal = () =>
  new ModalBuilder()
    .setCustomId('admin:add_points')
    .setTitle('Kullanıcıya Puan Ekle/Çıkar')
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('admin:user_id')
          .setLabel('Kullanıcı ID')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('admin:points')
          .setLabel('Puan Miktarı (+ veya -)')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setPlaceholder('Örnek: +100 veya -50')
      )
    );

export const deleteLinkModal = () =>
  new ModalBuilder()
    .setCustomId('admin:delete_link')
    .setTitle('Link Sil')
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('admin:link_id')
          .setLabel('Link ID')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      )
    );

export const getUserInfoModal = () =>
  new ModalBuilder()
    .setCustomId('admin:user_info')
    .setTitle('Kullanıcı Bilgisi Sorgula')
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('admin:user_id')
          .setLabel('Kullanıcı ID')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      )
    );

export const getLinkInfoModal = () =>
  new ModalBuilder()
    .setCustomId('admin:link_info')
    .setTitle('Link Bilgisi Sorgula')
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('admin:link_id')
          .setLabel('Link ID')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      )
    );

export const deleteUserLinksModal = () =>
  new ModalBuilder()
    .setCustomId('admin:delete_user_links')
    .setTitle('Kullanıcının Tüm Linklerini Sil')
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('admin:user_id')
          .setLabel('Kullanıcı ID')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      )
    );


