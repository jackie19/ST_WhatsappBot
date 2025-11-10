
const express = require('express');
const path = require('path');

const app = express();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory session store (simple implementation)
const sessions = new Map();

// Generate simple session token
function generateToken() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// Verify token middleware
function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    const token = authHeader.substring(7);
    if (!sessions.has(token)) {
        return res.status(401).json({ success: false, message: 'Invalid session' });
    }
    
    next();
}

// Login endpoint
app.post('/api/login', (req, res) => {
    const { password } = req.body;
    const config = global.ST?.config || {};
    
    if (!config.dashboard || !config.dashboard.enabled) {
        return res.status(503).json({ success: false, message: 'Dashboard is disabled' });
    }
    
    if (config.dashboard.adminPassword && password === config.dashboard.adminPassword) {
        const token = generateToken();
        sessions.set(token, { createdAt: Date.now() });
        
        // Clean up old sessions (older than 24 hours)
        const now = Date.now();
        for (const [key, value] of sessions.entries()) {
            if (now - value.createdAt > 24 * 60 * 60 * 1000) {
                sessions.delete(key);
            }
        }
        
        return res.json({ success: true, token });
    }
    
    res.status(401).json({ success: false, message: 'Invalid password' });
});

// Stats endpoint
app.get('/api/stats', verifyToken, async (req, res) => {
    try {
        const config = global.ST?.config || {};
        const sock = global.ST?.sock;
        const db = global.ST?.db;
        const commands = global.ST?.commands;
        
        // Calculate uptime
        const uptime = process.uptime();
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);
        const uptimeStr = `${hours}h ${minutes}m ${seconds}s`;
        
        // Get database stats
        let dmUsers = 0;
        let totalGroups = 0;
        let groupUsers = 0;
        
        if (db) {
            try {
                const allDmUsers = await db.getAllDmUsers ? await db.getAllDmUsers() : {};
                const allThreads = await db.getAllThreads();
                
                dmUsers = Object.keys(allDmUsers).length;
                totalGroups = Object.keys(allThreads).length;
                
                for (const thread of Object.values(allThreads)) {
                    if (thread.members) {
                        groupUsers += Object.keys(thread.members).length;
                    }
                }
            } catch (err) {
                console.error('Error fetching DB stats:', err);
            }
        }
        
        // Get bot number
        let botNumber = 'Not connected';
        if (sock && sock.user) {
            botNumber = sock.user.id.split(':')[0];
        }
        
        // Get memory usage
        const memUsage = process.memoryUsage();
        const memoryUsage = `${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`;
        
        // Get CPU usage (simple approximation)
        const cpuUsage = `${process.cpuUsage().user / 1000000}ms`;
        
        res.json({
            success: true,
            botConnected: !!(sock && sock.user),
            botNumber,
            uptime: uptimeStr,
            prefix: config.prefix || '!',
            dmUsers,
            totalGroups,
            groupUsers,
            totalCommands: commands ? commands.size : 0,
            dbType: config.database?.type || 'json',
            dbConnected: !!db,
            cpuUsage,
            memoryUsage,
            nodeVersion: process.version,
            platform: process.platform
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Restart endpoint
app.post('/api/restart', verifyToken, async (req, res) => {
    try {
        const fs = require('fs-extra');
        const cachePath = path.join(__dirname, '../cache');
        
        await fs.ensureDir(cachePath);
        
        const restartFile = path.join(cachePath, 'restart.txt');
        await fs.writeJson(restartFile, {
            jid: 'dashboard',
            timestamp: Date.now()
        });
        
        res.json({ success: true, message: 'Bot is restarting...' });
        
        setTimeout(() => {
            process.exit(2);
        }, 1000);
        
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// WhatsApp session status endpoint
app.get('/api/session/status', (req, res) => {
    try {
        const fs = require('fs-extra');
        const sessionPath = path.join(__dirname, '../session');
        const credsPath = path.join(sessionPath, 'creds.json');
        
        const sessionExists = fs.existsSync(credsPath);
        const sock = global.ST?.sock;
        const isConnected = !!(sock && sock.user);
        
        res.json({
            success: true,
            sessionExists,
            isConnected,
            requiresAuth: !sessionExists || !isConnected
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Initialize WhatsApp authentication
app.post('/api/session/init', verifyToken, async (req, res) => {
    try {
        const { method, phoneNumber } = req.body;
        
        if (!method || (method !== 'qr' && method !== 'pairing')) {
            return res.status(400).json({ success: false, message: 'Invalid method. Use "qr" or "pairing"' });
        }
        
        if (method === 'pairing' && (!phoneNumber || phoneNumber.length < 10)) {
            return res.status(400).json({ success: false, message: 'Phone number required for pairing method' });
        }
        
        global.ST.authMethod = method;
        global.ST.authPhoneNumber = phoneNumber;
        global.ST.authInProgress = true;
        global.ST.qrCode = null;
        global.ST.pairingCode = null;
        
        res.json({ success: true, message: 'Authentication initialized' });
        
        setTimeout(() => {
            process.exit(2);
        }, 1000);
        
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get current QR code or pairing code
app.get('/api/session/auth-data', verifyToken, (req, res) => {
    try {
        res.json({
            success: true,
            authInProgress: global.ST?.authInProgress || false,
            method: global.ST?.authMethod || null,
            qrCode: global.ST?.qrCode || null,
            pairingCode: global.ST?.pairingCode || null
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete WhatsApp session
app.post('/api/session/delete', verifyToken, async (req, res) => {
    try {
        const fs = require('fs-extra');
        const sessionPath = path.join(__dirname, '../session');
        
        if (fs.existsSync(sessionPath)) {
            await fs.remove(sessionPath);
        }
        
        res.json({ success: true, message: 'Session deleted successfully' });
        
        setTimeout(() => {
            process.exit(2);
        }, 1000);
        
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Home route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

module.exports = app;
