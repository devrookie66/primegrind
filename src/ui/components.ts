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


