
module.exports = {
  config: {
    name: "help",
    aliases: [],
    version: "1.0.0",
    author: "Sheikh Tamim",
    countDown: 5,
    role: 0,
    shortDescription: "Shows all available commands",
    longDescription: "Displays a list of all bot commands with their descriptions",
    category: "system",
    guide: "{pn} or {pn} <command>",
    usePrefix: true
  },

  ST: async function ({ message, event, api, args, sock, config }) {
    try {
      const commands = global.ST.commands;

      if (args.length > 0) {
        const cmdName = args[0].toLowerCase();
        const cmd = commands.get(cmdName);

        if (!cmd) {
          return message.reply(`❌ Command "${cmdName}" not found!`);
        }

        let helpText = `╭─────────────────◊\n`;
        helpText += `│ 📖 Command: ${cmd.config.name}\n`;
        helpText += `├─────────────────◊\n`;
        helpText += `│ 📝 Description: ${cmd.config.longDescription || cmd.config.shortDescription}\n`;
        helpText += `│ 👤 Author: ${cmd.config.author}\n`;
        helpText += `│ 📁 Category: ${cmd.config.category}\n`;
        helpText += `│ 🔐 Role: ${cmd.config.role === 0 ? 'Everyone' : cmd.config.role === 1 ? 'Admin' : 'Owner'}\n`;
        
        if (cmd.config.aliases && cmd.config.aliases.length > 0) {
          helpText += `│ 🔤 Aliases: ${cmd.config.aliases.join(', ')}\n`;
        }
        
        const usePrefix = cmd.config.usePrefix !== undefined ? cmd.config.usePrefix : true;
        helpText += `│ 🏷️ Prefix: ${usePrefix ? 'Required' : 'Optional'}\n`;
        helpText += `│ 📚 Usage: ${cmd.config.guide ? cmd.config.guide.replace('{pn}', config.prefix + cmd.config.name) : config.prefix + cmd.config.name}\n`;
        helpText += `╰─────────────────◊`;

        return message.reply(helpText);
      }

      const categories = {};
      const processedCommands = new Set();

      for (const [name, cmd] of commands) {
        // Skip if this is an alias and we already processed the main command
        const mainName = cmd.config.name.toLowerCase();
        if (processedCommands.has(mainName)) continue;
        
        processedCommands.add(mainName);
        
        const category = cmd.config.category || 'other';
        if (!categories[category]) {
          categories[category] = [];
        }
        categories[category].push({
          name: cmd.config.name,
          aliases: cmd.config.aliases || [],
          description: cmd.config.shortDescription,
          usePrefix: cmd.config.usePrefix !== undefined ? cmd.config.usePrefix : true
        });
      }

      let helpText = `╭─────────────────◊\n`;
      helpText += `│ 🤖 ST_WhatsappBot\n`;
      helpText += `├─────────────────◊\n`;
      helpText += `│ 📊 Total: ${processedCommands.size} commands\n`;
      helpText += `│ ⚙️ Prefix: ${config.prefix}\n`;
      helpText += `╰─────────────────◊\n\n`;

      for (const [category, cmds] of Object.entries(categories)) {
        helpText += `╭──── [ ${category.toUpperCase()} ]\n`;
        
        for (const cmd of cmds) {
          const cmdDisplay = cmd.aliases.length > 0 
            ? `${cmd.name} (${cmd.aliases.join(', ')})`
            : cmd.name;
          const prefixIcon = cmd.usePrefix ? '✧' : '○';
          helpText += `│ ${prefixIcon}${cmdDisplay}\n`;
        }
        
        helpText += `╰───────────────◊\n\n`;
      }

      helpText += `💡 Type ${config.prefix}help <command> for details\n`;
      helpText += `✧ = Requires prefix | ○ = No prefix needed`;

      await message.reply(helpText);

    } catch (error) {
      await message.reply(`❌ Error: ${error.message}`);
    }
  }
};
