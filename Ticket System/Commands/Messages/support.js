const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ContainerBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  SeparatorBuilder,
  MessageFlags,
} = require("discord.js");

const STAFF_ROLES = ["1327670816296403047"];
const SUPPORT_CHANNEL_ID = "1327670816887804003";
const BANNER = "YOUR_BANNER_HERE";

module.exports = {
  name: "support",
  description: "Send the support ticket panel to the support channel.",

  execute: async function (message, client, args) {
    if (!message.member.roles.cache.some((r) => STAFF_ROLES.includes(r.id))) {
      const reply = await message.reply("You do not have permission to use this command.");
      setTimeout(() => reply.delete().catch(() => {}), 5000);
      return;
    }

    await message.delete().catch(() => {});

    const supportChannel = client.channels.cache.get(SUPPORT_CHANNEL_ID);
    if (!supportChannel) {
      return message.channel
        .send("Support channel not found.")
        .then((m) => setTimeout(() => m.delete().catch(() => {}), 5000));
    }

    const container = new ContainerBuilder()
      .addMediaGalleryComponents(
        new MediaGalleryBuilder().addItems(
          new MediaGalleryItemBuilder().setURL(BANNER),
        ),
      )
      .addSeparatorComponents(new SeparatorBuilder().setDivider(false))
      .addTextDisplayComponents((t) =>
        t.setContent(
`Casa Grande Fire Department Support

## General Support
• Questions & Assistance
• Discord Server Help
• Rules & Policy Clarification
• Department Resources

▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬

## Board Of Chiefs Ticket
• Reporting Firefighter / Paramedic Contuct
• Critical Issues requiring Board Of Chiefs Review
• Operational Concerns
• Confidential Matters 

▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬

⚠️ Notice
• Select the correct category.
• All tickets are reviewed by authorized CGFD Support Team.
• Misuse of the ticket system may result in your ticket being closed.`
        )
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(1),
      )
      .addActionRowComponents(
        new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId("support:menu")
            .setPlaceholder("Select support type.")
            .addOptions(
              new StringSelectMenuOptionBuilder()
                .setLabel("General Support")
                .setValue("general"),
              new StringSelectMenuOptionBuilder()
                .setLabel("Board Of Chiefs Support")
                .setValue("Board_Of_Chiefs"),
            ),
        ),
      );

    await supportChannel.send({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
