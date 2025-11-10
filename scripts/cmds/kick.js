
module.exports = {
  config: {
    name: "kick",
    version: "1.0.0",
    author: "Sheikh Tamim",
    countDown: 5,
    role: 1,
    shortDescription: "Kick user from group",
    longDescription: "Kick users from group by mention, reply, or UID",
    category: "admin",
    guide: "{pn} @user\n{pn} [uid]\n{pn} [reply to message]"
  },

  ST: async function ({ message, event, args, sock }) {
    try {
      if (!event.isGroup) {
        return message.reply("❌ This command only works in groups!");
      }

      let targetUid = null;

      if (event.messageReply && event.messageReply.senderID) {
        targetUid = event.messageReply.senderID;
      } else if (args[0]) {
        targetUid = args[0].replace('@', '').trim();
      }

      if (!targetUid) {
        return message.reply("❌ Please mention a user, reply to their message, or provide their UID!");
      }

      if (targetUid === event.senderID) {
        return message.reply("❌ You cannot kick yourself!");
      }

      try {
        const groupMetadata = await sock.groupMetadata(event.threadID);
        const botNumber = sock.user.id.split(':')[0];
        const botJid = `${botNumber}@s.whatsapp.net`;
        const isAdmin = groupMetadata.participants.find(
          p => p.id === botJid && (p.admin === 'admin' || p.admin === 'superadmin')
        );

        if (!isAdmin) {
          return message.reply("❌ Bot is not admin in this group!");
        }

        // Find the exact participant JID from group metadata
        const targetParticipant = groupMetadata.participants.find(p => 
          p.id.includes(targetUid.replace('@lid', '').replace('@s.whatsapp.net', ''))
        );
        
        const targetJid = targetParticipant ? targetParticipant.id : `${targetUid.replace('@lid', '')}@s.whatsapp.net`;

        await sock.groupParticipantsUpdate(
          event.threadID,
          [targetJid],
          'remove'
        );

        await message.reply(`✅ User ${targetUid} has been kicked from the group!`);

      } catch (error) {
        await message.reply(`❌ Failed to kick user: ${error.message}`);
      }

    } catch (error) {
      console.error('Kick command error:', error);
      await message.reply(`❌ Error: ${error.message}`);
    }
  }
};
