
module.exports = {
  config: {
    name: "balance",
    version: "1.0.0",
    author: "Sheikh Tamim",
    countDown: 3,
    role: 0,
    shortDescription: "Check user balance",
    longDescription: "Check your balance or another user's balance",
    category: "economy",
    guide: "{pn}\n{pn} @user\n{pn} [uid]"
  },

  ST: async function ({ message, event, args }) {
    try {
      const db = global.ST.db;

      if (!db) {
        return message.reply("❌ Database not initialized!");
      }

      let targetUid = event.senderID;

      if (event.messageReply && event.messageReply.senderID) {
        targetUid = event.messageReply.senderID;
      } else if (args[0]) {
        targetUid = args[0].replace('@', '').trim();
      }

      if (event.isGroup) {
        const member = await db.getMember(event.threadID, targetUid);
        
        if (!member) {
          return message.reply("❌ User not found in this group!");
        }

        let balanceText = `💰 Balance Information\n\n`;
        balanceText += `👤 User: ${member.name || targetUid}\n`;
        balanceText += `💵 Money: ${member.money || 0}\n`;

        await message.reply(balanceText);

      } else {
        const user = await db.getDmUser(targetUid);
        
        if (!user) {
          return message.reply("❌ User not found!");
        }

        let balanceText = `💰 Balance Information\n\n`;
        balanceText += `👤 User: ${user.name || targetUid}\n`;
        balanceText += `💵 Money: ${user.money || 0}\n`;

        await message.reply(balanceText);
      }

    } catch (error) {
      console.error('Balance command error:', error);
      await message.reply(`❌ Error: ${error.message}`);
    }
  },

  calculateRank(exp) {
    const ranks = [
      { level: 1, name: "Newbie", requiredExp: 0 },
      { level: 2, name: "Beginner", requiredExp: 100 },
      { level: 3, name: "Amateur", requiredExp: 300 },
      { level: 4, name: "Intermediate", requiredExp: 600 },
      { level: 5, name: "Advanced", requiredExp: 1000 },
      { level: 6, name: "Expert", requiredExp: 1500 },
      { level: 7, name: "Master", requiredExp: 2100 },
      { level: 8, name: "Grandmaster", requiredExp: 2800 },
      { level: 9, name: "Legend", requiredExp: 3600 },
      { level: 10, name: "Mythic", requiredExp: 5000 }
    ];

    for (let i = ranks.length - 1; i >= 0; i--) {
      if (exp >= ranks[i].requiredExp) {
        const nextRank = ranks[i + 1];
        const progress = nextRank 
          ? Math.floor(((exp - ranks[i].requiredExp) / (nextRank.requiredExp - ranks[i].requiredExp)) * 100)
          : 100;
        
        return {
          level: ranks[i].level,
          name: ranks[i].name,
          progress: progress
        };
      }
    }

    return { level: 1, name: "Newbie", progress: 0 };
  }
};