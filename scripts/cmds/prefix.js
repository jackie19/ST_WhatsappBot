
module.exports = {
  config: {
    name: "prefix",
    version: "1.0.0",
    author: "Sheikh Tamim",
    category: "config",
    description: "Change prefix for DM or GC",
    role: 0,
    usage: "prefix or prefix <new_prefix>"
  },

  ST: async function ({ message, event, args, config, prefix }) {
    const db = global.ST.db;

    if (!db) {
      return message.reply('❌ Database not initialized!');
    }

    try {
      // If no args, show current prefix
      if (args.length === 0) {
        const globalPrefix = config.prefix;
        const currentPrefix = prefix || globalPrefix;
        
        let prefixInfo = `🔧 *Prefix Information*\n\n`;
        prefixInfo += `📌 Global Prefix: ${globalPrefix}\n`;
        
        if (currentPrefix !== globalPrefix) {
          prefixInfo += `✨ Current Prefix: ${currentPrefix}\n`;
          prefixInfo += `\n╭──────────────────╮\n`;
          prefixInfo += `│  Changed Prefix  │\n`;
          prefixInfo += `╰──────────────────╯`;
        } else {
          prefixInfo += `\n╭──────────────────╮\n`;
          prefixInfo += `│  Default Prefix  │\n`;
          prefixInfo += `╰──────────────────╯`;
        }
        
        return message.reply(prefixInfo);
      }

      // Change prefix
      const newPrefix = args[0];

      if (newPrefix.length > 3) {
        return message.reply('❌ Prefix must be 1-3 characters!');
      }

      if (event.isGroup) {
        // Update thread prefix
        await db.updateThread(event.threadID, { prefix: newPrefix });
        
        let successMsg = `✅ *Prefix Changed for This Group*\n\n`;
        successMsg += `Old: ${prefix || config.prefix}\n`;
        successMsg += `New: ${newPrefix}\n\n`;
        successMsg += `╭──────────────────╮\n`;
        successMsg += `│  Changed Prefix  │\n`;
        successMsg += `╰──────────────────╯`;
        
        return message.reply(successMsg);
      } else {
        // Update DM user prefix
        await db.updateDmUser(event.senderID, { prefix: newPrefix });
        
        let successMsg = `✅ *Prefix Changed for This DM*\n\n`;
        successMsg += `Old: ${prefix || config.prefix}\n`;
        successMsg += `New: ${newPrefix}\n\n`;
        successMsg += `╭──────────────────╮\n`;
        successMsg += `│  Changed Prefix  │\n`;
        successMsg += `╰──────────────────╯`;
        
        return message.reply(successMsg);
      }

    } catch (error) {
      return message.reply(`❌ Error: ${error.message}`);
    }
  }
};
