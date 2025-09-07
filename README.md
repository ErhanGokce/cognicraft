# Cognicraft

**Autonomous, learning agents for Minecraft — open-source and developer-friendly.**

Cognicraft runs multiple Mineflayer-based agents that behave like real players: they explore, gather wood/stone, craft items (planks, sticks, tools, crafting table), mine, build simple shelters/houses, protect themselves and interact politely with each other. The agents can optionally use a local LLM (Gemma3 via Ollama) for higher-level decision-making.

---

## ✨ Features

- 🤖 **Multiple autonomous agents** (miner, builder, explorer)
- ⚡ **Real in-game actions**: pathfinding, digging, placing, crafting, eating
- 🧠 **Simple short-term memory** and avoid-spam chat logic
- 🔮 **Optional LLM guidance** using **Gemma3:1b** via **Ollama** (local-only, no cloud)
- 👨‍💻 **Developer-friendly**: easy to extend and tweak

---

## 🚀 Quick Overview — What You Need

1. A computer with **Node.js (LTS)** installed → [nodejs.org](https://nodejs.org/en/download/)
2. A **Minecraft Java** world/server (1.20+ recommended). You can open a singleplayer world to LAN or run a dedicated local server → [Minecraft Help](https://help.minecraft.net/hc/en-us/articles/4410317081741-How-to-Play-Minecraft-Java-Edition-Multiplayer)
3. *(Optional but recommended for smarter decisions)* **Ollama** + **Gemma3:1b** model installed locally → [Ollama](https://ollama.com/download), [Ollama Quickstart](https://ollama.readthedocs.io/en/quickstart/)

---

## 📁 Repo Structure

```
Cognicraft/
├── package.json
├── realistic-main.js
├── .env
└── src/
   ├── agents/
   ├── actions/
   ├── brain/
   ├── memory/
   └── utils/
```

---

## 📝 Step-by-Step Setup

### 1) Install Node.js (LTS)

Install the Node.js LTS version (recommended). Use the official Node.js download page for installers and instructions for Windows/macOS/Linux → [nodejs.org](https://nodejs.org/en/download/)

Example:

```bash
# verify
node -v
npm -v
```

---

### 2) Install Ollama (optional but recommended)

Download and install Ollama for your OS from the official page (macOS / Windows / Linux installers + instructions). After install you'll run Ollama locally on `http://localhost:11434` by default → [Ollama](https://ollama.com/download)

Quick commands (once Ollama is installed):

```bash
# download the Gemma3 1B model (saves locally)
ollama pull gemma3:1b

# start Ollama background server (GUI/daemon)
ollama serve

# run the model interactively
ollama run gemma3:1b
```

The Ollama quickstart covers usage and CLI options in more detail → [Ollama Quickstart](https://ollama.readthedocs.io/en/quickstart/)

**Note:** The Cognicraft project uses the Gemma3 model token `gemma3:1b` in examples; make sure you pulled that model locally. See Gemma3 model listing for details → [gemma3:1b](https://ollama.com/library/gemma3%3A1b)

---

### 3) Prepare a Minecraft World (LAN or dedicated server)

You can either:

- **Open a singleplayer world to LAN** from the pause menu ("Open to LAN") — or use the in-game `/publish` command to open a local game on a chosen port (e.g. `25565`). This is fine for quick local testing → [Minecraft Help](https://help.minecraft.net/hc/en-us/articles/4410317081741-How-to-Play-Minecraft-Java-Edition-Multiplayer)

  Example (in-game text chat):

  ```
  /publish 25565
  ```

  The game will report the LAN port in chat (e.g. `Local game hosted on port 25565`). Share host IP + port with other players/bots in the same LAN.

- **Or run a dedicated Java server** (Paper or vanilla) on port `25565` if you want a persistent, server-like setup (recommended for long runs). Download server software from the official Minecraft site → [Minecraft.net](https://www.minecraft.net/en-us/download)

**Important:** If your bots must join without Mojang authentication, set `online-mode=false` in `server.properties` (only for local/test servers; **do not** do this on public servers you don't control).

---

### 4) Clone / Prepare the Cognicraft Project

```bash
git clone https://github.com/your-username/Cognicraft.git
cd Cognicraft
```

Install dependencies:

```bash
npm install
```

Add a simple `start` script in `package.json` if not present:

```json
"scripts": {
  "start": "node index.js",
}
```

Create a `.env` file in the repo root (example):

```bash
SERVER_HOST=localhost
SERVER_PORT=25565
OLLAMA_URL=http://localhost:11434
MODEL=gemma3:1b
```

---

### 5) Start Services in Order

#### 1. **Start Minecraft**

- If you use a dedicated server: start the server (`java -jar server.jar`) and confirm it listens on port 25565.
- If you use singleplayer → **Open to LAN** or `/publish` on port `25565`.

#### 2. **(Optional) Start Ollama**

```bash
ollama serve
```

Confirm the service is reachable at `http://localhost:11434`.

#### 3. **Start Cognicraft agents**

```bash
npm run start
```

You should see console logs as agents spawn and start acting (e.g. "AI_Miner spawned", "Found tree", "Crafting table made", etc).

---

## 🎮 Expected Behaviour

- **AI_Miner**: Finds and cuts trees, mines stone and ores, crafts tools (pickaxe, axe), focuses on resource gathering
- **AI_Builder**: Collects building materials, constructs platforms/walls/houses, crafts construction items, focuses on building structures  
- **AI_Explorer**: Explores the world, discovers interesting locations, shares information with other agents, focuses on social interaction

### Real Actions They Perform:
✅ **Tree cutting** - Finds trees and cuts them completely  
✅ **Mining** - Digs underground for stone and ores  
✅ **Crafting** - Makes planks, sticks, tools, and crafting tables  
✅ **Building** - Constructs simple platforms and structures  
✅ **Smart decisions** - Uses context to prioritize actions  
✅ **Cooperation** - Agents coordinate and share resources  
✅ **Learning** - Remembers successful/failed actions  

---

## 🛠️ Troubleshooting & Tips

- **`MODULE_NOT_FOUND`** — Ensure you run `node index.js` from the repo root and that `require('./src/…')` paths are correct.
- **Bots can't join** — Check server IP/port, firewall rules, and `online-mode` if you're using offline-assigned usernames for bots.
- **Ollama not reachable** — Make sure `ollama serve` is running and `OLLAMA_URL` in `.env` matches the host/port. Test `http://localhost:11434/api/tags` in a browser or `curl` → [Ollama Quickstart](https://ollama.readthedocs.io/en/quickstart/)
- **Model not available** — Run `ollama list` to see installed models, and `ollama pull gemma3:1b` to download the 1B Gemma model if missing → [gemma3:1b](https://ollama.com/library/gemma3%3A1b)
- **Minecraft LAN not visible** — Try `/publish 25565` in the game chat, and join via `your-host-ip:25565` from another PC on the same network → [Minecraft Help](https://help.minecraft.net/hc/en-us/articles/4410317081741-How-to-Play-Minecraft-Java-Edition-Multiplayer)

---

## 🔮 Suggested Next Steps / Enhancements

- Make agents trade items / deposit into chests
- Add combat & evasion behaviors (use sword, shield, run away on low health)
- Add more advanced building blueprints for houses
- Add a small web dashboard to monitor agent states (positions, health, inventory)
- Add CI tests that spin up a headless server and run a short agent behaviour smoke test

---

## 🔗 Resources & Links

- [Ollama download & installers](https://ollama.com/download) (macOS / Linux / Windows)
- [Ollama quickstart & CLI reference](https://ollama.readthedocs.io/en/quickstart/)
- [Gemma3 model on Ollama](https://ollama.com/library/gemma3%3A1b) (includes model tags like `gemma3:1b`)
- [Node.js downloads](https://nodejs.org/en/download/) and LTS info
- [Minecraft Java edition & server downloads](https://www.minecraft.net/en-us/download) / official docs

---

## 📄 License & Contribution

Cognicraft is open source under the MIT License. Contributions welcome: open issues for bugs, feature requests or offer PRs for new behaviors and improvements.

### Contributing
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 🎬 Demo

Watch these intelligent agents in action as they autonomously:
- Cut down entire forests 🌳
- Mine deep underground ⛏️
- Build impressive structures 🏗️
- Coordinate with each other 🤝
- Learn from their mistakes 🧠

*More demo videos and screenshots coming soon!*

---

**Made with ❤️ for the Minecraft community**

*If you find this project helpful, please ⭐ star the repository!*
