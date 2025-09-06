const mineflayer = require('mineflayer');
 const bot = mineflayer.createBot({
    host: 'localhost', //port 25565 olmalı
    username: 'Bot',
 });

 bot.on('login', () => {
    console.log('Bot sucessfully logged in.')
 });

 bot.on('chat', (username, message) => {
    if (message === 'hello') {
        bot.chat('Hi there!');
    }
 });