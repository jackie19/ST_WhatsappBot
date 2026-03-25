const axios = require("axios");
const yts = require("yt-search");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "music",
    aliases: [],
    version: "1.0.1",
    author: "ST | Sheikh Tamim",
    role: 0,
    category: "music",
    shortDescription: "Download and play music from YouTube",
    longDescription: "Search and download music from YouTube. Use -s to pick from a list.",
    guide: {
      en: "{pn} <song name>       – download top result\n" +
          "{pn} -s <song name>    – pick from a list of 6 results"
    }
  },

  ST: async function ({ message, args, event, sock }) {
    const stapi = new global.utils.STBotApis();

    if (!args[0]) return message.reply("🎵 Please enter a song name.\nExample: !music shape of you");

    let showList = false;
    if (args[0] === "-s") {
      showList = true;
      args.shift();
    }

    const query = args.join(" ");
    if (!query) return message.reply("❌ Please enter a song name after -s");

    const processing = await message.reply(`⏳ Searching for "${query}"...`);

    try {
      const search = await yts(query);
      if (!search.videos.length) {
        await message.unsend(processing.key);
        return message.reply("❌ No results found for that query.");
      }

      // ──────── AUTO DOWNLOAD TOP RESULT ────────
      if (!showList) {
        const v = search.videos[0];

        await message.unsend(processing.key);
        const dlMsg = await message.reply(`⬇️ Downloading: ${v.title}`);

        // Step 1: get available formats
        const step1 = await axios.post(`${stapi.baseURL}/st/ytviddl`, { url: v.url });
        const formats = step1.data?.formats || [];

        const selected =
          formats.find(f => f.ext === "MP3") ||
          formats.find(f => f.type === "Audio");

        if (!selected) {
          await message.unsend(dlMsg.key);
          return message.reply("❌ No audio format found for this video.");
        }

        // Step 2: get final download URL
        const step2 = await axios.post(`${stapi.baseURL}/st/ytviddl`, {
          url: v.url,
          formatUrl: selected.url
        });

        if (!step2.data?.downloadUrl) {
          await message.unsend(dlMsg.key);
          return message.reply("❌ Download failed. Please try again.");
        }

        // Download audio into buffer
        const audioResp = await axios.get(step2.data.downloadUrl, { responseType: "arraybuffer" });
        const audioBuffer = Buffer.from(audioResp.data);

        await message.unsend(dlMsg.key);

        // Send info text first, then audio
        await message.reply(
          `🎶 *${v.title}*\n` +
          `👤 ${v.author.name}\n` +
          `⏱ ${v.timestamp}\n` +
          `🔗 ${v.url}`
        );

        await sock.sendMessage(message.jid, {
          audio: audioBuffer,
          mimetype: "audio/mpeg",
          fileName: `${v.title}.mp3`,
          ptt: false
        });

        return;
      }

      // ──────── SHOW LIST OF 6 RESULTS ────────
      const top = search.videos.slice(0, 6);

      let msg = `🔍 Results for "${query}"\n\n`;
      top.forEach((v, i) => {
        msg += `${i + 1}. ${v.title}\n⏱ ${v.timestamp} | 👤 ${v.author.name}\n\n`;
      });
      msg += "👉 Reply with a number (1–6) to download";

      await message.unsend(processing.key);

      const listMsg = await message.reply(msg);

      // Register reply handler
      global.ST.onReply.set(listMsg.key.id, {
        commandName: module.exports.config.name,
        author: event.senderID,
        videos: top
      });

    } catch (e) {
      console.error("Music error:", e.message);
      try { await message.unsend(processing.key); } catch {}
      return message.reply("❌ Error: " + e.message);
    }
  },

  // ──────── REPLY HANDLER (user picks from list) ────────
  onReply: async function ({ message, event, Reply, sock }) {
    if (event.senderID !== Reply.author) {
      return message.reply("⚠️ This isn't your search. Run the command yourself.");
    }

    const choice = parseInt(event.body);
    if (isNaN(choice) || choice < 1 || choice > Reply.videos.length) {
      return message.reply(`❌ Please reply with a number between 1 and ${Reply.videos.length}`);
    }

    const stapi = new global.utils.STBotApis();
    const video = Reply.videos[choice - 1];
    const userName = event.message?.pushName || event.senderID;

    const dlMsg = await message.reply(`⬇️ Downloading: ${video.title}`);

    try {
      // Step 1: get formats
      const step1 = await axios.post(`${stapi.baseURL}/st/ytviddl`, { url: video.url });
      const formats = step1.data?.formats || [];

      const selected =
        formats.find(f => f.ext === "MP3") ||
        formats.find(f => f.type === "Audio");

      if (!selected) {
        await message.unsend(dlMsg.key);
        return message.reply("❌ No audio format found for this video.");
      }

      // Step 2: get final download URL
      const step2 = await axios.post(`${stapi.baseURL}/st/ytviddl`, {
        url: video.url,
        formatUrl: selected.url
      });

      if (!step2.data?.downloadUrl) {
        await message.unsend(dlMsg.key);
        return message.reply("❌ Download failed. Please try again.");
      }

      // Download audio into buffer
      const audioResp = await axios.get(step2.data.downloadUrl, { responseType: "arraybuffer" });
      const audioBuffer = Buffer.from(audioResp.data);

      await message.unsend(dlMsg.key);

      // Send info text then audio
      await message.reply(
        `🎶 *${video.title}*\n` +
        `👤 ${video.author.name}\n` +
        `⏱ ${video.timestamp}\n` +
        `📥 Requested by: ${userName}`
      );

      await sock.sendMessage(message.jid, {
        audio: audioBuffer,
        mimetype: "audio/mpeg",
        fileName: `${video.title}.mp3`,
        ptt: false
      });

    } catch (err) {
      console.error("Music onReply error:", err.message);
      try { await message.unsend(dlMsg.key); } catch {}
      return message.reply("❌ Download error: " + err.message);
    }
  }
};
