
const axios = require('axios');
const log = require('../logger/logs');

// Clear any existing timeout
if (global.timeOutUptime != undefined) {
	clearTimeout(global.timeOutUptime);
}

// Check if auto-uptime is disabled - exit early
if (!global.ST.config.autoUptime || !global.ST.config.autoUptime.enable) {
	return;
}

const PORT = global.ST.config.serverUptime?.port || 5000;

let myUrl = global.ST.config.autoUptime.url;

if (!myUrl) {
	if (process.env.REPL_ID) {
		myUrl = `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`;
	} else if (process.env.PROJECT_DOMAIN) {
		myUrl = `https://${process.env.PROJECT_DOMAIN}.glitch.me`;
	} else if (process.env.RENDER_EXTERNAL_URL) {
		myUrl = process.env.RENDER_EXTERNAL_URL;
	} else if (process.env.RAILWAY_PUBLIC_DOMAIN) {
		myUrl = `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
	} else {
		myUrl = `http://localhost:${PORT}`;
	}
}

myUrl.includes('localhost') && (myUrl = myUrl.replace('https', 'http'));
myUrl += '/uptime';

let status = 'ok';
let consecutiveFailures = 0;

setTimeout(async function autoUptime() {
	try {
		const response = await axios.get(myUrl);

		if (status != 'ok') {
			status = 'ok';
			consecutiveFailures = 0;
			log.success('Auto-uptime: Bot is back online');
		}
	} catch (e) {
		consecutiveFailures++;
		const err = e.response?.data || e;

		if (status === 'ok') {
			status = 'failed';
			log.error(`Auto-uptime: Connection failed (${consecutiveFailures} failures)`);
		}

		if (consecutiveFailures >= 3) {
			log.error('Auto-uptime: Multiple consecutive failures detected');
		}
	}

	global.timeOutUptime = setTimeout(autoUptime, (global.ST.config.autoUptime.timeInterval || 180) * 1000);
}, (global.ST.config.autoUptime.timeInterval || 180) * 1000);

log.success(`Auto-uptime enabled: ${myUrl}`);
