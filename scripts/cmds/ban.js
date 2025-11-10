
module.exports = {
  config: {
    name: "ban",
    version: "3.0.0",
    author: "Sheikh Tamim",
    countDown: 5,
    role: 1,
    shortDescription: "Ban/unban users from using the bot",
    longDescription: "Ban or unban users by mention, reply, or UID. Auto-kick banned users and prevent re-add.",
    category: "admin",
    guide: "{pn} @user [reason]\n{pn} [uid] [reason]\n{pn} list - View banned users\n{pn} unban @user or [uid]"
  },

  ST: async function ({ message, event, api, args, sock, config }) {
    try {
      const db = global.ST.db;

      if (!db) {
        return message.reply("❌ Database not initialized!");
      }

      if (args.length === 0) {
        return message.reply(`📖 *Ban Command Usage:*\n\n` +
          `• ${config.prefix}ban @user [reason] - Ban by mention\n` +
          `• ${config.prefix}ban [reply to message] [reason] - Ban by reply\n` +
          `• ${config.prefix}ban [uid] [reason] - Ban by UID\n` +
          `• ${config.prefix}ban list - View banned users\n` +
          `• ${config.prefix}ban unban @user - Unban user`);
      }

      if (args[0].toLowerCase() === 'list') {
        if (event.isGroup) {
          const thread = await db.getThread(event.threadID);
          const bannedMembers = Object.values(thread?.members || {}).filter(m => m.ban === true);

          if (bannedMembers.length === 0) {
            return message.reply("✅ No banned users in this group!");
          }

          let banList = `🚫 *Banned Users in This Group*\n\n`;
          bannedMembers.forEach((member, index) => {
            banList += `${index + 1}. ${member.name || 'Unknown'}\n`;
            banList += `   UID: ${member.uid}\n`;
            banList += `   Reason: ${member.banReason || 'No reason'}\n\n`;
          });
          banList += `\n💡 Reply with "u [number]" to unban a user`;
          
          const sent = await message.reply(banList);
          
          global.ST.onReply.set(sent.key.id, {
            commandName: 'ban',
            type: 'ban_list',
            bannedUsers: bannedMembers,
            threadID: event.threadID,
            messageID: sent.key.id
          });
          
          return;
        } else {
          const allUsers = await db.getAllDmUsers();
          const bannedUsers = Object.values(allUsers).filter(u => u.ban === true);

          if (bannedUsers.length === 0) {
            return message.reply("✅ No banned users!");
          }

          let banList = `🚫 *Banned Users List*\n\n`;
          bannedUsers.forEach((user, index) => {
            banList += `${index + 1}. ${user.name || 'Unknown'}\n`;
            banList += `   Phone: ${user.phoneNumber}\n`;
            banList += `   Reason: ${user.banReason || 'No reason'}\n\n`;
          });
          banList += `\n💡 Reply with "u [number]" to unban a user`;
          
          const sent = await message.reply(banList);
          
          global.ST.onReply.set(sent.key.id, {
            commandName: 'ban',
            type: 'ban_list_dm',
            bannedUsers: bannedUsers,
            messageID: sent.key.id
          });
          
          return;
        }
      }

      if (args[0].toLowerCase() === 'unban') {
        let targetUid = null;

        if (event.messageReply && event.messageReply.senderID) {
          targetUid = event.messageReply.senderID;
        } else if (args[1]) {
          targetUid = args[1].replace('@', '').replace('@lid', '').trim();
        }

        if (!targetUid) {
          return message.reply("❌ Please mention a user, reply to their message, or provide their UID!");
        }

        if (event.isGroup) {
          await db.updateMember(event.threadID, targetUid, { ban: false, banReason: '', warning: 0 });
          return message.reply(`✅ User ${targetUid} has been unbanned in this group!`);
        } else {
          const user = await db.getDmUser(targetUid);
          if (!user || !user.ban) {
            return message.reply(`✅ User ${targetUid} is not banned!`);
          }
          await db.updateDmUser(targetUid, { ban: false, banReason: '' });
          return message.reply(`✅ User ${targetUid} has been unbanned!`);
        }
      }

      let targetUid = null;
      let banReason = '';

      if (event.messageReply && event.messageReply.senderID) {
        targetUid = event.messageReply.senderID;
        banReason = args.join(' ') || 'No reason provided';
      } else if (args[0]) {
        targetUid = args[0].replace('@', '').replace('@lid', '').trim();
        banReason = args.slice(1).join(' ') || 'No reason provided';
      }

      if (!targetUid) {
        return message.reply("❌ Please mention a user, reply to their message, or provide their UID!");
      }

      if (targetUid === event.senderID.replace('@lid', '')) {
        return message.reply("❌ You cannot ban yourself!");
      }

      const dmAdmins = Array.isArray(config.dmAdmin) ? config.dmAdmin.map(id => id.toString().replace('@lid', '')) : [];
      const gcAdminUids = Array.isArray(config.gcAdminUid) ? config.gcAdminUid.map(id => id.toString().replace('@lid', '')) : [];

      if (dmAdmins.includes(targetUid) || gcAdminUids.includes(targetUid)) {
        return message.reply("❌ You cannot ban an admin!");
      }

      if (event.isGroup) {
        const member = await db.getMember(event.threadID, targetUid);
        if (member && member.ban) {
          return message.reply(`⚠️ User ${targetUid} is already banned in this group!`);
        }

        await db.updateMember(event.threadID, targetUid, {
          ban: true,
          banReason: banReason,
          warning: 0
        });

        await message.reply(`🚫 *User Banned in This Group!*\n\n` +
          `UID: ${targetUid}\n` +
          `Reason: ${banReason}\n\n` +
          `⚙️ Attempting to kick user...`);

        try {
          const groupMetadata = await sock.groupMetadata(event.threadID);
          const botNumber = sock.user.id.split(':')[0];
          const botJid = `${botNumber}@s.whatsapp.net`;
          const isAdmin = groupMetadata.participants.find(
            p => p.id === botJid && (p.admin === 'admin' || p.admin === 'superadmin')
          );

          if (isAdmin) {
            // Find the exact participant JID from group metadata
            const targetParticipant = groupMetadata.participants.find(p => 
              p.id.includes(targetUid.replace('@lid', '').replace('@s.whatsapp.net', ''))
            );
            
            const targetJid = targetParticipant ? targetParticipant.id : `${targetUid.replace('@lid', '')}@s.whatsapp.net`;
            
            await sock.groupParticipantsUpdate(
              event.threadID,
              [targetJid],
              'remove'
            );
            await message.reply(`✅ Banned user has been kicked from the group!`);
          } else {
            await message.reply(`⚠️ Bot is not admin. Cannot kick user.`);
          }
        } catch (error) {
          console.error('Error kicking user:', error);
          await message.reply(`⚠️ Failed to kick: ${error.message}`);
        }
      } else {
        const existingUser = await db.getDmUser(targetUid);
        if (existingUser && existingUser.ban) {
          return message.reply(`⚠️ User ${targetUid} is already banned!`);
        }

        await db.updateDmUser(targetUid, {
          ban: true,
          banReason: banReason
        });

        await message.reply(`🚫 *User Banned!*\n\n` +
          `Phone: ${targetUid}\n` +
          `Reason: ${banReason}`);
      }

    } catch (error) {
      console.error('Ban command error:', error);
      await message.reply(`❌ Error: ${error.message}`);
    }
  },

  onReply: async function ({ message, event, Reply, sock }) {
    const db = global.ST.db;
    
    try {
      const userReply = event.body.trim().toLowerCase();
      
      if (userReply.startsWith('u ')) {
        const indexToUnban = parseInt(userReply.split(' ')[1]) - 1;
        
        if (isNaN(indexToUnban) || indexToUnban < 0 || indexToUnban >= Reply.bannedUsers.length) {
          return message.reply('❌ Invalid serial number!');
        }

        const userToUnban = Reply.bannedUsers[indexToUnban];

        if (Reply.type === 'ban_list') {
          await db.updateMember(Reply.threadID, userToUnban.uid, {
            ban: false,
            banReason: '',
            warning: 0
          });
          await message.reply(`✅ Successfully unbanned ${userToUnban.name || userToUnban.uid}!`);
        } else if (Reply.type === 'ban_list_dm') {
          await db.updateDmUser(userToUnban.phoneNumber, {
            ban: false,
            banReason: ''
          });
          await message.reply(`✅ Successfully unbanned ${userToUnban.name || userToUnban.phoneNumber}!`);
        }
        
        global.ST.onReply.delete(Reply.messageID);
      }
    } catch (error) {
      console.error('Ban onReply error:', error);
      await message.reply(`❌ Error: ${error.message}`);
    }
  }
};
