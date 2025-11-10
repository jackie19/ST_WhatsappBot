
module.exports = {
  config: {
    name: "event",
    aliases: [],
    version: "1.0.0",
    author: "Sheikh Tamim",
    category: "admin",
    description: "Manage events (load/unload/loadall/install/delete)",
    role: 2,
    usage: "event <load/unload/loadall/install/delete> <name>",
    usePrefix: true
  },

  ST: async function ({ message, event, args, config }) {
    const fs = require('fs-extra');
    const path = require('path');
    const axios = require('axios');

    if (args.length < 1) {
      return message.reply(
        `📖 *Event Management*\n\n` +
        `• ${config.prefix}event load <name>\n` +
        `• ${config.prefix}event unload <name>\n` +
        `• ${config.prefix}event loadall\n` +
        `• ${config.prefix}event install <url/code> <name.js>\n` +
        `• ${config.prefix}event delete <name>`
      );
    }

    const action = args[0].toLowerCase();
    const name = args[1];

    try {
      // LOAD EVENT
      if (action === 'load') {
        if (!name) return message.reply('❌ Please specify event name!');
        
        const eventPath = path.join(__dirname, '../events', `${name}.js`);
        if (!await fs.pathExists(eventPath)) {
          return message.reply(`❌ Event file ${name}.js not found!`);
        }

        delete require.cache[require.resolve(eventPath)];
        const eventModule = require(eventPath);
        
        if (!eventModule.config || !eventModule.config.name) {
          return message.reply('❌ Invalid event structure!');
        }

        global.ST.events = global.ST.events.filter(e => e.config.name !== eventModule.config.name);
        global.ST.events.push(eventModule);
        
        return message.reply(`✅ Loaded event: ${eventModule.config.name}`);
      }

      // LOAD ALL EVENTS
      if (action === 'loadall') {
        const eventsPath = path.join(__dirname, '../events');
        const files = await fs.readdir(eventsPath);
        const jsFiles = files.filter(f => f.endsWith('.js'));

        let loaded = 0;
        let failed = 0;
        const errors = [];

        for (const file of jsFiles) {
          try {
            const filePath = path.join(eventsPath, file);
            delete require.cache[require.resolve(filePath)];
            const eventModule = require(filePath);

            if (!eventModule.config || !eventModule.config.name) {
              failed++;
              errors.push(`${file}: Missing config or name`);
              continue;
            }

            global.ST.events = global.ST.events.filter(e => e.config.name !== eventModule.config.name);
            global.ST.events.push(eventModule);
            loaded++;
          } catch (error) {
            failed++;
            errors.push(`${file}: ${error.message}`);
          }
        }

        let msg = `✅ Loaded ${loaded} event(s)`;
        if (failed > 0) {
          msg += `\n❌ Failed: ${failed}`;
          msg += `\n\n${errors.join('\n')}`;
        }

        return message.reply(msg);
      }

      // UNLOAD EVENT
      if (action === 'unload') {
        if (!name) return message.reply('❌ Please specify event name!');
        
        const beforeLength = global.ST.events.length;
        global.ST.events = global.ST.events.filter(e => e.config.name !== name);
        
        if (global.ST.events.length === beforeLength) {
          return message.reply(`❌ Event ${name} is not loaded!`);
        }

        return message.reply(`✅ Unloaded event: ${name}`);
      }

      // INSTALL FROM URL OR CODE
      if (action === 'install') {
        if (!name) return message.reply('❌ Please specify filename (e.g., welcome.js)!');
        
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

        const targetDir = path.join(__dirname, '../events');
        await fs.ensureDir(targetDir);
        const filePath = path.join(targetDir, filename);

        await fs.writeFile(filePath, code);
        return message.reply(`✅ Installed event: ${filename}\n\nUse ${config.prefix}event load ${filename.replace('.js', '')} to activate it.`);
      }

      // DELETE EVENT
      if (action === 'delete') {
        if (!name) return message.reply('❌ Please specify event name!');
        
        const eventPath = path.join(__dirname, '../events', `${name}.js`);
        if (!await fs.pathExists(eventPath)) {
          return message.reply(`❌ Event file ${name}.js not found!`);
        }

        global.ST.events = global.ST.events.filter(e => e.config.name !== name);
        await fs.unlink(eventPath);
        return message.reply(`✅ Deleted event: ${name}`);
      }

      return message.reply('❌ Invalid action!');

    } catch (error) {
      return message.reply(`❌ Error: ${error.message}`);
    }
  }
};
