
# ST_WhatsappBot (STW Bot)

A feature-rich WhatsApp bot built with Baileys library, supporting commands, events, interactive messaging, and advanced AI capabilities.

## 📋 Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Configuration](#configuration)
- [Project Structure](#project-structure)
- [Available Commands](#available-commands)
- [Creating Custom Commands](#creating-custom-commands)
- [Creating Events](#creating-events)
- [API Usage](#api-usage)
- [Database](#database)
- [Support & Community](#support--community)
- [Technical Details](#technical-details)

## ✨ Features

- 🔐 **Flexible Login**: QR Code or Pairing Code authentication
- 📱 **Session Management**: Automatic session handling and reconnection
- 🤖 **Command System**: Extensible command framework with prefix support
- 🎯 **Event Handling**: React to group joins, leaves, and chat events
- 💬 **Interactive Messages**: Support for replies, reactions, and more
- 📎 **Auto Download**: Automatic video download from 12+ platforms (TikTok, Facebook, Instagram, YouTube, etc.)
- 🤖 **AI Chat**: Built-in AI chatbot (Beb) with teaching capabilities
- 🌐 **Dashboard**: Web-based dashboard for bot management
- 🔄 **Auto-restart**: Automatic restart on crashes
- 💾 **Database**: JSON and MongoDB support for user/group data
- 🎨 **Beautiful Console**: Clean startup with animated loading

## 🚀 Installation

### Quick Install (One Command)

```bash
git clone https://github.com/sheikhtamimlover/ST_WhatsappBot.git && cd ST_WhatsappBot && npm install && npm start
```

### Step-by-Step Installation

1. **Clone the repository:**
```bash
git clone https://github.com/sheikhtamimlover/ST_WhatsappBot.git
cd ST_WhatsappBot
```

2. **Install dependencies:**
```bash
npm install
```

3. **Start the bot:**
```bash
npm start
```

### Requirements

- **Node.js**: v18.0.0 or higher
- **NPM**: v8.0.0 or higher
- **Operating System**: Linux, Windows, macOS
- **Internet**: Stable connection required
- **Phone**: WhatsApp account (personal, not business)

### First Run

On first run, you'll be prompted to:
1. Enter your phone number (with country code, e.g., 8801XXXXXXXXX)
2. Choose login method (QR Code or Pairing Code)
3. Scan QR code or enter pairing code in WhatsApp

## ⚙️ Configuration

Edit `config.json` to customize your bot:

```json
{
  "prefix": "!",                    // Command prefix
  "dmAdmin": ["88016xxxxxxxx"],     // DM admin phone numbers
  "gcAdminUid": ["xxxxxxxxxxxxxxx@lid"], // Group admin UIDs
  "adminName": "Admin",
  "botName": "STW Bot",
  "prefixUse": true,                // Require prefix for commands
  "onlyAdminMode": false,           // Restrict to admin only
  "showBanner": true,               // Show startup banner
  "phoneNumber": "8801xxxxxxxxx",   // Your WhatsApp number
  "timezone": "Asia/Dhaka",         // Your timezone
  "database": {
    "type": "json",                 // "json" or "mongodb"
    "mongodb": {
      "name": "st_bot",
      "url": ""
    }
  },
  "dashboard": {
    "enabled": true,                // Enable web dashboard
    "port": 5000,
    "adminPassword": "admin123",
    "requireAuth": true
  }
}
```

## 📁 Project Structure

```
ST_WhatsappBot/
├── ST.js                      # Main bot entry point
├── index.js                   # Process manager with auto-restart
├── config.json                # Bot configuration
├── utils.js                   # Message & utilities
│
├── bot/
│   ├── login/
│   │   ├── login.js          # WhatsApp authentication
│   │   └── autoload.js       # Auto-load system
│   └── handler/
│       └── handlerEvents.js  # Message & event processing
│
├── logger/
│   ├── logs.js               # Logging system
│   └── prisma.js             # JSON database
│
├── scripts/
│   ├── cmds/                 # Command scripts
│   │   ├── help.js
│   │   ├── ping.js
│   │   ├── beb.js          # AI chatbot
│   │   ├── autodl.js       # Auto download
│   │   └── ...
│   └── events/              # Event scripts
│       ├── welcome.js
│       └── leave.js
│
├── dashboard/                # Web dashboard
│   ├── server.js
│   └── public/
│
└── session/                  # WhatsApp session (auto-generated)
```

## 📝 Available Commands

### General Commands
- `!help` - Show all commands
- `!ping` - Check bot response time
- `!stats` - Bot statistics
- `!prefix [new_prefix]` - Change prefix

### Media Commands
- `!autodl <url>` - Download from 12+ platforms (auto-detects URLs)
- `!sing <song name>` - Search and download songs

### AI Commands
- `beb <message>` - Chat with AI (works without prefix)
- `!beb teach <question> | <answer> | <emoji>` - Teach the AI
- `!beb count` - Check teaching statistics

### Admin Commands
- `!ban <@user>` - Ban user from group
- `!kick <@user>` - Kick user from group
- `!warn <@user>` - Warn user
- `!admin` - View admin panel
- `!eval <code>` - Execute JavaScript code

### Utility Commands
- `!r` - Unsend bot messages (reply to bot message)
- `!uid` - Get user ID
- `!tid` - Get thread/group ID
- `!pp` - Get profile picture

## 🛠️ Creating Custom Commands

Create a new file in `scripts/cmds/yourcommand.js`:

```javascript
module.exports = {
  config: {
    name: "yourcommand",
    version: "1.0.0",
    author: "Your Name",
    role: 0,  // 0 = everyone, 1 = group admin, 2 = bot admin
    shortDescription: "Your command description",
    category: "general",
    guide: "{pn} <usage>",
    usePrefix: true  // false = works without prefix
  },

  ST: async function ({ message, event, api, args, sock, config, prefix }) {
    // Your command logic here
    await message.reply("Hello from your command!");
  },

  // Optional: Handle replies to this command's messages
  onReply: async function ({ message, event, Reply }) {
    // Handle reply logic
  },

  // Optional: Handle messages without prefix
  onChat: async function ({ event, message, api, sock, config }) {
    // Return false to stop processing other handlers
    // Return true to continue
    return true;
  }
};
```

### Using message.unsend()

```javascript
// Send a message
const sentMsg = await message.reply("Processing...");

// Do some work
await someAsyncOperation();

// Unsend the processing message
if (sentMsg && sentMsg.key) {
  await message.unsend(sentMsg.key);
}

// Send final result
await message.reply("Done!");
```

## 🎯 Creating Events

Create a new file in `scripts/events/yourevent.js`:

```javascript
module.exports = {
  config: {
    name: "yourevent",
    version: "1.0.0",
    author: "Your Name",
    category: "events",
    listenType: "both"  // "group", "dm", or "both"
  },

  ST: async function ({ event, message, api, sock }) {
    // Event logic here
  },

  onChat: async function ({ event, message }) {
    // Triggered on every message
  }
};
```

## 🌐 API Usage

The bot includes a built-in API client:

```javascript
const stapi = new global.utils.STBotApis();

// Chat with AI
const response = await axios.post(`${stapi.baseURL}/beb/chat`, {
  message: "Hello",
  userId: "user_123",
  senderId: "123"
});

// Download videos
const dlResponse = await axios.post(
  `${stapi.baseURL}/api/download/auto`,
  { url: videoUrl },
  { headers: stapi.getHeaders(true) }
);
```

## 💾 Database

The bot supports JSON and MongoDB databases. User and group data is automatically tracked:

```javascript
const db = global.ST.db;

// Get DM user
const user = await db.getDmUser(userId);

// Get group thread
const thread = await db.getThread(threadId);

// Get group member
const member = await db.getMember(threadId, userId);
```

## 📞 Support & Community

### Issues & Bug Reports
- **GitHub Issues**: [Report bugs](https://github.com/sheikhtamimlover/ST_WhatsappBot/issues)
- **Pull Requests**: Contributions welcome!

### Community Support
- **WhatsApp Group**: [Join Community](https://chat.whatsapp.com/HLsFKY3s5BLJn0etpU1VIV)
- **Developer**: Sheikh Tamim
- **Instagram**: [@sheikh.tamim_lover](https://instagram.com/sheikh.tamim_lover)

### Getting Help
1. Check existing issues on GitHub
2. Join the WhatsApp community group
3. Contact the developer on Instagram
4. Create a new GitHub issue with detailed information

## 🔧 Technical Details

### Repository Information
- **GitHub**: https://github.com/sheikhtamimlover/ST_WhatsappBot.git
- **Version**: 2.4.71
- **License**: ISC
- **Language**: JavaScript (Node.js)
- **Framework**: Baileys (WhatsApp Web API)

### Key Dependencies
- `@whiskeysockets/baileys` - WhatsApp Web API
- `axios` - HTTP client
- `fs-extra` - File system utilities
- `express` - Web dashboard
- `socket.io` - Real-time updates
- `mongodb` - Database (optional)

### Performance
- **Startup Time**: ~3-5 seconds
- **Message Processing**: <100ms average
- **Auto-download**: 2-10 seconds (depends on video size)
- **Memory Usage**: ~150-300MB
- **CPU Usage**: Low (1-5% idle)

### Features in Development
- 🔄 Multi-device support
- 🎵 Spotify integration
- 🖼️ AI image generation
- 📊 Advanced analytics
- 🔐 End-to-end encryption for database

## 🎨 Dashboard

Access the web dashboard at `http://0.0.0.0:5000` (or your configured port)

Features:
- Real-time bot status
- Command statistics
- User management
- Group management
- Configuration editor

Default credentials:
- **Password**: admin123 (change in config.json)

## 🔄 Auto-restart

The bot automatically restarts on crashes. Use `index.js` to enable this:

```bash
node index.js
```

To manually restart:
```bash
!restart
```

## 📊 Statistics

Check bot statistics with `!stats`:
- Uptime
- Total messages processed
- Total users
- Total groups
- Memory usage
- Command usage

## 🎓 Examples

### Example 1: Auto-download
Just send a TikTok/Facebook/Instagram URL in chat - the bot will automatically download it!

### Example 2: AI Chat
```
User: beb hello
Bot: Hi! How can I help you today? 😊

User: beb teach what is your name | I am Beb Bot | 🤖
Bot: ✅ Teaching successful!
```

### Example 3: Unsend Messages
```
User: !ping
Bot: 🏓 Pong! 45ms

User: !r (reply to bot message)
Bot: ✅ (message deleted)
```

## 🌟 Author

**Sheikh Tamim**
- GitHub: [@sheikhtamimlover](https://github.com/sheikhtamimlover)
- Instagram: [@sheikh.tamim_lover](https://instagram.com/sheikh.tamim_lover)

## 📄 License

ISC License - Free to use and modify!

---

Made with ♥️ by Sheikh Tamim
