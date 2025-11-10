
module.exports = {
  config: {
    name: "cmd",
    aliases: [],
    version: "1.0.0",
    author: "Sheikh Tamim",
    category: "admin",
    description: "Manage commands (load/unload/loadall/install/delete)",
    role: 2,
    usage: "cmd <load/unload/loadall/install/delete> <name>",
    usePrefix: true
  },

  ST: async function ({ message, event, args, config }) {
    const fs = require('fs-extra');
    const path = require('path');
    const axios = require('axios');

    if (args.length < 1) {
      return message.reply(
        `📖 *CMD Management*\n\n` +
        `• ${config.prefix}cmd load <name>\n` +
        `• ${config.prefix}cmd unload <name>\n` +
        `• ${config.prefix}cmd loadall\n` +
        `• ${config.prefix}cmd install <url/code> <name.js>\n` +
        `• ${config.prefix}cmd delete <name>`
      );
    }

    const action = args[0].toLowerCase();
    const name = args[1];

    try {
      // LOAD COMMAND
      if (action === 'load') {
        if (!name) return message.reply('❌ Please specify command name!');

        const cmdPath = path.join(__dirname, `${name}.js`);
        if (!await fs.pathExists(cmdPath)) {
          return message.reply(`❌ Command file ${name}.js not found!`);
        }

        delete require.cache[require.resolve(cmdPath)];
        const command = require(cmdPath);

        if (!command.config || !command.config.name) {
          return message.reply('❌ Invalid command structure!');
        }

        const mainName = command.config.name.toLowerCase();
        const aliases = command.config.aliases || [];

        // Register main command
        global.ST.commands.set(mainName, command);

        // Register aliases
        for (const alias of aliases) {
          global.ST.commands.set(alias.toLowerCase(), command);
        }

        let msg = `✅ Loaded command: ${command.config.name}`;
        if (aliases.length > 0) {
          msg += `\n📝 Aliases: ${aliases.join(', ')}`;
        }

        return message.reply(msg);
      }

      // LOAD ALL COMMANDS
      if (action === 'loadall') {
        const cmdPath = path.join(__dirname);
        const files = await fs.readdir(cmdPath);
        const jsFiles = files.filter(f => f.endsWith('.js') && f !== 'cmd.js');

        let loaded = 0;
        let failed = 0;
        const errors = [];

        for (const file of jsFiles) {
          try {
            const filePath = path.join(cmdPath, file);
            delete require.cache[require.resolve(filePath)];
            const command = require(filePath);

            if (!command.config || !command.config.name) {
              failed++;
              errors.push(`${file}: Missing config or name`);
              continue;
            }

            const mainName = command.config.name.toLowerCase();
            const aliases = command.config.aliases || [];

            global.ST.commands.set(mainName, command);

            for (const alias of aliases) {
              global.ST.commands.set(alias.toLowerCase(), command);
            }

            loaded++;
          } catch (error) {
            failed++;
            errors.push(`${file}: ${error.message}`);
          }
        }

        let msg = `✅ Loaded ${loaded} command(s)`;
        if (failed > 0) {
          msg += `\n❌ Failed: ${failed}`;
          msg += `\n\n${errors.join('\n')}`;
        }

        return message.reply(msg);
      }

      // UNLOAD COMMAND
      if (action === 'unload') {
        if (!name) return message.reply('❌ Please specify command name!');

        const nameLower = name.toLowerCase();
        if (!global.ST.commands.has(nameLower)) {
          return message.reply(`❌ Command ${name} is not loaded!`);
        }

        const command = global.ST.commands.get(nameLower);
        const mainName = command.config.name.toLowerCase();
        const aliases = command.config.aliases || [];

        // Remove main command
        global.ST.commands.delete(mainName);

        // Remove aliases
        for (const alias of aliases) {
          global.ST.commands.delete(alias.toLowerCase());
        }

        return message.reply(`✅ Unloaded command: ${name}`);
      }

      // INSTALL FROM URL OR CODE
      if (action === 'install') {
        if (!name) return message.reply('❌ Please specify filename (e.g., help.js)!');

        const urlOrCode = args[1];
        const filename = args[2] || name;
        const isUrl = urlOrCode.startsWith('http://') || urlOrCode.startsWith('https://');
        let code = '';

        if (isUrl) {
          const response = await axios.get(urlOrCode);
          code = response.data;
        } else {
          code = args.slice(1).join(' ');
        }

        const filePath = path.join(__dirname, filename);
        await fs.writeFile(filePath, code);
        return message.reply(`✅ Installed command: ${filename}\n\nUse ${config.prefix}cmd load ${filename.replace('.js', '')} to activate it.`);
      }

      // DELETE COMMAND
      if (action === 'delete') {
        if (!name) return message.reply('❌ Please specify command name!');

        const cmdPath = path.join(__dirname, `${name}.js`);
        if (!await fs.pathExists(cmdPath)) {
          return message.reply(`❌ Command file ${name}.js not found!`);
        }

        const nameLower = name.toLowerCase();
        if (global.ST.commands.has(nameLower)) {
          const command = global.ST.commands.get(nameLower);
          const mainName = command.config.name.toLowerCase();
          const aliases = command.config.aliases || [];

          global.ST.commands.delete(mainName);
          for (const alias of aliases) {
            global.ST.commands.delete(alias.toLowerCase());
          }
        }

        await fs.unlink(cmdPath);
        return message.reply(`✅ Deleted command: ${name}`);
      }

      return message.reply('❌ Invalid action!');

    } catch (error) {
      return message.reply(`❌ Error: ${error.message}`);
    }
  }
};
