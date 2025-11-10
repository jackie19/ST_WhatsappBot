
module.exports = {
  config: {
    name: "uid",
    version: "1.0.0",
    author: "Sheikh Tamim",
    category: "utility",
    description: "Get user UID",
    role: 0,
    usage: "uid [@mention or reply]"
  },

  ST: async function ({ message, event, api, args, sock }) {
    try {
      let targetUid = event.senderID;
      let targetName = 'Your';

      // Check if replying to a message
      if (event.messageReply && event.messageReply.senderID) {
        targetUid = event.messageReply.senderID;
        targetName = event.messageReply.senderID;
      } 
      // Check if mentioned someone
      else if (args[0]) {
        // Extract UID from mention
        const mentionedUid = args[0].replace('@', '').replace('@lid', '').replace('@s.whatsapp.net', '').trim();
        if (mentionedUid && mentionedUid !== event.senderID) {
          targetUid = mentionedUid;
          targetName = mentionedUid;
        }
      }

      await message.reply(`📱 ${targetName === 'Your' ? 'Your' : targetName + "'s"} UID: ${targetUid}`);

    } catch (error) {
      console.error('UID command error:', error);
      await message.reply(`❌ Error: ${error.message}`);
    }
  }
};
