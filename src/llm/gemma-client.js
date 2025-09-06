const axios = require('axios');

class GemmaClient {
  constructor(baseURL = 'http://localhost:11434') {
    this.baseURL = baseURL;
    this.model = 'gemma3:1b'; // veya gemma2:2b
  }

  async generate(prompt, options = {}) {
    try {
      const response = await axios.post(`${this.baseURL}/api/generate`, {
        model: this.model,
        prompt: prompt,
        stream: false,
        options: {
          temperature: options.temperature || 0.7,
          top_p: options.top_p || 0.9,
          max_tokens: options.max_tokens || 150
        }
      });

      return response.data.response.trim();
    } catch (error) {
      console.error('Gemma API Hatası:', error.message);
      return 'explore'; // Fallback action
    }
  }

  async chat(messages, options = {}) {
    try {
      const response = await axios.post(`${this.baseURL}/api/chat`, {
        model: this.model,
        messages: messages,
        stream: false,
        options: {
          temperature: options.temperature || 0.7,
          top_p: options.top_p || 0.9,
          max_tokens: options.max_tokens || 150
        }
      });

      return response.data.message.content.trim();
    } catch (error) {
      console.error('Gemma Chat API Hatası:', error.message);
      return 'Merhaba!'; // Fallback response
    }
  }

  // Minecraft action'ları için özelleştirilmiş prompt
  async decideAction(gameState) {
    const prompt = `
Sen akıllı bir Minecraft oyuncususun. Mevcut durum:

SAĞLIK: ${gameState.health}/20
AÇLIK: ${gameState.food}/20
KONUM: x=${gameState.position.x.toFixed(0)}, y=${gameState.position.y.toFixed(0)}, z=${gameState.position.z.toFixed(0)}
ENVANTER: ${gameState.inventory}
YAKINLARDA: ${gameState.nearby}
ZAMAN: ${gameState.timeOfDay}

Şu eylemlerden birini seç ve sadece eylemin adını yaz:
- explore (keşfet)
- mine (maden kaz) 
- build (inşa et)
- chat (konuş)
- eat (ye)
- sleep (uyu)
- follow_player (oyuncuyu takip et)
- craft (eşya yap)
- collect (topla)

Eylem:`;

    const response = await this.generate(prompt, { max_tokens: 20 });
    return this.parseAction(response);
  }

  async generateChatMessage(context) {
    const prompt = `Sen dostane ama akıllı bir Minecraft oyuncususun.

DURUM: ${context.situation}
DİĞER OYUNCULAR: ${context.players}
SON OLAYLAR: ${context.recentEvents}

Bu duruma uygun, KISA ve MANTIKLI bir mesaj yaz. Gereksiz emoji kullanma.
Örnekler:
- "Merhaba! Birlikte inşaat yapalım mı?"
- "Bu bölgede güzel odun var"
- "Birinin aletine ihtiyacım var"
- "Burası güvenli görünüyor"

Mesaj:`;

    return await this.generate(prompt, { max_tokens: 30 });
  }

  parseAction(response) {
    const validActions = [
      'explore', 'mine', 'build', 'chat', 'eat', 
      'sleep', 'follow_player', 'craft', 'collect'
    ];
    
    const lowerResponse = response.toLowerCase();
    for (const action of validActions) {
      if (lowerResponse.includes(action)) {
        return action;
      }
    }
    
    return 'mine'; // Default action
  }

  // Test bağlantısı
  async testConnection() {
    try {
      const response = await axios.get(`${this.baseURL}/api/tags`);
      console.log('✅ Ollama bağlantısı başarılı!');
      return true;
    } catch (error) {
      console.error('❌ Ollama bağlantı hatası:', error.message);
      console.log('Ollama çalıştığından emin olun: ollama serve');
      return false;
    }
  }
}

module.exports = GemmaClient;