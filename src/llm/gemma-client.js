const axios = require('axios');

class GemmaClient {
    constructor(baseURL = 'http://localhost:11434') {
        this.baseURL = baseURL;
        this.model = 'gemma3:1b';
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
                    max_tokens: options.max_tokens || 512,
                }
            });
            return response.data.response.trim();
        }
        catch (error) {
            console.error('Gemma API Error:', error.message);
            return 'explore';
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
                    max_tokens: options.max_tokens || 512,
                }
            });
            return response.data.message.content.trim();
        } catch (error) {
            console.error('Gemma Chat API Error:', error.message);
            return 'Hello! How can I assist you today?';
        }
    }
    // Custom prompts for minecraft actions
    async decideAction(gameState) {
        const prompt = `
        You are an smart Minecraft player. Current status:
        HALTH: ${gameState.health}/20
        FOOD: ${gameState.food}/20
        POSITION: x=${gameState.position.x.toFixed(0)}, y=${gameState.posiiton.y.toFixed(0)}, z=${gameState.position.z.toFixed(0)}
        INVENTORY: ${gameState.inventory}
        NEARBY: ${gameState.nearby}
        TIME: ${gameState.timeOfDay}

        Select one of the following actions and type the name of the action:
        - explore
        - mine
        - build
        - eat
        - sleep
        - follow_player
        - fight
        - craft
        - collect
        
        Action:`;

        const response = await this.generate(prompt, { max_tokens: 20 });
        return this.parseAction(response);
    }

    async generateChatMessage(context) {
        const prompt = `
        You are a friendly Minecraft player. What would you say in this situation:

        Situation: ${context.situation}
        OTHER PLAYERS: ${context.players}
        RECENT EVENTS: ${context.recentEvents}

        Write a short and friendly message (maximum 2 sentences):
        `;
        
        return await this.generate(prompt, { max_tokens: 50 });
    }

    parseAction(response) {
        const validActions = [
            'explore', 'mine', 'build', 'eat', 'sleep', 'follow_player', 'fight', 'craft', 'collect'
        ];

        const lowerResponse = response.toLowerCase();
        for (const action of validActions) {
            if (lowerResponse.includes(action)) {
                return action;
            }
        }
        return 'explore'; // Default action
    }

    // Test connection
    async testConnection() {
        try {
            const response = await axios.get(`${this.baseURL}/api/tags`);
            console.log('Gemma Connection is successful');
            return true;
        } catch (error) {
            console.error('Gemma Connection failed:', error.message);
            console.log('Make sure Gemma is running on port 11434');
            return false;
        }
    }
}

module.exports = GemmaClient;