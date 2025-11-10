
const { Server } = require("socket.io");

module.exports = async (server) => {
	const log = require('../../logger/logs');
	const { channelName, verifyToken } = global.ST.config.serverUptime.socket;
	let io;

	try {
		if (!channelName) {
			throw new Error('"channelName" is not defined in config');
		}
		if (!verifyToken) {
			throw new Error('"verifyToken" is not defined in config');
		}

		io = new Server(server, {
			cors: {
				origin: "*",
				methods: ["GET", "POST"]
			}
		});

		log.info('Socket.IO server initialized');
	} catch (err) {
		log.error('Socket.IO error:', err.message);
		throw err;
	}

	io.on("connection", (socket) => {
		if (socket.handshake.query.verifyToken != verifyToken) {
			io.to(socket.id).emit(channelName, {
				status: "error",
				message: "Token is invalid"
			});
			socket.disconnect();
			return;
		}

		log.success(`Client connected: ${socket.id}`);

		io.to(socket.id).emit(channelName, {
			status: "success",
			message: "Connected to server successfully",
			botName: global.ST.config.botName,
			platform: process.env.REPL_SLUG ? 'Replit' : 'Local'
		});

		socket.on("disconnect", () => {
			log.info(`Client disconnected: ${socket.id}`);
		});
	});

	// Send periodic uptime updates
	setInterval(() => {
		io.emit(channelName, {
			status: "uptime",
			data: {
				uptime: process.uptime(),
				commands: global.ST.commands.size,
				events: global.ST.events.size,
				timestamp: Date.now()
			}
		});
	}, 30000); // Every 30 seconds

	return io;
};
