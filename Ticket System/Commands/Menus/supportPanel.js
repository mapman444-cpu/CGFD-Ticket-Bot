const {
  ChannelType,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  TextDisplayBuilder, 
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  SeparatorBuilder,
  MessageFlags,
  TextInputBuilder,
  TextInputStyle,
  ModalBuilder,
} = require("discord.js");
const { getRobloxInfo } = require("../Utils/docksystem");
const SupportModel = require("../Database/Models/SupportModel");

const TICKET_ROLES = {
  Board_Of_Chiefs: ["1537220438873088000"],
  general: ["1327670816036356206"]
};

const CATEGORIES = {
  general: "1327670820482449505",
  Board_Of_Chiefs: "1536879328741298248"
};

const TYPE_LABELS = {
  general: "General Support",
  Board_Of_Chiefs: "BOC Support"
};

const BANNERS = {
  general: "YOUR_BANNER_HERE",
  Board_Of_Chiefs: "YOUR_BANNER_HERE"
};

module.exports = {
  customID: "support:menu",
  execute: async function (interaction, client, args) {
    const { user } = interaction;
    const type = interaction.values[0];
    const label = TYPE_LABELS[type];

    const existing = await SupportModel.findOne({
      userId: user.id,
      type,
    }).catch(() => null);
    if (existing) {
      return interaction.reply({
        components: [
          new ContainerBuilder().addTextDisplayComponents((t) =>
            t.setContent(
              `You already have an open **${label}** ticket: <#${existing.channelId}>`,
            ),
          ),
        ],
        flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
      });
    }

    const modal = new ModalBuilder()
      .setCustomId(`support:ticketreason_${type}`)
      .setTitle(`${label} - Reason`);

    const reasonInput = new TextInputBuilder()
      .setCustomId("reason")
      .setLabel("Please describe your issue")
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder("Enter the reason for your ticket...")
      .setRequired(true);

    const supportingDetailsInput = new TextInputBuilder()
      .setCustomId("supportingDetails")
      .setLabel("Supporting Details")
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder("Provide any additional information that may be helpful...")
      .setRequired(false);
    
    const WhenDidThisHappenInput = new TextInputBuilder()
      .setCustomId("whenDidThisHappen")
      .setLabel("When did this happen?")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("Enter the date and time of the issue...")
      .setRequired(false);

    modal.addComponents(new ActionRowBuilder().addComponents(reasonInput));
    modal.addComponents(new ActionRowBuilder().addComponents(supportingDetailsInput));
    modal.addComponents(new ActionRowBuilder().addComponents(WhenDidThisHappenInput));

    return interaction.showModal(modal);
  },
};
