const JsonDatabase = require('./jsondb');
const MongoDatabase = require('./mongodb');
const log = require('../logger/logs');
const color = require('../logger/color');

let db = null;

async function initMongoDB(config) {
  const log = require('../logger/logs');
  const color = require('../logger/color');
  
  log.info(`${color.cyan('Initializing MongoDB...')}`);
  const mongodb = new MongoDatabase(
    config.database.mongodb.url,
    config.database.mongodb.name || 'stwbot'
  );
  const connected = await mongodb.connect();
  if (connected) {
    db = mongodb;
    log.success(`${color.green('✅ MongoDB initialized successfully!')}`);
    return mongodb;
  } else {
    log.warn(`${color.yellow('⚠️  MongoDB failed, falling back to JSON database')}`);
    return initJsonDB();
  }
}

function initJsonDB() {
  db = new JsonDatabase();
  return db;
}

async function initDatabase(config) {
  try {
    const dbType = (config && config.database && config.database.type) || 'json';

    if (dbType === 'mongodb' && config.database.mongodb && config.database.mongodb.url) {
      return await initMongoDB(config);
    } else {
      return initJsonDB();
    }
  } catch (error) {
    console.error('Database initialization error:', error.message);
    console.log('Falling back to JSON database...');
    return initJsonDB();
  }
}

function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase first.');
  }
  return db;
}

module.exports = {
  initDatabase,
  getDatabase
};