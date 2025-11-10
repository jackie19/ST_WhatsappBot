# ST_WhatsappBot

## Overview

ST_WhatsappBot is a feature-rich WhatsApp bot built on the Baileys library that enables automated messaging, command handling, and event-driven interactions. The bot supports both QR code and pairing code authentication, provides extensible command and event systems, and includes advanced media handling capabilities with automatic attachment detection and URL streaming.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### November 10, 2025 (Latest)
- **Enhanced Dashboard with WhatsApp Authentication**: Added complete web-based authentication system to dashboard allowing users to connect WhatsApp via QR code or pairing method through browser interface
- **Dashboard API Endpoints**: Added `/api/session/status`, `/api/session/init`, `/api/session/auth-data`, and `/api/session/delete` endpoints for managing WhatsApp authentication
- **Baileys Integration**: Modified `bot/login/login.js` to support dashboard-driven authentication by checking `global.ST.authMethod` and exposing QR codes/pairing codes via global state
- **Authentication Modal UI**: Created interactive modal in dashboard with method selection (QR/Pairing), real-time code display, and session management
- **Workflow Configuration**: Updated workflow to use webview output on port 5000 for seamless web hosting experience
- **Security Enhancement**: Added `session/` and `cache/` directories to .gitignore to prevent sensitive credentials from being committed

### November 09, 2025
- **Enhanced autodl.js URL detection**: Updated regex pattern to capture full URL paths including forward slashes `[\w\/\.\-\?=&%]*` - now properly detects YouTube shorts, TikTok, Instagram, and Facebook URLs with complete paths
- **Fixed autodl.js handler conflicts**: Added explicit `return false` statements on all execution paths to prevent other onChat handlers from processing already-handled URLs
- **Created song.js command**: Converted sa.js from root directory to scripts/cmds/song.js using proper ST bot structure with ST function, STBotApis integration, yt-search for YouTube queries, and cache directory management
- **Hardened pair.js canvas error handling**: Added axios-based profile picture fetching with content-type validation, 5-second timeouts, stream error handlers for both canvas PNG stream and file write stream to prevent "xml-not-well-formed" crashes
- **Created members.js command**: New group command that displays all members (up to 25) with avatars on canvas grid, shows admin crowns, group metadata, and includes robust error handling with default avatar fallbacks
- **Fixed onChat handler logic**: Moved onChat handlers outside the else block in handlerEvents.js so they run for ALL non-command messages (enabling autodl and similar features to work properly)
- **Migrated si.js command**: Moved from root directory to scripts/cmds/, converted from old API structure to proper ST bot structure with ST function and STBotApis

## System Architecture

### Authentication & Session Management

**WhatsApp Connection**: The bot uses Baileys library (@whiskeysockets/baileys) for WhatsApp Web protocol implementation. It supports two authentication methods:
- QR Code scanning for quick setup
- Pairing code authentication using phone numbers

**Session Persistence**: Authentication credentials and session data are stored in the `session/` directory as JSON files, including:
- `creds.json` - Core authentication credentials
- Pre-key files for encrypted communication
- Device mappings and app state sync files

This approach allows automatic reconnection without re-authentication after restarts.

### Application Entry Points

**Process Management**: The application uses a two-tier startup system:
- `index.js` - Process supervisor that spawns and monitors the main bot process, automatically restarting on crashes (exit code 2)
- `ST.js` - Main application entry point that initializes the bot, loads configurations, and establishes WhatsApp connection

This architecture ensures high availability and automatic recovery from failures.

### Command & Event System

**Extensible Command Framework**: Commands are loaded dynamically from `scripts/cmds/` directory. Each command is a module that exports:
- Command configuration (name, aliases, description)
- Handler function for execution
- Optional permission requirements

**Event-Driven Architecture**: Events are loaded from `scripts/events/` directory and react to:
- Group membership changes (joins/leaves)
- Message events
- Connection status changes

Both systems use a hot-reload mechanism through `bot/login/autoload.js` for development convenience.

### Message Processing Pipeline

