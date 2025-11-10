
const axios = require('axios');

module.exports = {
  config: {
    name: "pp",
    version: "1.0.0",
    author: "Sheikh Tamim",
    category: "utility",
    description: "Get profile picture of user",
    role: 0,
    usage: "pp [@mention or reply]"
  },

  ST: async function ({ message, event, api, args, sock }) {
    try {
      let targetUid = event.senderID;
      let targetJid = event.key.participant || event.key.remoteJid;
      let userName = 'Your';

      if (event.messageReply && event.messageReply.senderID) {
        targetUid = event.messageReply.senderID;
        targetJid = targetUid.includes('@') ? targetUid : `${targetUid}@s.whatsapp.net`;
        userName = targetUid.replace('@s.whatsapp.net', '').replace('@lid', '');
      } else if (args[0]) {
        targetUid = args[0].replace('@', '').replace('@lid', '').replace('@s.whatsapp.net', '').trim();
        
        // Check if it's a LID user
        if (event.isGroup) {
          const db = global.ST?.db;
          if (db) {
            const thread = await db.getThread(event.threadID);
            const member = thread?.members?.[targetUid];
            if (member) {
              targetJid = `${targetUid}@lid`;
            } else {
              targetJid = `${targetUid}@s.whatsapp.net`;
            }
          } else {
            targetJid = `${targetUid}@s.whatsapp.net`;
          }
        } else {
          targetJid = `${targetUid}@s.whatsapp.net`;
        }
        
        userName = targetUid;
      }

      try {
        const pfpUrl = await sock.profilePictureUrl(targetJid, 'image');
        
        if (pfpUrl) {
          const response = await axios.get(pfpUrl, { responseType: 'arraybuffer' });
          const buffer = Buffer.from(response.data);
          await message.sendImage(buffer, `📸 ${userName} Profile Picture`);
        } else {
          await message.reply('❌ No profile picture found');
        }
      } catch (error) {
        await message.reply('❌ Could not retrieve profile picture. User may not have one set.');
      }

    } catch (error) {
      console.error('PP command error:', error);
      await message.reply(`❌ Error: ${error.message}`);
    }
  }
};
