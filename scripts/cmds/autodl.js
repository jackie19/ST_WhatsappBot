
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "autodl",
    aliases: [],
    version: "1.0.0",
    author: "ST | Sheikh Tamim",
    countDown: 0,
    role: 0,
    shortDescription: "Auto download videos from 12+ platforms",
    longDescription: "Automatically download videos when URLs are detected in messages",
    category: "media",
    guide: {
      en: `Auto download from 12+ platforms: TikTok, Facebook, Instagram, YouTube, Twitter, Pinterest, Reddit, LinkedIn, CapCut, Douyin, Snapchat, Threads, Tumblr`
    }
  },

  ST: async function () {
    // Main command handler - not used for auto-download
  },

  onChat: async function ({ message, event }) {
    if (!event || !event.body) return;
    
    const messageText = event.body.trim();
    if (!messageText) return;

    try {
      const supportedPlatforms = [
        "vt.tiktok.com", "www.tiktok.com", "vm.tiktok.com", "tiktok.com",
        "facebook.com", "fb.watch", "fb.com",
        "instagram.com",
        "youtu.be", "youtube.com",
        "x.com", "twitter.com",
        "pin.it", "pinterest.com",
        "reddit.com", "redd.it",
        "linkedin.com",
        "capcut.com",
        "douyin.com",
        "snapchat.com",
        "threads.net",
        "tumblr.com"
      ];

      // Enhanced URL detection - supports full URLs with query parameters
      const urlPattern = /(https?:\/\/[^\s]+)/gi;
      const urls = messageText.match(urlPattern);
      
      if (!urls || urls.length === 0) return;
      
      // Check if any URL matches supported platforms
      const validUrl = urls.find(u => {
        const urlToCheck = u.toLowerCase();
        return supportedPlatforms.some(domain => urlToCheck.includes(domain.toLowerCase()));
      });
      
      if (!validUrl) return;
      
      // Add reaction immediately to show processing
      await message.react('👀');

      // Clean and prepare URL
      let finalUrl = validUrl.trim();
      if (!finalUrl.startsWith('http')) {
        finalUrl = `https://${finalUrl}`;
      }

      await message.react('⏳');

      let userName = "User";
      const db = global.ST?.db;
      if (db) {
        try {
          if (event.isGroup) {
            const member = await db.getMember(event.threadID, event.senderID);
            userName = member?.name || "User";
          } else {
            const dmUser = await db.getDmUser(event.senderID);
            userName = dmUser?.name || "User";
          }
        } catch (err) {}
      }

      const startTime = Date.now();
      const processingMsg = await message.reply(`⏳ Downloading your video, ${userName}... Please wait 😊`);

      const stbotApi = new global.utils.STBotApis();
      const apiUrl = `${stbotApi.baseURL}/api/download/auto`;
      const response = await axios.post(apiUrl, { url: finalUrl }, {
        headers: stbotApi.getHeaders(true)
      });

      const data = response.data;
      if (!data?.success || !data?.data?.videos?.length) {
        if (processingMsg) {
          try {
            const activeSock = global.ST?.sock || message.sock;
            await activeSock.sendMessage(event.threadID, {
              delete: processingMsg.key
            });
          } catch (e) {}
        }
        throw new Error("No video found or download failed.");
      }

      const videoUrl = data.data.videos[0];
      const fileExt = path.extname(videoUrl.split("?")[0]) || ".mp4";
      const cacheDir = path.join(__dirname, "cache");
      const filePath = path.join(cacheDir, `download_${Date.now()}${fileExt}`);

      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

      const media = await axios.get(videoUrl, { responseType: "arraybuffer" });
      fs.writeFileSync(filePath, Buffer.from(media.data, "binary"));

      let tinyUrl = videoUrl;
      try {
        const tinyUrlResponse = await axios.get(
          `https://tinyurl.com/api-create.php?url=${encodeURIComponent(videoUrl)}`
        );
        tinyUrl = tinyUrlResponse.data;
      } catch {}

      const endTime = Date.now();
      const timeTaken = ((endTime - startTime) / 1000).toFixed(2);

      // Unsend the processing message
      if (processingMsg) {
        try {
          const activeSock = global.ST?.sock || message.sock;
          await activeSock.sendMessage(event.threadID, {
            delete: processingMsg.key
          });
        } catch (e) {
          console.log('Could not unsend processing message:', e.message);
        }
      }

      await message.sendVideo(
        fs.readFileSync(filePath),
        `✅ Downloaded from ${data.platform?.toUpperCase() || "UNKNOWN"}\n🔗 Link: ${tinyUrl}\n⏱️ Time taken: ${timeTaken}s`
      );

      fs.unlinkSync(filePath);
      
      return false; // Stop processing other onChat handlers

    } catch (err) {
      console.error("Download error:", err);
      await message.reply(
        `❌ Error: ${err.message}\n\nSupported platforms:\nTikTok, Facebook, Instagram, YouTube, Twitter, Pinterest, Reddit, LinkedIn, CapCut, Douyin, Snapchat, Threads, Tumblr`
      );
      return false; // Stop even on error
    }
  }
};
