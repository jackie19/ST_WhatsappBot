
const chalk = require('chalk');
const ora = require('ora').default;
const boxen = require('boxen').default;
const gradientString = require('gradient-string').default;

const icons = {
  success: '✓',
  error: '✗',
  warning: '⚠',
  info: 'ℹ',
  debug: '⚙',
  loading: '⏳',
  rocket: '🚀',
  fire: '🔥',
  star: '⭐',
  check: '✅',
  cross: '❌',
  arrow: '➜',
  bullet: '•'
};

const levels = {
  info: { prefix: 'INFO', color: (text) => chalk.cyan(text), icon: icons.info },
  success: { prefix: 'SUCCESS', color: (text) => chalk.green(text), icon: icons.success },
  warn: { prefix: 'WARN', color: (text) => chalk.yellow(text), icon: icons.warning },
  error: { prefix: 'ERROR', color: (text) => chalk.red(text), icon: icons.error },
  debug: { prefix: 'DEBUG', color: (text) => chalk.magenta(text), icon: icons.debug }
};

function getTimestamp() {
  return new Date().toLocaleTimeString('en-US', { hour12: false });
}

function log(level, ...messages) {
  const timestamp = getTimestamp();
  const levelInfo = levels[level] || levels.info;
  const formattedMessages = messages.map(msg => 
    typeof msg === 'object' ? JSON.stringify(msg, null, 2) : msg
  ).join(' ');
  
  console.log(
    chalk.grey(`[${timestamp}]`),
    levelInfo.color(`${levelInfo.icon} [${levelInfo.prefix}]`),
    formattedMessages
  );
}

function createSpinner(text, color = 'cyan') {
  return ora({
    text,
    color,
    spinner: 'dots'
  });
}

function box(text, options = {}) {
  return boxen(text, {
    padding: 1,
    margin: 1,
    borderStyle: 'round',
    borderColor: options.color || 'cyan',
    ...options
  });
}

function gradient(text, colors = ['cyan', 'magenta']) {
  return gradientString(colors)(text);
}

module.exports = {
  info: (...msg) => log('info', ...msg),
  success: (...msg) => log('success', ...msg),
  warn: (...msg) => log('warn', ...msg),
  error: (...msg) => log('error', ...msg),
  debug: (...msg) => log('debug', ...msg),
  createSpinner,
  box,
  gradient,
  icons,
  chalk
};
