
module.exports = {
  config: {
    name: "admin",
    version: "1.0.0",
    author: "Sheikh Tamim",
    countDown: 5,
    role: 2,
    shortDescription: "Manage admins for DM and GC",
    longDescription: "Add, remove, and list admins for both DM and group chats",
    category: "admin",
    guide: "{pn} add dm [number]\n{pn} add gc [uid]\n{pn} remove dm\n{pn} remove gc\n{pn} list"
  },

  ST: async function ({ message, event, args, config }) {
    try {
      const fs = require('fs-extra');
      const path = require('path');
      const configPath = path.join(__dirname, '../../config.json');

      if (args.length === 0) {
        return message.reply(`📖 Admin Command Usage:\n\n` +
          `• ${config.prefix}admin add dm [number] - Add DM admin\n` +
          `• ${config.prefix}admin add gc [uid] - Add GC admin\n` +
          `• ${config.prefix}admin remove dm - Remove DM admin\n` +
          `• ${config.prefix}admin remove gc - Remove GC admin\n` +
          `• ${config.prefix}admin list - View admins`);
      }

      if (args[0].toLowerCase() === 'list') {
        let adminList = `👑 Admin List\n\n`;
        adminList += `📱 DM Admin: ${config.adminId || 'Not set'}\n`;
        adminList += `👥 GC Admin: ${config.gcAdminUid || 'Not set'}\n`;
        return message.reply(adminList);
      }

      if (args[0].toLowerCase() === 'add') {
        if (args[1].toLowerCase() === 'dm' && args[2]) {
          config.adminId = args[2];
          await fs.writeJson(configPath, config, { spaces: 2 });
          return message.reply(`✅ DM Admin set to: ${args[2]}`);
        } else if (args[1].toLowerCase() === 'gc' && args[2]) {
          config.gcAdminUid = args[2];
          await fs.writeJson(configPath, config, { spaces: 2 });
          return message.reply(`✅ GC Admin set to: ${args[2]}`);
        }
      }

      if (args[0].toLowerCase() === 'remove') {
        if (args[1].toLowerCase() === 'dm') {
          config.adminId = '';
          await fs.writeJson(configPath, config, { spaces: 2 });
          return message.reply(`✅ DM Admin removed`);
        } else if (args[1].toLowerCase() === 'gc') {
          config.gcAdminUid = '';
          await fs.writeJson(configPath, config, { spaces: 2 });
          return message.reply(`✅ GC Admin removed`);
        }
      }

    } catch (error) {
      console.error('Admin command error:', error);
      await message.reply(`❌ Error: ${error.message}`);
    }
  }
};
module.exports = {
  config: {
    name: "admin",
    version: "1.0.0",
    author: "Sheikh Tamim",
    countDown: 5,
    role: 2,
    shortDescription: "Manage bot admins",
    longDescription: "Add, remove, or list bot admins for DM and GC",
    category: "admin",
    guide: "{pn} add [uid] - Add admin\n{pn} remove [uid] - Remove admin\n{pn} list - List all admins\n{pn} dm add [uid] - Add DM admin\n{pn} dm remove [uid] - Remove DM admin\n{pn} dm list - List DM admins"
  },

  ST: async function ({ message, event, args, config }) {
    const fs = require('fs-extra');
    const path = require('path');
    
    try {
      if (args.length === 0) {
        return message.reply(`📖 *Admin Command Usage:*\n\n` +
          `• !admin add [uid] - Add GC admin\n` +
          `• !admin remove [uid] - Remove GC admin\n` +
          `• !admin list - List GC admins\n` +
          `• !admin dm add [uid] - Add DM admin\n` +
          `• !admin dm remove [uid] - Remove DM admin\n` +
          `• !admin dm list - List DM admins`);
      }

      const configPath = path.join(__dirname, '../../config.json');
      const configData = await fs.readJson(configPath);

      // DM Admin Management
      if (args[0].toLowerCase() === 'dm') {
        if (!args[1]) {
          return message.reply('❌ Please specify: add, remove, or list');
        }

        if (args[1].toLowerCase() === 'add') {
          if (!args[2]) {
            return message.reply('❌ Please provide UID to add!');
          }

          const uid = args[2].replace('@', '').trim();
          
          if (!Array.isArray(configData.dmAdmin)) {
            configData.dmAdmin = [];
          }

          if (configData.dmAdmin.includes(uid)) {
            return message.reply('⚠️ This user is already a DM admin!');
          }

          configData.dmAdmin.push(uid);
          await fs.writeJson(configPath, configData, { spaces: 2 });
          global.ST.config = configData;

          return message.reply(`✅ Successfully added ${uid} as DM admin!`);
        }

        if (args[1].toLowerCase() === 'remove') {
          if (!args[2]) {
            return message.reply('❌ Please provide UID to remove!');
          }

          const uid = args[2].replace('@', '').trim();

          if (!Array.isArray(configData.dmAdmin) || !configData.dmAdmin.includes(uid)) {
            return message.reply('❌ This user is not a DM admin!');
          }

          configData.dmAdmin = configData.dmAdmin.filter(id => id !== uid);
          await fs.writeJson(configPath, configData, { spaces: 2 });
          global.ST.config = configData;

          return message.reply(`✅ Successfully removed ${uid} from DM admins!`);
        }

        if (args[1].toLowerCase() === 'list') {
          const dmAdmins = configData.dmAdmin || [];

          if (dmAdmins.length === 0) {
            return message.reply('📋 No DM admins configured.');
          }

          let listText = `👥 *DM Admins List*\n\n`;
          dmAdmins.forEach((admin, index) => {
            listText += `${index + 1}. ${admin}\n`;
          });

          const sent = await message.reply(listText);
          
          // Store for onReply
          global.ST.onReply.set(sent.key.id, {
            commandName: 'admin',
            type: 'dm_list',
            admins: dmAdmins,
            messageID: sent.key.id
          });

          return;
        }

        return message.reply('❌ Invalid option! Use: add, remove, or list');
      }

      // GC Admin Management
      if (args[0].toLowerCase() === 'add') {
        if (!args[1]) {
          return message.reply('❌ Please provide UID to add!');
        }

        const uid = args[1].replace('@', '').trim();

        if (!Array.isArray(configData.gcAdminUid)) {
          configData.gcAdminUid = [];
        }

        if (configData.gcAdminUid.includes(uid)) {
          return message.reply('⚠️ This user is already a GC admin!');
        }

        configData.gcAdminUid.push(uid);
        await fs.writeJson(configPath, configData, { spaces: 2 });
        global.ST.config = configData;

        return message.reply(`✅ Successfully added ${uid} as GC admin!`);
      }

      if (args[0].toLowerCase() === 'remove') {
        if (!args[1]) {
          return message.reply('❌ Please provide UID to remove!');
        }

        const uid = args[1].replace('@', '').trim();

        if (!Array.isArray(configData.gcAdminUid) || !configData.gcAdminUid.includes(uid)) {
          return message.reply('❌ This user is not a GC admin!');
        }

        configData.gcAdminUid = configData.gcAdminUid.filter(id => id !== uid);
        await fs.writeJson(configPath, configData, { spaces: 2 });
        global.ST.config = configData;

        return message.reply(`✅ Successfully removed ${uid} from GC admins!`);
      }

      if (args[0].toLowerCase() === 'list') {
        const gcAdmins = configData.gcAdminUid || [];

        if (gcAdmins.length === 0) {
          return message.reply('📋 No GC admins configured.');
        }

        let listText = `👥 *GC Admins List*\n\n`;
        gcAdmins.forEach((admin, index) => {
          listText += `${index + 1}. ${admin}\n`;
        });

        const sent = await message.reply(listText);

        // Store for onReply
        global.ST.onReply.set(sent.key.id, {
          commandName: 'admin',
          type: 'gc_list',
          admins: gcAdmins,
          messageID: sent.key.id
        });

        return;
      }

      return message.reply('❌ Invalid option! Use: add, remove, or list');

    } catch (error) {
      console.error('Admin command error:', error);
      await message.reply(`❌ Error: ${error.message}`);
    }
  },

  onReply: async function ({ message, event, Reply }) {
    const fs = require('fs-extra');
    const path = require('path');
    
    try {
      const userReply = event.body.trim().toLowerCase();
      
      if (userReply.startsWith('r ')) {
        const indexToRemove = parseInt(userReply.split(' ')[1]) - 1;
        
        if (isNaN(indexToRemove) || indexToRemove < 0 || indexToRemove >= Reply.admins.length) {
          return message.reply('❌ Invalid serial number!');
        }

        const configPath = path.join(__dirname, '../../config.json');
        const configData = await fs.readJson(configPath);
        
        const uidToRemove = Reply.admins[indexToRemove];

        if (Reply.type === 'gc_list') {
          configData.gcAdminUid = configData.gcAdminUid.filter(id => id !== uidToRemove);
          await fs.writeJson(configPath, configData, { spaces: 2 });
          global.ST.config = configData;
          
          await message.reply(`✅ Successfully removed ${uidToRemove} from GC admins!`);
        } else if (Reply.type === 'dm_list') {
          configData.dmAdmin = configData.dmAdmin.filter(id => id !== uidToRemove);
          await fs.writeJson(configPath, configData, { spaces: 2 });
          global.ST.config = configData;
          
          await message.reply(`✅ Successfully removed ${uidToRemove} from DM admins!`);
        }

        global.ST.onReply.delete(Reply.messageID);
      }

    } catch (error) {
      console.error('Admin onReply error:', error);
      await message.reply(`❌ Error: ${error.message}`);
    }
  }
};
