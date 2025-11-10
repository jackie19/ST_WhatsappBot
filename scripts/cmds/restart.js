
module.exports = {
  config: {
    name: "restart",
    version: "1.0.0",
    author: "Sheikh Tamim",
    countDown: 5,
    role: 2,
    shortDescription: "Restart the bot",
    longDescription: "Restart the bot process (Admin only)",
    category: "admin",
    guide: "{pn}"
  },

  ST: async function ({ message, event, api, sock, config }) {
    const fs = require('fs-extra');
    const path = require('path');
    
    try {
      await message.reply("🔄 Restarting bot...");
      
      // Create cache directory if not exists
      const cachePath = path.join(__dirname, '../../cache');
      await fs.ensureDir(cachePath);
      
      // Store restart info
      const restartFile = path.join(cachePath, 'restart.txt');
      await fs.writeJson(restartFile, {
        jid: event.threadID,
        timestamp: Date.now()
      });
      
      // Exit with code 2 to trigger auto-restart from index.js
      setTimeout(() => {
        process.exit(2);
      }, 1000);
      
    } catch (error) {
      await message.reply(`❌ Restart failed: ${error.message}`);
    }
  }
};
