const BaseAgent = require('./src/agents/base-agent');
const GemmaClient = require('./src/llm/gemma-client');

// Ayarlar
const SERVER_HOST = 'localhost';
const SERVER_PORT = 25565; // Minecraft server portunu buraya yazın

async function main() {
  console.log('🚀 Minecraft AI Agents Starting...\n');
  
  // Önce Gemma bağlantısını test et
  const gemma = new GemmaClient();
  const isConnected = await gemma.testConnection();
  
  if (!isConnected) {
    console.log('\n❌ Başlamadan önce Ollama\'nın çalıştığından emin olun:');
    console.log('Terminal\'de: ollama serve');
    console.log('Sonra: ollama run gemma:3b');
    return;
  }

  console.log('✅ Gemma bağlantısı başarılı!\n');
  
  // Ajanları oluştur
  console.log('🤖 Creating agents...\n');
  
  const agents = [];
  
  // İlk ajan - Keşifçi
  const explorer = new BaseAgent('AI_Explorer', SERVER_HOST, SERVER_PORT);
  explorer.personality.curiosity = 0.9;
  explorer.personality.social = 0.7;
  agents.push(explorer);
  
  // İkinci ajan - Arkadaşça
  setTimeout(() => {
    const friend = new BaseAgent('AI_Friend', SERVER_HOST, SERVER_PORT);
    friend.personality.chattiness = 0.8;
    friend.personality.social = 0.9;
    agents.push(friend);
  }, 3000); // 3 saniye sonra ikinci ajanı başlat
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down agents...');
    agents.forEach(agent => {
      agent.disconnect();
    });
    process.exit(0);
  });
  
  console.log('🎮 Agents are connecting to Minecraft server...');
  console.log('📊 Check the console for their activities!');
  console.log('🛑 Press Ctrl+C to stop all agents\n');
}

// Hata yakalama
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Uygulamayı başlat
main().catch(error => {
  console.error('❌ Application failed to start:', error);
  process.exit(1);
});