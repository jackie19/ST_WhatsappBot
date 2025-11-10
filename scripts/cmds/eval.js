
module.exports = {
  config: {
    name: "eval",
    version: "1.0.0",
    author: "Sheikh Tamim",
    countDown: 0,
    role: 2,
    shortDescription: "Execute JavaScript code",
    longDescription: "Execute any JavaScript code for testing (Main admin only)",
    category: "admin",
    guide: "{pn} [code]"
  },

  ST: async function ({ message, event, api, args, sock, config }) {
    const util = require('util');
    const axios = require('axios');
    const fs = require('fs-extra');
    
    try {
      if (args.length === 0) {
        return message.reply('❌ Please provide code to execute!');
      }

      const code = args.join(' ');

      let result;
      try {
        result = await eval(code);
      } catch (evalError) {
        result = evalError;
      }

      // Skip if result is undefined (command already sent output)
      if (result === undefined) return;

      let output;
      if (result instanceof Error) {
        output = `Error: ${result.message}`;
      } else if (typeof result === 'object') {
        output = util.inspect(result, { depth: 3, colors: false, maxArrayLength: 100 });
      } else {
        output = String(result);
      }

      // Send clean output without extra formatting
      if (output.length > 4000) {
        output = output.substring(0, 4000) + '\n... (truncated)';
      }

      await message.reply(output);

    } catch (error) {
      await message.reply(`Error: ${error.message}`);
    }
  }
};
