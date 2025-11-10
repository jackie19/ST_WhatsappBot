
module.exports = {
  config: {
    name: "stats",
    version: "1.0.0",
    author: "Sheikh Tamim",
    category: "info",
    description: "View user statistics (DM: total messages, Group: serial number & group messages)",
    role: 0,
    usage: "stats [@mention or reply]"
  },

  ST: async function ({ message, event, api, args, sock }) {
    try {
      const db = global.ST?.db;
      if (!db) {
        return message.reply('❌ Database not available');
      }

      let targetUid = event.senderID;
      let targetJid = event.key.participant || event.key.remoteJid;

      if (event.messageReply && event.messageReply.senderID) {
        targetUid = event.messageReply.senderID;
        targetJid = `${targetUid}@s.whatsapp.net`;
      }

      if (event.isGroup) {
        const thread = await db.getThread(event.threadID);
        const memberData = thread?.members?.[targetUid];
        
        if (!memberData) {
          return message.reply('❌ Member data not found in this group');
        }

        let statsText = `📊 Group Member Statistics\n\n`;
        statsText += `👤 Name: ${memberData.name || 'N/A'}\n`;
        statsText += `🔢 Serial Number: #${memberData.serialNumber}\n`;
        statsText += `📱 UID: ${targetUid}\n`;
        statsText += `👑 Role: ${memberData.role}\n`;
        statsText += `💬 Messages in This Group: ${memberData.totalMsg || 0}\n`;
        
        const joinDate = new Date(memberData.joinedAt).toLocaleDateString();
        statsText += `📅 Joined Group: ${joinDate}`;

        await message.reply(statsText);
      } else {
        const dmUser = await db.getDmUser(targetUid);
        
        if (!dmUser) {
          return message.reply('❌ DM user not found in database');
        }

        let statsText = `📊 User Statistics (DM)\n\n`;
        statsText += `👤 Name: ${dmUser.name || 'N/A'}\n`;
        statsText += `📱 Phone Number: ${targetUid}\n`;
        statsText += `💬 Total DM Messages: ${dmUser.totalMsg || 0}\n`;
        
        const createdDate = new Date(dmUser.createdAt).toLocaleDateString();
        statsText += `📅 First DM: ${createdDate}`;

        await message.reply(statsText);
      }

    } catch (error) {
      console.error('Stats command error:', error);
      await message.reply(`❌ Error: ${error.message}`);
    }
  }
};
