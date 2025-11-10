const fs = require('fs-extra');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'session', 'database.json');

class Database {
  constructor() {
    this.data = {};
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(dbPath)) {
        this.data = fs.readJsonSync(dbPath);
      } else {
        this.save();
      }
    } catch (error) {
      console.error('Database load error:', error);
      this.data = {};
    }
  }

  save() {
    try {
      fs.ensureDirSync(path.dirname(dbPath));
      fs.writeJsonSync(dbPath, this.data, { spaces: 2 });
    } catch (error) {
      console.error('Database save error:', error);
    }
  }

  get(key) {
    return this.data[key];
  }

  set(key, value) {
    this.data[key] = value;
    this.save();
  }

  delete(key) {
    delete this.data[key];
    this.save();
  }

  has(key) {
    return key in this.data;
  }

  all() {
    return this.data;
  }
}

module.exports = new Database();
