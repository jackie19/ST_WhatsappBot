
module.exports = {
  config: {
    name: "leave",
    version: "1.0.0",
    author: "Sheikh Tamim",
    category: "events",
    description: "Sends goodbye message when someone leaves or is removed from the group"
  },

  ST: async function ({ event, message, api, sock }) {
    try {
      if (!event.isGroup) return;

      const messageObj = event.message;

      // Check for group participant removal/leave (type 28 = remove, 32 = leave)
      if (messageObj.messageStubType === 28 || messageObj.messageStubType === 32) {
        const participants = messageObj.messageStubParameters || [];
        
        if (participants.length === 0) return;

        if (messageObj.messageStubType === 28) {
          // User removed by admin
          const removedBy = messageObj.participant?.split('@')[0].replace('@lid', '') || 'Admin';

          for (const participant of participants) {
            const uid = participant.replace('@s.whatsapp.net', '').replace('@lid', '');
            const leaveText = `🚫 User Removed\n\n` +
                            `👤 @${uid} has been removed\n` +
                            `⚠️ Removed by: @${removedBy}\n\n` +
                            `Powered by ST_WhatsappBot 🤖`;

            await message.send(leaveText);
          }
        } else if (messageObj.messageStubType === 32) {
          // User left voluntarily
          for (const participant of participants) {
            const uid = participant.replace('@s.whatsapp.net', '').replace('@lid', '');
            const leaveText = `👋 Goodbye!\n\n` +
                            `😢 @${uid} has left the group\n` +
                            `💔 We'll miss you!\n\n` +
                            `Powered by ST_WhatsappBot 🤖`;

            await message.send(leaveText);
          }
        }
      }

    } catch (error) {
      console.error('Leave event error:', error);
    }
  }
};