**Central Handler**: `bot/handler/handlerEvents.js` processes all incoming messages through a sequential pipeline:
1. Message type detection (text, image, video, audio, document)
2. Prefix validation for command messages
3. Command parsing and execution
4. Reply/reaction tracking for interactive conversations

**Attachment Detection**: The bot automatically identifies and handles various media types using metadata from WhatsApp messages.

### Data Storage Strategy

**Flexible Database System**: The bot implements a pluggable database architecture supporting two backends:

1. **JSON Database** (default): File-based storage in `database/data/` for:
   - User profiles and statistics
   - Thread/group configurations
   - Simple key-value data

2. **MongoDB** (optional): Scalable database option configured via connection string in `config.json`

The abstraction layer (`database/index.js`) allows seamless switching between storage backends without code changes.

### Configuration Management

**Centralized Config**: `config.json` controls bot behavior including:
- Command prefix and admin identification
- Feature toggles (prefix usage, admin-only mode)
- Database selection
- Phone number for pairing authentication
- Timezone settings

The configuration is loaded at startup and made globally available through the `global.ST` object.

### Global State Management

**Singleton Pattern**: The `global.ST` object maintains application-wide state:
- `commands` - Map of loaded command handlers
- `events` - Array of registered event listeners
- `config` - Runtime configuration
- `db` - Database instance
- `onReply` / `onReaction` - Maps for tracking conversation context
- `botMessageIds` - LRU cache for message tracking (max 1000 entries with 24-hour expiration)

### Utility Systems

**Message Utilities**: `utils.js` provides helper functions for:
- Downloading media from URLs via axios
- Building message payloads
- Managing message tracking for unsend detection
- Memory-efficient cleanup of old message references
- User mention extraction (`getUserByMention()`) - Extracts user IDs from @mentions in messages
- Group mention enrichment (`getGroupMentions()`) - Adds role/admin information to mentions

**Bot Message Tracking**: Advanced message ID tracking system for unsend functionality:
- Tracks all bot-sent messages in `global.ST.botMessageIds` (Map structure)
- LRU-based eviction when limit exceeds 1000 messages
- Time-based cleanup for messages older than 24 hours
- Automatic removal of message IDs after successful unsend
- Supports both group chats and direct messages

**Logging Infrastructure**: Custom logging system (`logger/logs.js`) with:
- Colored console output using chalk
- Multiple log levels (info, success, warn, error, debug)
- Animated spinners for long operations
- Boxed output for visual hierarchy

### Media Handling

**URL Streaming**: The bot can download and forward media from external URLs, converting them to appropriate WhatsApp message formats.

**Attachment Processing**: Automatic detection of attachment types enables context-aware command handling based on media presence.

## External Dependencies

### Core Libraries

- **@whiskeysockets/baileys** (v7.0.0-rc.6) - WhatsApp Web API client library for WebSocket communication and protocol handling
- **axios** (v1.12.2) - HTTP client for downloading media from URLs and external API calls
- **fs-extra** (v11.3.2) - Enhanced file system operations with promise support

### User Interface & Display

- **boxen** (v8.0.1) - Terminal box rendering for formatted output
- **chalk** (v4.1.2) - Terminal string styling and color formatting
- **gradient-string** (v3.0.0) - Gradient text effects for banners
- **figlet** (v1.9.3) - ASCII art text generation
- **ora** (v9.0.0) - Terminal loading spinners
- **cli-spinners** (v3.3.0) - Collection of spinner animations

### Database Options

- **mongodb** (v6.20.0) - Official MongoDB driver for NoSQL data persistence (optional)
- JSON file storage (built-in, no external dependency)

### Utilities

- **pino** (v10.1.0) - Fast JSON logger for structured logging
- **qrcode-terminal** (v0.12.0) - QR code generation in terminal for authentication
- **readline** (v1.3.0) - Command-line input handling
- **@hapi/boom** (v10.0.1) - HTTP error objects for error handling

### Development

- **@types/node** (v22.13.11) - TypeScript type definitions for Node.js APIs