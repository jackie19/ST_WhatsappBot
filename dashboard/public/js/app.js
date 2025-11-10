
let sessionToken = localStorage.getItem('dashboardToken');

// Check if already logged in
if (sessionToken) {
    checkSession();
}

// Login form handler
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('loginError');
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            sessionToken = data.token;
            localStorage.setItem('dashboardToken', data.token);
            showDashboard();
            loadStats();
        } else {
            errorDiv.textContent = data.message || 'Invalid password';
        }
    } catch (error) {
        errorDiv.textContent = 'Connection error. Please try again.';
    }
});

// Logout handler
document.getElementById('logoutBtn')?.addEventListener('click', () => {
    localStorage.removeItem('dashboardToken');
    sessionToken = null;
    showLogin();
});

// Restart bot handler
document.getElementById('restartBtn')?.addEventListener('click', async () => {
    if (!confirm('Are you sure you want to restart the bot?')) return;
    
    try {
        const response = await fetch('/api/restart', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${sessionToken}`
            }
        });
        
        const data = await response.json();
        alert(data.message || 'Bot is restarting...');
        
        setTimeout(() => {
            loadStats();
        }, 5000);
    } catch (error) {
        alert('Error restarting bot: ' + error.message);
    }
});

// Refresh stats handler
document.getElementById('refreshStatsBtn')?.addEventListener('click', () => {
    loadStats();
});

// Check session validity
async function checkSession() {
    try {
        const response = await fetch('/api/stats', {
            headers: {
                'Authorization': `Bearer ${sessionToken}`
            }
        });
        
        if (response.ok) {
            showDashboard();
            loadStats();
        } else {
            showLogin();
        }
    } catch (error) {
        showLogin();
    }
}

// Show login screen
function showLogin() {
    document.getElementById('loginContainer').style.display = 'block';
    document.getElementById('dashboardContainer').style.display = 'none';
}

// Show dashboard
function showDashboard() {
    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('dashboardContainer').style.display = 'block';
}

// Load dashboard statistics
async function loadStats() {
    try {
        const response = await fetch('/api/stats', {
            headers: {
                'Authorization': `Bearer ${sessionToken}`
            }
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                showLogin();
                return;
            }
            throw new Error('Failed to load stats');
        }
        
        const data = await response.json();
        
        // Update bot status
        const statusBadge = document.getElementById('botStatus');
        const statusText = document.getElementById('botStatusText');
        
        if (data.botConnected) {
            statusBadge.textContent = 'Connected';
            statusBadge.className = 'status-badge connected';
            statusText.textContent = '✅ Connected';
        } else {
            statusBadge.textContent = 'Disconnected';
            statusBadge.className = 'status-badge disconnected';
            statusText.textContent = '❌ Disconnected';
        }
        
        // Update bot info
        document.getElementById('botNumber').textContent = data.botNumber || 'Not connected';
        document.getElementById('uptime').textContent = data.uptime || '-';
        document.getElementById('prefix').textContent = data.prefix || '!';
        
        // Update user stats
        document.getElementById('dmUsers').textContent = data.dmUsers || 0;
        document.getElementById('totalGroups').textContent = data.totalGroups || 0;
        document.getElementById('groupUsers').textContent = data.groupUsers || 0;
        document.getElementById('totalCmds').textContent = data.totalCommands || 0;
        
        // Update database info
        document.getElementById('dbType').textContent = data.dbType || 'json';
        document.getElementById('dbStatus').textContent = data.dbConnected ? '✅ Connected' : '❌ Disconnected';
        
        // Update system info
        document.getElementById('cpuUsage').textContent = data.cpuUsage || '-';
        document.getElementById('memoryUsage').textContent = data.memoryUsage || '-';
        document.getElementById('nodeVersion').textContent = data.nodeVersion || '-';
        document.getElementById('platform').textContent = data.platform || '-';
        
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// WhatsApp auth management
document.getElementById('manageAuthBtn')?.addEventListener('click', () => {
    showAuthModal();
});

document.getElementById('closeAuthModal')?.addEventListener('click', () => {
    hideAuthModal();
});

document.getElementById('closeAuthSuccessBtn')?.addEventListener('click', () => {
    hideAuthModal();
    loadStats();
});

document.querySelector('.auth-method-btn[data-method="qr"]')?.addEventListener('click', () => {
    selectAuthMethod('qr');
});

document.querySelector('.auth-method-btn[data-method="pairing"]')?.addEventListener('click', () => {
    selectAuthMethod('pairing');
});

document.getElementById('startPairingBtn')?.addEventListener('click', () => {
    const phoneNumber = document.getElementById('phoneNumberInput').value;
    initAuth('pairing', phoneNumber);
});

document.getElementById('backToMethodsBtn')?.addEventListener('click', () => {
    showAuthStep(1);
});

document.getElementById('deleteSessionBtn')?.addEventListener('click', async () => {
    if (!confirm('Are you sure you want to delete the WhatsApp session? The bot will disconnect.')) return;
    
    try {
        const response = await fetch('/api/session/delete', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${sessionToken}`
            }
        });
        
        const data = await response.json();
        alert(data.message || 'Session deleted. Bot is restarting...');
        hideAuthModal();
    } catch (error) {
        alert('Error deleting session: ' + error.message);
    }
});

