const { MongoClient } = require('mongodb');

class MongoDatabase {
  constructor(url, dbName) {
    this.url = url;
    this.dbName = dbName;
    this.client = null;
    this.db = null;
    this.connected = false;
  }

  async connect() {
    try {
      this.client = new MongoClient(this.url);
      await this.client.connect();
      this.db = this.client.db(this.dbName);
      this.connected = true;
      console.log('✅ Connected to MongoDB successfully!');
      return true;
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error.message);
      this.connected = false;
      return false;
    }
  }

  async getUser(uid) {
    try {
      if (!this.connected) return null;
      const collection = this.db.collection('users');
      return await collection.findOne({ uid: uid });
    } catch {
      return null;
    }
  }

  async setUser(uid, data) {
    try {
      if (!this.connected) throw new Error('Database not connected');
      const collection = this.db.collection('users');
      const userData = {
        uid: uid,
        name: data.name || '',
        pfp: data.pfp || '',
        gender: data.gender || '',
        money: data.money || 0,
        exp: data.exp || 0,
        ban: data.ban || false,
        banReason: data.banReason || '',
        warning: data.warning || 0,
        totalMsg: data.totalMsg || 0,
        createdAt: data.createdAt || Date.now(),
        updatedAt: Date.now(),
        ...data
      };
      await collection.updateOne(
        { uid: uid },
        { $set: userData },
        { upsert: true }
      );
      return userData;
    } catch (error) {
      throw error;
    }
  }

  async updateUser(uid, updateData) {
    try {
      if (!this.connected) throw new Error('Database not connected');
      const collection = this.db.collection('users');

      let user = await collection.findOne({ uid: uid });
      if (!user) {
        user = {
          uid: uid,
          name: '',
          pfp: '',
          gender: '',
          money: 0,
          exp: 0,
          ban: false,
          banReason: '',
          warning: 0,
          totalMsg: 0
        };
      }

      const updatedUser = { ...user, ...updateData, updatedAt: Date.now() };
      await collection.updateOne(
        { uid: uid },
        { $set: updatedUser },
        { upsert: true }
      );
      return updatedUser;
    } catch (error) {
      throw error;
    }
  }

  async getAllUsers() {
    try {
      if (!this.connected) return {};
      const collection = this.db.collection('users');
      const users = await collection.find({}).toArray();
      const usersObj = {};
      users.forEach(user => {
        usersObj[user.uid] = user;
      });
      return usersObj;
    } catch {
      return {};
    }
  }

  async getThread(tid) {
    try {
      if (!this.connected) return null;
      const collection = this.db.collection('threads');
      return await collection.findOne({ tid: tid });
    } catch (error) {
      console.error('Error getting thread:', error);
      return null;
    }
  }

  async setThread(tid, data) {
    try {
      if (!this.connected) throw new Error('Database not connected');
      const collection = this.db.collection('threads');
      const threadData = {
        tid: tid,
        name: data.name || '',
        pfp: data.pfp || '',
        totalUsers: data.totalUsers || 0,
        totalMsg: data.totalMsg || 0,
        admins: data.admins || [],
        members: data.members || {},
        serialCounter: data.serialCounter || 0,
        prefix: data.prefix || null,
        ...data
      };
      await collection.updateOne(
        { tid: tid },
        { $set: threadData },
        { upsert: true }
      );
      return threadData;
    } catch (error) {
      throw error;
    }
  }

  async addMemberToThread(tid, uid, userData) {
    try {
      if (!this.connected) throw new Error('Database not connected');
      const collection = this.db.collection('threads');

      let thread = await collection.findOne({ tid: tid });
      if (!thread) {
        thread = {
          tid: tid,
          name: '',
          pfp: '',
          totalUsers: 0,
          totalMsg: 0,
          admins: [],
          members: {},
          serialCounter: 0
        };
      }

      if (!thread.members[uid]) {
        thread.serialCounter = (thread.serialCounter || 0) + 1;
        thread.members[uid] = {
          uid: uid,
          serialNumber: thread.serialCounter,
          name: userData.name || '',
          pfp: userData.pfp || '',
          role: userData.role || 'member',
          joinedAt: Date.now(),
          totalMsg: 0,
          money: 0,
          exp: 0,
          ban: false,
          banReason: '',
          warning: 0,
          lastDaily: 0
        };
        thread.totalUsers = Object.keys(thread.members).length;
      }

      await collection.updateOne(
        { tid: tid },
        { $set: thread },
        { upsert: true }
      );
      return thread.members[uid];
    } catch (error) {
      throw error;
    }
  }

  async incrementMemberMsg(tid, uid) {
    try {
      if (!this.connected) throw new Error('Database not connected');
      const collection = this.db.collection('threads');

      await collection.updateOne(
        { tid: tid },
        { $inc: { [`members.${uid}.totalMsg`]: 1 } }
      );

      const thread = await collection.findOne({ tid: tid });
      return thread?.members?.[uid] || null;
    } catch (error) {
      throw error;
    }
  }

  async updateMember(tid, uid, updateData) {
    try {
      if (!this.connected) throw new Error('Database not connected');
      const collection = this.db.collection('threads');

      const updateFields = {};
      for (const [key, value] of Object.entries(updateData)) {
        updateFields[`members.${uid}.${key}`] = value;
      }

      await collection.updateOne(
        { tid: tid },
        { $set: updateFields }
      );

      const thread = await collection.findOne({ tid: tid });
      return thread?.members?.[uid] || null;
    } catch (error) {
      throw error;
    }
  }

  async getMember(tid, uid) {
    try {
      if (!this.connected) return null;
      const collection = this.db.collection('threads');
      const thread = await collection.findOne({ tid: tid });
      return thread?.members?.[uid] || null;
    } catch (error) {
      return null;
    }
  }

  async updateThread(tid, updateData) {
    try {
      if (!this.connected) throw new Error('Database not connected');
      const collection = this.db.collection('threads');

      let thread = await collection.findOne({ tid: tid });
      if (!thread) {
        thread = {
          tid: tid,
          name: '',
          pfp: '',
          totalUsers: 0,
          totalMsg: 0,
          admins: [],
          members: {}
        };
      }

      const updatedThread = { ...thread, ...updateData };
      await collection.updateOne(
        { tid: tid },
        { $set: updatedThread },
        { upsert: true }
      );
      return updatedThread;
    } catch (error) {
      throw error;
    }
  }

  async getAllThreads() {
    try {
      if (!this.connected) return {};
      const collection = this.db.collection('threads');
      const threads = await collection.find({}).toArray();
      const threadsObj = {};
      threads.forEach(thread => {
        threadsObj[thread.tid] = thread;
      });
      return threadsObj;
    } catch {
      return {};
    }
  }

  async getDmUser(phoneNumber) {
    try {
      if (!this.connected) return null;
      const collection = this.db.collection('dm_users');
      return await collection.findOne({ phoneNumber: phoneNumber });
    } catch {
      return null;
    }
  }

  async setDmUser(phoneNumber, data) {
    try {
      if (!this.connected) throw new Error('Database not connected');
      const collection = this.db.collection('dm_users');
      const userData = {
        phoneNumber: phoneNumber,
        name: data.name || '',
        pfp: data.pfp || '',
        totalMsg: data.totalMsg || 0,
        money: data.money || 0,
        exp: data.exp || 0,
        ban: data.ban || false,
        banReason: data.banReason || '',
        lastDaily: data.lastDaily || 0,
        prefix: data.prefix || null,
        createdAt: data.createdAt || Date.now(),
        updatedAt: Date.now(),
        ...data
      };
      await collection.updateOne(
        { phoneNumber: phoneNumber },
        { $set: userData },
        { upsert: true }
      );
      return userData;
    } catch (error) {
      throw error;
    }
  }

  async updateDmUser(phoneNumber, updateData) {
    try {
      if (!this.connected) throw new Error('Database not connected');
      const collection = this.db.collection('dm_users');

      let user = await collection.findOne({ phoneNumber: phoneNumber });
      if (!user) {
        user = {
          phoneNumber: phoneNumber,
          name: '',
          pfp: '',
          totalMsg: 0
        };
      }

      const updatedUser = { ...user, ...updateData, updatedAt: Date.now() };
      await collection.updateOne(
        { phoneNumber: phoneNumber },
        { $set: updatedUser },
        { upsert: true }
      );
      return updatedUser;
    } catch (error) {
      throw error;
    }
  }

  async incrementDmUserMsg(phoneNumber) {
    try {
      if (!this.connected) throw new Error('Database not connected');
      const collection = this.db.collection('dm_users');
      await collection.updateOne(
        { phoneNumber: phoneNumber },
        { $inc: { totalMsg: 1 } },
        { upsert: true }
      );
      return await this.getDmUser(phoneNumber);
    } catch (error) {
      throw error;
    }
  }

  async incrementUserMsg(uid) {
    try {
      if (!this.connected) throw new Error('Database not connected');
      const collection = this.db.collection('users');
      await collection.updateOne(
        { uid: uid },
        { $inc: { totalMsg: 1 } },
        { upsert: true }
      );
      return await this.getUser(uid);
    } catch (error) {
      throw error;
    }
  }

  async incrementThreadMsg(tid) {
    try {
      if (!this.connected) throw new Error('Database not connected');
      const collection = this.db.collection('threads');
      await collection.updateOne(
        { tid: tid },
        { $inc: { totalMsg: 1 } },
        { upsert: true }
      );
      return await this.getThread(tid);
    } catch (error) {
      throw error;
    }
  }

  async getAllDmUsers() {
    try {
      if (!this.connected) return {};
      const collection = this.db.collection('dm_users');
      const dmUsers = await collection.find({}).toArray();
      const dmUsersObj = {};
      dmUsers.forEach(user => {
        dmUsersObj[user.phoneNumber] = user;
      });
      return dmUsersObj;
    } catch {
      return {};
    }
  }

  async close() {
    if (this.client) {
      await this.client.close();
      this.connected = false;
    }
  }
}

module.exports = MongoDatabase;