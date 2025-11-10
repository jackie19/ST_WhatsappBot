
module.exports = {
  config: {
    name: "warn",
    version: "1.0.0",
    author: "Sheikh Tamim",
    countDown: 5,
    role: 1,
    shortDescription: "Warn users (auto-kick at 3 warnings)",
    longDescription: "Warn users in groups. At 3 warnings, user will be auto-kicked",
    category: "admin",
    guide: "{pn} @user [reason]\n{pn} list - View warnings"
  },

  ST: async function ({ message, event, args, sock, config }) {
    try {
      const db = global.ST.db;

      if (!db) {
        return message.reply("❌ Database not initialized!");
      }

      if (!event.isGroup) {
        return message.reply("❌ This command only works in groups!");
      }

      if (args.length === 0) {
        return message.reply(`📖 *Warn Command Usage:*\n\n` +
          `• ${config.prefix}warn @user [reason]\n` +
          `• ${config.prefix}warn list - View warnings`);
      }

      if (args[0].toLowerCase() === 'list') {
        const thread = await db.getThread(event.threadID);
        const warnedMembers = Object.values(thread?.members || {}).filter(m => m.warning > 0);

        if (warnedMembers.length === 0) {
          return message.reply("✅ No warnings in this group!");
        }

        let warnList = `⚠️ *Warning List*\n\n`;
        warnedMembers.forEach((member, index) => {
          warnList += `${index + 1}. ${member.name || member.uid}\n`;
          warnList += `   Warnings: ${member.warning}/3\n\n`;
        });
        return message.reply(warnList);
      }

      let targetUid = null;
      let warnReason = '';

      if (event.messageReply && event.messageReply.senderID) {
        targetUid = event.messageReply.senderID;
        warnReason = args.join(' ') || 'No reason provided';
      } else if (args[0]) {
        targetUid = args[0].replace('@', '').trim();
        warnReason = args.slice(1).join(' ') || 'No reason provided';
      }

      if (!targetUid) {
        return message.reply("❌ Please mention a user or reply to their message!");
      }

      if (targetUid === event.senderID) {
        return message.reply("❌ You cannot warn yourself!");
      }

      const member = await db.getMember(event.threadID, targetUid);
      const currentWarnings = (member?.warning || 0) + 1;

      await db.updateMember(event.threadID, targetUid, {
        warning: currentWarnings
      });

      if (currentWarnings >= 3) {
        await message.reply(`⛔ *User Reached 3 Warnings!*\n\n` +
          `User: ${targetUid}\n` +
          `Warnings: ${currentWarnings}/3\n` +
          `Action: Kicking from group...`);

        try {
          const groupMetadata = await sock.groupMetadata(event.threadID);
          const botNumber = sock.user.id.split(':')[0];
          const isAdmin = groupMetadata.participants.find(
            p => p.id === `${botNumber}@s.whatsapp.net` && (p.admin === 'admin' || p.admin === 'superadmin')
          );

          if (isAdmin) {
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
            await db.updateMember(event.threadID, targetUid, {
              ban: true,
              banReason: `Auto-banned: 3 warnings - ${warnReason}`,
              warning: 0
            });
            await message.reply(`✅ User has been kicked and banned!`);
          } else {
            await message.reply(`⚠️ Bot is not admin. Cannot kick user.`);
          }
        } catch (error) {
          await message.reply(`❌ Failed to kick user: ${error.message}`);
        }
      } else {
        await message.reply(`⚠️ *Warning Issued!*\n\n` +
          `User: ${targetUid}\n` +
          `Warnings: ${currentWarnings}/3\n` +
          `Reason: ${warnReason}\n\n` +
          `⚠️ At 3 warnings, user will be auto-kicked!`);
      }

    } catch (error) {
      console.error('Warn command error:', error);
      await message.reply(`❌ Error: ${error.message}`);
    }
  }
};
