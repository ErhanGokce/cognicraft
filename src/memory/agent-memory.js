const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class AgentMemory {
  constructor(agentName) {
    this.agentName = agentName;
    this.dbPath = path.join(__dirname, '../../data/agents.db');
    this.db = null;
    this.shortTermMemory = [];
    this.maxShortTermMemory = 20;
    
    this.initDatabase();
  }

  async initDatabase() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('Database connection error:', err);
          reject(err);
          return;
        }
        
        // Tabloları oluştur
        this.db.serialize(() => {
          this.db.run(`
            CREATE TABLE IF NOT EXISTS experiences (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              agent_name TEXT,
              timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
              action TEXT,
              context TEXT,
              result TEXT,
              success INTEGER
            )
          `);
          
          this.db.run(`
            CREATE TABLE IF NOT EXISTS interactions (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              agent_name TEXT,
              timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
              other_agent TEXT,
              message TEXT,
              response TEXT
            )
          `);
          
          this.db.run(`
            CREATE TABLE IF NOT EXISTS locations (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              agent_name TEXT,
              timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
              x REAL,
              y REAL,
              z REAL,
              biome TEXT,
              interesting_blocks TEXT
            )
          `);
        });
        
        console.log(`Database initialized for ${this.agentName}`);
        resolve();
      });
    });
  }

  // Kısa süreli hafıza (RAM'de)
  addToShortTerm(event) {
    this.shortTermMemory.push({
      ...event,
      timestamp: new Date().toISOString()
    });
    
    // Hafıza limitini aş
    if (this.shortTermMemory.length > this.maxShortTermMemory) {
      this.shortTermMemory.shift();
    }
  }

  getRecentMemories(count = 5) {
    return this.shortTermMemory.slice(-count);
  }

  // Uzun süreli hafıza (Database'de)
  async saveExperience(action, context, result, success) {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT INTO experiences (agent_name, action, context, result, success)
        VALUES (?, ?, ?, ?, ?)
      `);
      
      stmt.run([
        this.agentName,
        action,
        JSON.stringify(context),
        JSON.stringify(result),
        success ? 1 : 0
      ], (err) => {
        if (err) reject(err);
        else resolve();
      });
      
      stmt.finalize();
    });
  }

  async saveInteraction(otherAgent, message, response) {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT INTO interactions (agent_name, other_agent, message, response)
        VALUES (?, ?, ?, ?)
      `);
      
      stmt.run([
        this.agentName,
        otherAgent,
        message,
        response
      ], (err) => {
        if (err) reject(err);
        else resolve();
      });
      
      stmt.finalize();
    });
  }

  async saveLocation(position, biome, interestingBlocks) {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT INTO locations (agent_name, x, y, z, biome, interesting_blocks)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run([
        this.agentName,
        position.x,
        position.y,
        position.z,
        biome || 'unknown',
        JSON.stringify(interestingBlocks || [])
      ], (err) => {
        if (err) reject(err);
        else resolve();
      });
      
      stmt.finalize();
    });
  }

  // Başarılı deneyimleri öğren
  async getSuccessfulActions(actionType, limit = 10) {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT action, context, result 
        FROM experiences 
        WHERE agent_name = ? AND success = 1 AND action = ?
        ORDER BY timestamp DESC 
        LIMIT ?
      `, [this.agentName, actionType, limit], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // Sosyal hafıza
  async getRecentInteractions(otherAgent, limit = 5) {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT message, response, timestamp
        FROM interactions 
        WHERE agent_name = ? AND other_agent = ?
        ORDER BY timestamp DESC 
        LIMIT ?
      `, [this.agentName, otherAgent, limit], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // Keşfedilen yerler
  async getVisitedLocations(limit = 20) {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT x, y, z, biome, interesting_blocks, timestamp
        FROM locations 
        WHERE agent_name = ?
        ORDER BY timestamp DESC 
        LIMIT ?
      `, [this.agentName, limit], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // Hafızayı özetle
  getMemorySummary() {
    return {
      shortTermEvents: this.shortTermMemory.length,
      recentActivity: this.shortTermMemory.slice(-3).map(m => m.type),
      agentName: this.agentName
    };
  }

  // Database'i kapat
  close() {
    if (this.db) {
      this.db.close((err) => {
        if (err) console.error('Database close error:', err);
        else console.log('Database connection closed for', this.agentName);
      });
    }
  }
}

module.exports = AgentMemory;