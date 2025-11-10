
module.exports = {
  config: {
    name: "welcome",
    version: "1.0.0",
    author: "Sheikh Tamim",
    category: "events",
    description: "Sends welcome message when someone joins the group or bot is added"
  },

  ST: async function ({ event, message, api, sock }) {
    try {
      if (!event.isGroup) return;

      const messageObj = event.message;
      const botNumber = sock.user.id.split(':')[0];

      // Check for group participant add (type 27 = add, 31 = invite)
      if (messageObj.messageStubType === 27 || messageObj.messageStubType === 31) {
        const participants = messageObj.messageStubParameters || [];

        if (participants.length === 0) return;

        for (const participant of participants) {
          const uid = participant.replace('@s.whatsapp.net', '').replace('@lid', '');
          
          // Check if bot was added
          if (uid === botNumber || participant.includes(botNumber)) {
            const welcomeText = `🤖 Thank you for adding me!\n\n` +
                              `Hi everyone! I'm ST WhatsApp Bot 👋\n` +
                              `Use my commands to interact with me!\n\n` +
                              `Type *!help* to see available commands.\n\n` +
                              `Powered by ST_WhatsappBot 🚀`;
            await message.send(welcomeText);
          } else {
            // Regular user added
            try {
              const groupMetadata = await sock.groupMetadata(event.threadID);
              const addedBy = messageObj.participant?.split('@')[0].replace('@lid', '') || 'Admin';
              
              const welcomeText = `👋 Welcome to ${groupMetadata.subject}!\n\n` +
                                `🎉 Welcome @${uid}\n` +
                                `➕ Added by: @${addedBy}\n` +
                                `📝 Please read the group rules\n` +
                                `💬 Feel free to chat and have fun!\n\n` +
                                `Powered by ST_WhatsappBot 🤖`;

              await message.send(welcomeText);
            } catch (err) {
              console.error('Error getting group metadata:', err.message);
            }
          }
        }
      }

    } catch (error) {
      console.error('Welcome event error:', error);
    }
  }
};
