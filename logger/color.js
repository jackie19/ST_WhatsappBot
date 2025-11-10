
const chalk = require('chalk');

module.exports = {
  // Basic ANSI colors (fallback)
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  underscore: "\x1b[4m",
  
  // Chalk-based colors (all as functions with string fallback)
  black: (text) => typeof text === 'string' ? chalk.black(text) : chalk.black(String(text)),
  red: (text) => typeof text === 'string' ? chalk.red(text) : chalk.red(String(text)),
  green: (text) => typeof text === 'string' ? chalk.green(text) : chalk.green(String(text)),
  yellow: (text) => typeof text === 'string' ? chalk.yellow(text) : chalk.yellow(String(text)),
  blue: (text) => typeof text === 'string' ? chalk.blue(text) : chalk.blue(String(text)),
  magenta: (text) => typeof text === 'string' ? chalk.magenta(text) : chalk.magenta(String(text)),
  cyan: (text) => typeof text === 'string' ? chalk.cyan(text) : chalk.cyan(String(text)),
  white: (text) => typeof text === 'string' ? chalk.white(text) : chalk.white(String(text)),
  gray: (text) => typeof text === 'string' ? chalk.gray(text) : chalk.gray(String(text)),
  
  // Bright colors
  brightRed: (text) => chalk.redBright(text),
  brightGreen: (text) => chalk.greenBright(text),
  brightYellow: (text) => chalk.yellowBright(text),
  brightBlue: (text) => chalk.blueBright(text),
  brightMagenta: (text) => chalk.magentaBright(text),
  brightCyan: (text) => chalk.cyanBright(text),
  
  // Background colors
  bgBlack: (text) => chalk.bgBlack(text),
  bgRed: (text) => chalk.bgRed(text),
  bgGreen: (text) => chalk.bgGreen(text),
  bgYellow: (text) => chalk.bgYellow(text),
  bgBlue: (text) => chalk.bgBlue(text),
  bgMagenta: (text) => chalk.bgMagenta(text),
  bgCyan: (text) => chalk.bgCyan(text),
  bgWhite: (text) => chalk.bgWhite(text),
  
  // Gradients and special styling
  rainbow: (text) => chalk.bold(text),
  success: (text) => chalk.bold(chalk.greenBright(text)),
  error: (text) => chalk.bold(chalk.redBright(text)),
  warning: (text) => chalk.bold(chalk.yellowBright(text)),
  info: (text) => chalk.bold(chalk.cyanBright(text)),
  
  // Special effects
  inverse: (text) => chalk.inverse(text),
  strikethrough: (text) => chalk.strikethrough(text),
  italic: (text) => chalk.italic(text)
};
