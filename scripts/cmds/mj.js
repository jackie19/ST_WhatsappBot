const axios = require("axios");
const fs = require("fs");
const path = require("path");

const TASK_JSON = path.join(__dirname, "cache", "midj_tasks.json");
if (!fs.existsSync(path.join(__dirname, "cache"))) {
  fs.mkdirSync(path.join(__dirname, "cache"));
}
if (!fs.existsSync(TASK_JSON)) fs.writeFileSync(TASK_JSON, "{}");

const BASE_URL = async () => {
  try {
    const rakib = await axios.get("https://gitlab.com/Rakib-Adil-69/shizuoka-command-store/-/raw/main/apiUrls.json");
    return rakib.data.mj;
  } catch {
    return "https://xnil.vercel.app";
  }
}

module.exports = {
  config: {
    name: "mj",
    aliases: ["midjourney", "midj"],
    author: "Rakib Adil | Modified By ST",
    version: "2.4.70",
    role: 0,
    shortDescription: "AI image generation with MidJourney style",
    longDescription: "Generate and upscale MidJourney-style images",
    category: "image",
    guide: "{pn} <prompt>"
  },

  ST: async function ({ args, message, event }) {
    const prompt = args.join(" ").trim();
    if (!prompt) return message.reply("⚠️ Please provide a prompt.");

    const loading = await message.reply("Generating image, please wait.. 🎨");
    await message.react("⏳");

    try {
      const res = await axios.get(`${await BASE_URL()}/imagine`, {
        params: { prompt: encodeURIComponent(prompt) }
      });

      const data = res.data;
      if (!data || !data.murl) {
        await message.unsend(loading.key);
        await message.react("❌");
        return message.reply("❌ Failed to generate image. Please try again later.");
      }

      const taskId = data.taskId || "unknown";
      const murl = data.murl;

      const tasks = JSON.parse(fs.readFileSync(TASK_JSON, "utf8"));
      tasks[event.threadID] = taskId;
      fs.writeFileSync(TASK_JSON, JSON.stringify(tasks, null, 2));

      await message.unsend(loading.key);
      await message.react("✅");

      const img = await global.utils.getStreamFromURL(murl);
      const sent = await message.sendImage(
        img,
        `🧠 Prompt: ${prompt}\n💬 Reply with U1–U4 to upscale or V1-V4 for variations`
      );

      if (sent && sent.key && sent.key.id) {
        global.ST.onReply.set(sent.key.id, {
          commandName: 'mj',
          taskId,
          prompt,
          author: event.senderID
        });
      }
    } catch (err) {
      console.error("Generation error:", err.message || err);
      await message.unsend(loading.key);
      await message.react("❌");
      return message.reply("❌ Generation failed. Try again later.");
    }
  },

  onReply: async function ({ event, Reply, message }) {
    if (event.senderID !== Reply.author) {
      return;
    }

    const input = (event.body || "").trim().toLowerCase();
    const validActions = ["u1", "u2", "u3", "u4", "v1", "v2", "v3", "v4"];
    if (!validActions.includes(input)) return;

    const cid = input.replace(/[uv]/, "");
    const mode = input.startsWith("v") ? "variation" : "upscale";
    const processing = await message.reply(`🔄 Processing ${input.toUpperCase()} (${mode})...`);
    await message.react("⏳");

    try {
      const endpoint = mode === "upscale" ? "up" : "var";
      const url = `${await BASE_URL()}/${endpoint}?tid=${Reply.taskId}&cid=${cid}`;

      const res = await axios.get(url);
      const data = res.data;

      if (!data || !data.url) {
        await message.unsend(processing.key);
        await message.react("❌");
        return message.reply(`❌ ${mode} failed for ${input.toUpperCase()}.`);
      }

      await message.unsend(processing.key);
      await message.react("✅");

      const img = await global.utils.getStreamFromURL(data.url);
      const sent = await message.sendImage(
        img,
        `✅ ${mode === "upscale" ? "Upscaled" : "Variation"} ${input.toUpperCase()} done.\n💬 Reply again with U1–U4 or V1-V4`
      );

      if (sent && sent.key && sent.key.id) {
        global.ST.onReply.set(sent.key.id, {
          commandName: 'mj',
          taskId: data.tid || Reply.taskId,
          prompt: Reply.prompt,
          author: event.senderID
        });
      }
    } catch (err) {
      console.error(`${mode} error:`, err.message || err);
      await message.unsend(processing.key);
      await message.react("❌");
      message.reply(`❌ Error while processing ${input.toUpperCase()}. Try again later.`);
    }
  }
};
