const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const GemmaClient = require('../llm/gemma-client');
const AgentMemory = require('../memory/agent-memory');

class BaseAgent {
  constructor(username, host = 'localhost', port = 25565) {
    this.username = username;
    this.host = host;
    this.port = port;
    
    this.bot = null;
    this.llm = new GemmaClient();
    this.memory = new AgentMemory(username);
    
    this.isThinking = false;
    this.currentGoal = null;
    this.lastAction = null;
    this.actionHistory = [];
    
    this.personality = {
      chattiness: 0.3, // Ne kadar konuşkan
      curiosity: 0.8,  // Ne kadar meraklı
      social: 0.6,     // Ne kadar sosyal
      caution: 0.4     // Ne kadar temkinli
    };
    
    this.init();
  }

  async init() {
    // Gemma bağlantısını test et
    const connected = await this.llm.testConnection();
    if (!connected) {
      console.error(`❌ ${this.username}: Gemma bağlantısı kurulamadı!`);
      return;
    }

    this.createBot();
  }

  createBot() {
    this.bot = mineflayer.createBot({
      host: this.host,
      port: this.port,
      username: this.username,
      version: false // Auto-detect
    });

    this.setupBotEvents();
    this.setupPlugins();
  }

  setupPlugins() {
    this.bot.loadPlugin(pathfinder);
    
    // Movement ayarları
    const mcData = require('minecraft-data')(this.bot.version);
    const defaultMove = new Movements(this.bot, mcData);
    this.bot.pathfinder.setMovements(defaultMove);
  }

  setupBotEvents() {
    this.bot.on('spawn', () => {
      console.log(`🤖 ${this.username} spawned and ready!`);
      this.memory.addToShortTerm({
        type: 'spawn',
        message: 'Bot spawned successfully'
      });
      
      // Düşünme döngüsünü başlat
      setTimeout(() => {
        this.startThinkingLoop();
      }, 2000);
    });

    this.bot.on('chat', (username, message) => {
      if (username === this.bot.username) return;
      
      console.log(`💬 ${username}: ${message}`);
      this.handleChat(username, message);
    });

    this.bot.on('playerJoined', (player) => {
      console.log(`👋 ${player.username} joined the game`);
      this.memory.addToShortTerm({
        type: 'player_joined',
        player: player.username
      });
      
      // Bazen selamla
      if (Math.random() < this.personality.social) {
        setTimeout(() => {
          this.bot.chat(`Merhaba ${player.username}! 👋`);
        }, 1000 + Math.random() * 3000);
      }
    });

    this.bot.on('playerLeft', (player) => {
      console.log(`👋 ${player.username} left the game`);
      this.memory.addToShortTerm({
        type: 'player_left',
        player: player.username
      });
    });

    this.bot.on('health', () => {
      if (this.bot.health < 10) {
        this.memory.addToShortTerm({
          type: 'low_health',
          health: this.bot.health
        });
      }
    });

    this.bot.on('error', (err) => {
      console.error(`❌ ${this.username} error:`, err.message);
    });

    this.bot.on('kicked', (reason) => {
      console.log(`😵 ${this.username} was kicked:`, reason);
    });

    this.bot.on('end', () => {
      console.log(`💀 ${this.username} disconnected`);
      // Otomatik yeniden bağlan
      setTimeout(() => {
        console.log(`🔄 ${this.username} reconnecting...`);
        this.createBot();
      }, 5000);
    });
  }

  async handleChat(username, message) {
    // Kendi mesajlarını görmezden gel
    if (username === this.bot.username) return;
    
    // Hafızaya kaydet
    this.memory.addToShortTerm({
      type: 'chat_received',
      from: username,
      message: message
    });
    
    // Bana hitap ediyor mu?
    const mentionsMe = message.toLowerCase().includes(this.username.toLowerCase()) ||
                       message.includes('@' + this.username);
    
    // Cevap verme olasılığı
    const shouldRespond = mentionsMe || 
                         (Math.random() < this.personality.chattiness);
    
    if (shouldRespond) {
      const context = {
        situation: `${username} şunu dedi: "${message}"`,
        players: Object.keys(this.bot.players).filter(p => p !== this.username),
        recentEvents: this.memory.getRecentMemories(3)
      };
      
      try {
        const response = await this.llm.generateChatMessage(context);
        
        // Biraz bekle, doğal görünsün
        setTimeout(() => {
          this.bot.chat(response);
          this.memory.saveInteraction(username, message, response);
        }, 1000 + Math.random() * 2000);
        
      } catch (error) {
        console.error('Chat response error:', error);
      }
    }
  }