function showAuthModal() {
    document.getElementById('authModal').style.display = 'flex';
    showAuthStep(1);
}

function hideAuthModal() {
    document.getElementById('authModal').style.display = 'none';
}

function showAuthStep(step) {
    document.getElementById('authStep1').style.display = step === 1 ? 'block' : 'none';
    document.getElementById('authStep2').style.display = step === 2 ? 'block' : 'none';
    document.getElementById('authStep3').style.display = step === 3 ? 'block' : 'none';
}

function selectAuthMethod(method) {
    showAuthStep(2);
    
    if (method === 'qr') {
        document.getElementById('pairingPhoneInput').style.display = 'none';
        document.getElementById('qrCodeDisplay').style.display = 'block';
        document.getElementById('pairingCodeDisplay').style.display = 'none';
        initAuth('qr');
    } else {
        document.getElementById('pairingPhoneInput').style.display = 'block';
        document.getElementById('qrCodeDisplay').style.display = 'none';
        document.getElementById('pairingCodeDisplay').style.display = 'none';
    }
}

async function initAuth(method, phoneNumber = null) {
    try {
        const response = await fetch('/api/session/init', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionToken}`
            },
            body: JSON.stringify({ method, phoneNumber })
        });
        
        const data = await response.json();
        
        if (data.success) {
            if (method === 'pairing') {
                document.getElementById('pairingPhoneInput').style.display = 'none';
                document.getElementById('pairingCodeDisplay').style.display = 'block';
                pollAuthData();
            } else {
                pollAuthData();
            }
        } else {
            alert(data.message || 'Failed to initialize authentication');
        }
    } catch (error) {
        alert('Error initializing authentication: ' + error.message);
    }
}

async function pollAuthData() {
    const pollInterval = setInterval(async () => {
        try {
            const response = await fetch('/api/session/auth-data', {
                headers: {
                    'Authorization': `Bearer ${sessionToken}`
                }
            });
            
            if (!response.ok) {
                clearInterval(pollInterval);
                return;
            }
            
            const data = await response.json();
            
            if (data.qrCode) {
                const qrContainer = document.getElementById('qrCodeContainer');
                qrContainer.innerHTML = `<pre>${data.qrCode}</pre>`;
            }
            
            if (data.pairingCode) {
                const pairingContainer = document.getElementById('pairingCodeContainer');
                pairingContainer.innerHTML = `<div class="pairing-code">${data.pairingCode}</div>`;
            }
            
            if (!data.authInProgress) {
                clearInterval(pollInterval);
                
                const statusResponse = await fetch('/api/session/status');
                const statusData = await statusResponse.json();
                
                if (statusData.isConnected) {
                    showAuthStep(3);
                }
            }
        } catch (error) {
            console.error('Error polling auth data:', error);
        }
    }, 2000);
    
    setTimeout(() => {
        clearInterval(pollInterval);
    }, 120000);
}

// Auto-refresh stats every 10 seconds
setInterval(() => {
    if (sessionToken && document.getElementById('dashboardContainer').style.display !== 'none') {
        loadStats();
    }
}, 10000);
