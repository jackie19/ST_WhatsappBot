const fs = require('fs-extra');
const path = require('path');

class JsonDatabase {
  constructor() {
    this.dbPath = path.join(__dirname, '../database/data');
    this.userDbPath = path.join(this.dbPath, 'users.json');
    this.dmUserDbPath = path.join(this.dbPath, 'dm_users.json');
    this.threadDbPath = path.join(this.dbPath, 'threads.json');
    this.ready = false;
    this.initPromise = this.init();
  }

  async init() {
    await fs.ensureDir(this.dbPath);
    await fs.ensureFile(this.userDbPath);
    await fs.ensureFile(this.dmUserDbPath);
    await fs.ensureFile(this.threadDbPath);

    try {
      await fs.readJson(this.userDbPath);
    } catch {
      await fs.writeJson(this.userDbPath, {});
    }

    try {
      await fs.readJson(this.dmUserDbPath);
    } catch {
      await fs.writeJson(this.dmUserDbPath, {});
    }

    try {
      await fs.readJson(this.threadDbPath);
    } catch {
      await fs.writeJson(this.threadDbPath, {});
    }

    this.ready = true;
  }

  async ensureReady() {
    if (!this.ready) {
      await this.initPromise;
    }
  }

  async getUser(uid) {
    await this.ensureReady();
    try {
      const users = await fs.readJson(this.userDbPath);
      return users[uid] || null;
    } catch {
      return null;
    }
  }