  startThinkingLoop() {
    // Her 3-8 saniye düşün
    const thinkInterval = 3000 + Math.random() * 5000;
    
    setTimeout(async () => {
      if (!this.isThinking) {
        await this.think();
      }
      this.startThinkingLoop();
    }, thinkInterval);
  }

  async think() {
    if (this.isThinking) return;
    this.isThinking = true;
    
    try {
      // Oyun durumunu analiz et
      const gameState = this.analyzeGameState();
      
      // Gemma'dan karar al
      const action = await this.llm.decideAction(gameState);
      
      console.log(`🧠 ${this.username} thinking: ${action}`);
      
      // Eylemi gerçekleştir
      await this.executeAction(action, gameState);
      
      // Hafızaya kaydet
      this.memory.addToShortTerm({
        type: 'decision',
        action: action,
        gameState: gameState
      });
      
    } catch (error) {
      console.error(`❌ ${this.username} thinking error:`, error.message);
    } finally {
      this.isThinking = false;
    }
  }

  analyzeGameState() {
    const position = this.bot.entity.position;
    const nearbyPlayers = Object.keys(this.bot.players)
      .filter(name => name !== this.username && this.bot.players[name].entity)
      .map(name => {
        const player = this.bot.players[name];
        const distance = position.distanceTo(player.entity.position);
        return `${name} (${distance.toFixed(1)}m)`;
      });

    const inventory = this.bot.inventory.items()
      .map(item => `${item.count}x ${item.name}`)
      .join(', ') || 'boş';

    return {
      health: this.bot.health,
      food: this.bot.food,
      position: position,
      timeOfDay: this.bot.time.timeOfDay > 6000 && this.bot.time.timeOfDay < 18000 ? 'gündüz' : 'gece',
      weather: this.bot.isRaining ? 'yağmurlu' : 'güneşli',
      nearby: nearbyPlayers.length > 0 ? nearbyPlayers.join(', ') : 'kimse yok',
      inventory: inventory
    };
  }

  async executeAction(action, gameState) {
    try {
      switch (action) {
        case 'explore':
          await this.explore();
          break;
        case 'mine':
          await this.mine();
          break;
        case 'build':
          await this.build();
          break;
        case 'chat':
          await this.randomChat();
          break;
        case 'eat':
          await this.eat();
          break;
        case 'sleep':
          await this.sleep();
          break;
        case 'follow_player':
          await this.followPlayer();
          break;
        case 'craft':
          await this.craft();
          break;
        case 'collect':
          await this.collect();
          break;
        default:
          await this.mine(); // Default action
      }
      
      // Başarılı eylemi kaydet
      await this.memory.saveExperience(action, gameState, 'success', true);
      
    } catch (error) {
      console.error(`❌ ${this.username} action error:`, error.message);
      await this.memory.saveExperience(action, gameState, error.message, false);
    }
  }

  async explore() {
    const randomX = this.bot.entity.position.x + (Math.random() - 0.5) * 50;
    const randomZ = this.bot.entity.position.z + (Math.random() - 0.5) * 50;
    
    // Pathfinder yerine basit hareket
    try {
      if (this.bot.pathfinder) {
        await this.bot.pathfinder.goto(new goals.GoalXZ(randomX, randomZ));
      } else {
        // Fallback: Basit yürüme
        this.bot.setControlState('forward', true);
        setTimeout(() => {
          this.bot.setControlState('forward', false);
          // Rastgele yön değiştir
          this.bot.look(Math.random() * Math.PI * 2, 0);
        }, 2000 + Math.random() * 3000);
      }
      console.log(`🚶 ${this.username} exploring to (${randomX.toFixed(0)}, ${randomZ.toFixed(0)})`);
    } catch (error) {
      console.log(`🚶 ${this.username} couldn't reach exploration target`);
    }
  }

  async followPlayer() {
    const nearbyPlayers = Object.keys(this.bot.players)
      .filter(name => name !== this.username && this.bot.players[name].entity);
    
    if (nearbyPlayers.length > 0) {
      const target = nearbyPlayers[0];
      const playerEntity = this.bot.players[target].entity;
      
      try {
        await this.bot.pathfinder.goto(new goals.GoalFollow(playerEntity, 3));
        console.log(`🏃 ${this.username} following ${target}`);
      } catch (error) {
        console.log(`🏃 ${this.username} couldn't follow ${target}`);
      }
    }
  }

