
module.exports = {
  config: {
    name: "tid",
    version: "1.0.0",
    author: "Sheikh Tamim",
    category: "utility",
    description: "Get thread/group information",
    role: 0,
    usage: "tid"
  },

  ST: async function ({ message, event, api, sock }) {
    try {
      if (!event.isGroup) {
        return message.reply('❌ This command only works in groups');
      }

      const threadId = event.threadID;
      const db = global.ST?.db;

      if (!db) {
        return message.reply('❌ Database not available');
      }

      let thread = await db.getThread(threadId);

      if (!thread) {
        try {
          const groupMetadata = await sock.groupMetadata(threadId);
          let groupPfp = '';
          try {
            groupPfp = await sock.profilePictureUrl(threadId, 'image');
          } catch {}

          const members = {};
          for (const participant of groupMetadata.participants) {
            const uid = participant.id.replace('@s.whatsapp.net', '');
            members[uid] = {
              uid: uid,
              role: participant.admin ? (participant.admin === 'superadmin' ? 'superadmin' : 'admin') : 'member',
              joinedAt: Date.now()
            };
          }

          const admins = groupMetadata.participants
            .filter(p => p.admin)
            .map(p => p.id.replace('@s.whatsapp.net', ''));

          thread = await db.setThread(threadId, {
            tid: threadId,
            name: groupMetadata.subject,
            pfp: groupPfp,
            totalUsers: groupMetadata.participants.length,
            totalMsg: 0,
            admins: admins,
            members: members
          });
        } catch (error) {
          return message.reply(`❌ Error fetching group data: ${error.message}`);
        }
      }

      let infoText = `📋 Group Information\n\n`;
      infoText += `🆔 TID: ${thread.tid}\n`;
      infoText += `📛 Name: ${thread.name || 'N/A'}\n`;
      infoText += `👥 Total Members: ${thread.totalUsers || 0}\n`;
      infoText += `💬 Total Messages: ${thread.totalMsg || 0}\n`;
      infoText += `👑 Admins: ${thread.admins?.length || 0}\n`;

      if (thread.pfp) {
        const axios = require('axios');
        const response = await axios.get(thread.pfp, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(response.data);
        await message.sendImage(buffer, infoText);
      } else {
        await message.reply(infoText);
      }

    } catch (error) {
      console.error('TID command error:', error);
      await message.reply(`❌ Error: ${error.message}`);
    }
  }
};