  async setUser(uid, data) {
    await this.ensureReady();
    try {
      const users = await fs.readJson(this.userDbPath);
      users[uid] = {
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
      await fs.writeJson(this.userDbPath, users, { spaces: 2 });
      return users[uid];
    } catch (error) {
      throw error;
    }
  }

  async updateUser(uid, updateData) {
    await this.ensureReady();
    try {
      const users = await fs.readJson(this.userDbPath);
      if (!users[uid]) {
        users[uid] = {
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
      users[uid] = { ...users[uid], ...updateData, updatedAt: Date.now() };
      await fs.writeJson(this.userDbPath, users, { spaces: 2 });
      return users[uid];
    } catch (error) {
      throw error;
    }
  }

  async getAllUsers() {
    await this.ensureReady();
    try {
      return await fs.readJson(this.userDbPath);
    } catch {
      return {};
    }
  }

  async getThread(tid) {
    await this.ensureReady();
    try {
      const threads = await fs.readJson(this.threadDbPath);
      return threads[tid] || null;
    } catch (error) {
      return null;
    }
  }

  async setThread(tid, data) {
    await this.ensureReady();
    try {
      const threads = await fs.readJson(this.threadDbPath);
      threads[tid] = {
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
      await fs.writeJson(this.threadDbPath, threads, { spaces: 2 });
      return threads[tid];
    } catch (error) {
      throw error;
    }
  }

  async addMemberToThread(tid, uid, userData) {
    await this.ensureReady();
    try {
      const threads = await fs.readJson(this.threadDbPath);
      if (!threads[tid]) {
        threads[tid] = {
          tid: tid,
          name: '',
          pfp: '',
          totalUsers: 0,
          totalMsg: 0,
          admins: [],
          members: {}
        };
      }

      if (!threads[tid].members[uid]) {
        threads[tid].serialCounter = (threads[tid].serialCounter || 0) + 1;
        threads[tid].members[uid] = {
          uid: uid,
          serialNumber: threads[tid].serialCounter,
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
        threads[tid].totalUsers = Object.keys(threads[tid].members).length;
      }

      await fs.writeJson(this.threadDbPath, threads, { spaces: 2 });
      return threads[tid].members[uid];
    } catch (error) {
      throw error;
    }
  }

  async incrementMemberMsg(tid, uid) {
    await this.ensureReady();
    try {
      const threads = await fs.readJson(this.threadDbPath);
      if (threads[tid] && threads[tid].members[uid]) {
        threads[tid].members[uid].totalMsg = (threads[tid].members[uid].totalMsg || 0) + 1;
        await fs.writeJson(this.threadDbPath, threads, { spaces: 2 });
        return threads[tid].members[uid];
      }
      return null;
    } catch (error) {
      throw error;
    }
  }

  async updateMember(tid, uid, updateData) {
    await this.ensureReady();
    try {
      const threads = await fs.readJson(this.threadDbPath);
      if (threads[tid] && threads[tid].members[uid]) {
        threads[tid].members[uid] = { ...threads[tid].members[uid], ...updateData };
        await fs.writeJson(this.threadDbPath, threads, { spaces: 2 });
        return threads[tid].members[uid];
      }
      return null;
    } catch (error) {
      throw error;
    }
  }

  async getMember(tid, uid) {
    await this.ensureReady();
    try {
      const threads = await fs.readJson(this.threadDbPath);
      return threads[tid]?.members?.[uid] || null;
    } catch (error) {
      return null;
    }
  }

  async updateThread(tid, updateData) {
    await this.ensureReady();
    try {
      const threads = await fs.readJson(this.threadDbPath);
      if (!threads[tid]) {
        threads[tid] = {
          tid: tid,
          name: '',
          pfp: '',
          totalUsers: 0,
          totalMsg: 0,
          admins: [],
          members: {}
        };
      }
      threads[tid] = { ...threads[tid], ...updateData };
      await fs.writeJson(this.threadDbPath, threads, { spaces: 2 });
      return threads[tid];
    } catch (error) {
      throw error;
    }
  }

  async getAllThreads() {
    await this.ensureReady();
    try {
      return await fs.readJson(this.threadDbPath);
    } catch {
      return {};
    }
  }

  async getDmUser(phoneNumber) {
    await this.ensureReady();
    try {
      const dmUsers = await fs.readJson(this.dmUserDbPath);
      return dmUsers[phoneNumber] || null;
    } catch {
      return null;
    }
  }

  async setDmUser(phoneNumber, data) {
    await this.ensureReady();
    try {
      const dmUsers = await fs.readJson(this.dmUserDbPath);
      dmUsers[phoneNumber] = {
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
      await fs.writeJson(this.dmUserDbPath, dmUsers, { spaces: 2 });
      return dmUsers[phoneNumber];
    } catch (error) {
      throw error;
    }
  }

  async updateDmUser(phoneNumber, updateData) {
    await this.ensureReady();
    try {
      const dmUsers = await fs.readJson(this.dmUserDbPath);
      if (!dmUsers[phoneNumber]) {
        dmUsers[phoneNumber] = {
          phoneNumber: phoneNumber,
          name: '',
          pfp: '',
          totalMsg: 0
        };
      }
      dmUsers[phoneNumber] = { ...dmUsers[phoneNumber], ...updateData, updatedAt: Date.now() };
      await fs.writeJson(this.dmUserDbPath, dmUsers, { spaces: 2 });
      return dmUsers[phoneNumber];
    } catch (error) {
      throw error;
    }
  }

  async incrementDmUserMsg(phoneNumber) {
    const user = await this.getDmUser(phoneNumber) || { totalMsg: 0 };
    return await this.updateDmUser(phoneNumber, { totalMsg: (user.totalMsg || 0) + 1 });
  }

  async incrementUserMsg(uid) {
    const user = await this.getUser(uid) || { totalMsg: 0 };
    return await this.updateUser(uid, { totalMsg: (user.totalMsg || 0) + 1 });
  }

  async incrementThreadMsg(tid) {
    const thread = await this.getThread(tid) || { totalMsg: 0 };
    return await this.updateThread(tid, { totalMsg: (thread.totalMsg || 0) + 1 });
  }

  async getAllDmUsers() {
    await this.ensureReady();
    try {
      return await fs.readJson(this.dmUserDbPath);
    } catch {
      return {};
    }
  }
}

module.exports = JsonDatabase;