  async randomChat() {
    const messages = [
      "Bu dünya çok güzel! 🌍",
      "Bugün ne yapıyorsunuz?",
      "Birlikte bir şeyler inşa edelim mi?",
      "Yeni yerler keşfetmek çok eğlenceli!",
      "Size yardım edebilir miyim?",
      "Hava çok güzel bugün ☀️"
    ];
    
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    this.bot.chat(randomMessage);
  }

  async eat() {
    const food = this.bot.inventory.items().find(item => 
      item.name.includes('bread') || 
      item.name.includes('apple') || 
      item.name.includes('cooked')
    );
    
    if (food && this.bot.food < 20) {
      try {
        await this.bot.equip(food, 'hand');
        await this.bot.consume();
        console.log(`🍞 ${this.username} ate ${food.name}`);
      } catch (error) {
        console.log(`🍞 ${this.username} couldn't eat`);
      }
    }
  }

  // Bu metodlar subclass'larda override edilebilir
  async mine() {
    console.log(`⛏️ ${this.username} wants to mine but doesn't know how yet`);
  }

  async build() {
    console.log(`🏗️ ${this.username} wants to build but doesn't know how yet`);
  }

  async sleep() {
    console.log(`😴 ${this.username} wants to sleep but can't find a bed`);
  }

  async craft() {
    console.log(`🔨 ${this.username} trying to craft tools`);
    
    const inventory = this.bot.inventory.items();
    
    // Crafting table var mı kontrol et
    const craftingTable = inventory.find(item => item.name === 'crafting_table');
    if (!craftingTable) {
      // Ahşap varsa crafting table yap
      const wood = inventory.find(item => 
        item.name.includes('wood') || item.name.includes('log')
      );
      
      if (wood && wood.count >= 1) {
        try {
          // Önce planks yap
          await this.bot.craft(this.bot.recipesFor('planks')[0], 4);
          this.bot.chat("Tahta yaptım!");
          
          // Sonra crafting table yap
          await this.bot.craft(this.bot.recipesFor('crafting_table')[0], 1);
          this.bot.chat("Crafting table yaptım! 🔨");
          
          return;
        } catch (error) {
          console.log(`🔨 ${this.username} couldn't craft crafting table`);
        }
      }
    }
    
    // Temel aletler yap
    await this.craftBasicTools();
  }

  async craftBasicTools() {
    const inventory = this.bot.inventory.items();
    
    // Planks var mı?
    const planks = inventory.find(item => item.name.includes('planks'));
    const sticks = inventory.find(item => item.name === 'stick');
    
    // Önce stick yap
    if (!sticks && planks && planks.count >= 2) {
      try {
        await this.bot.craft(this.bot.recipesFor('stick')[0], 4);
        this.bot.chat("Çubuk yaptım!");
      } catch (error) {
        console.log(`🔨 Stick yapılamadı`);
      }
    }
    
    // Sonra alet yap
    const updatedInventory = this.bot.inventory.items();
    const newSticks = updatedInventory.find(item => item.name === 'stick');
    const newPlanks = updatedInventory.find(item => item.name.includes('planks'));
    
    if (newSticks && newSticks.count >= 2 && newPlanks && newPlanks.count >= 3) {
      // Pickaxe yap
      const hasPickaxe = updatedInventory.some(item => item.name.includes('pickaxe'));
      if (!hasPickaxe) {
        try {
          await this.bot.craft(this.bot.recipesFor('wooden_pickaxe')[0], 1);
          this.bot.chat("Ahşap kazma yaptım! ⛏️");
          return;
        } catch (error) {
          console.log(`🔨 Pickaxe yapılamadı`);
        }
      }
      
      // Axe yap
      const hasAxe = updatedInventory.some(item => item.name.includes('axe'));
      if (!hasAxe) {
        try {
          await this.bot.craft(this.bot.recipesFor('wooden_axe')[0], 1);
          this.bot.chat("Ahşap balta yaptım! 🪓");
          return;
        } catch (error) {
          console.log(`🔨 Axe yapılamadı`);
        }
      }
    }
    
    this.bot.chat("Crafting için malzeme yetersiz... 🤔");
  }

  async collect() {
    console.log(`📦 ${this.username} wants to collect items but doesn't see any`);
  }

  // Bot'u kapat
  disconnect() {
    if (this.bot) {
      this.bot.quit();
    }
    if (this.memory) {
      this.memory.close();
    }
  }
}

module.exports = BaseAgent;