# D&D Combat AI for FoundryVTT

An intelligent FoundryVTT module that provides AI-powered combat assistance for NPCs in D&D 5e games. This module uses Large Language Models (LLMs) to generate tactical recommendations based on combat situation analysis and customizable difficulty settings.

## Features

### 🧠 AI-Powered NPC Combat
- Automatically detects NPC turns and provides intelligent action recommendations
- Context-aware analysis of battlefield conditions, enemy positions, and available abilities
- Supports multiple difficulty levels from Easy to TPK mode
- Smart action caching system to optimize token usage and reduce API costs

### 🎯 Difficulty-Based Tactics
- **Easy**: Defensive play with suboptimal choices
- **Normal**: Tactical but imperfect decision making
- **Hard**: Optimal use of abilities and positioning
- **Deadly**: Ruthless efficiency with advanced tactics
- **TPK Mode**: Perfect tactical play with meta-knowledge

### 🔌 Dual LLM Configuration
Configure separate LLM providers for different purposes to optimize cost and performance:

- **Action Cache LLM**: Pre-processes NPC abilities into concise tactical descriptions (recommend fast, cheap local models)
- **Combat Recommendation LLM**: Generates real-time tactical decisions during combat (recommend powerful cloud models)

**Supported Providers:**
- **OpenAI**: GPT-4o-mini, GPT-4o, O1-mini, O1 (with reasoning effort control)
- **Anthropic (Claude)**: Claude 3.5 Haiku, Claude 3.5 Sonnet, Claude Opus 4
- **Local LLMs**: Support for Ollama, LM Studio, and other local endpoints

### 🗄️ Intelligent Action Cache System
- Pre-caches NPC abilities at combat start using LLM processing
- Reduces token usage by 80-90% during combat
- 1-hour cache timeout with automatic cleanup
- Parallel processing for multiple NPCs
- Graceful fallback when LLM is unavailable

### 🔐 Enhanced Security
- API keys stored in browser localStorage (not in world database)
- Keys never exported with world data
- Automatic migration from legacy storage
- Per-device/per-browser configuration

### 🌐 D&D Beyond Integration
- Optional integration with DDB Importer module
- Fetches rich monster data directly from D&D Beyond
- Automatic fallback to local parsing when unavailable
- Supports all DDB-imported monsters

### 🎮 Seamless Integration
- Automatic combat turn detection
- Quick-access difficulty controls in combat tracker
- Manual AI assistance button for current NPCs
- Comprehensive settings dialog with connection testing
- Mobile-responsive design
- Dark mode compatibility

## Installation

### From Foundry VTT (Recommended)
1. Open FoundryVTT and navigate to your world
2. Go to **Add-on Modules** tab
3. Click **Install Module**
4. Search for "D&D Combat AI"
5. Click **Install**

### Manual Installation
Use this manifest URL:
```
https://github.com/TheNightAngel17/foundry-vtt-dnd-combat-ai/releases/latest/download/module.json
```

## Quick Setup

### Step 1: Enable the Module
1. Activate "D&D Combat AI" in your world's module settings
2. Restart your world when prompted

### Step 2: Configure LLM Providers
The module uses two separate LLM configurations:

#### Action Cache LLM (Optional but Recommended)
Used to pre-process NPC abilities into concise descriptions. Runs infrequently (once per NPC per hour).

**Recommended: Local Model (Free)**
1. Install [Ollama](https://ollama.ai/)
2. Run: `ollama pull llama3.2`
3. In module settings, click "🗄️ Configure Action Cache LLM"
4. Set Provider: **Local**
5. Set Endpoint: `http://localhost:11434`
6. Set Model: `llama3.2`
7. Click **Save Configuration**

#### Combat Recommendation LLM (Required)
Used to generate tactical recommendations during combat. Runs frequently (every NPC turn).

**Recommended: OpenAI GPT-4o-mini (Low Cost, High Quality)**
1. Get an API key from [OpenAI Platform](https://platform.openai.com/)
2. In module settings, click "🧠 Configure Combat LLM"
3. Set Provider: **OpenAI**
4. Enter your **API Key**
5. Set Model: `gpt-4o-mini`
6. Click **Save Configuration**

**Alternative Providers:**
- **Anthropic Claude 3.5 Haiku**: Fast and affordable
- **Local Model**: Free but requires more powerful hardware
- **OpenAI O1**: Best tactical intelligence (higher cost)

### Step 3: Basic Configuration
1. **AI Difficulty**: Choose your preferred difficulty level (Normal recommended)
2. **Auto-display Recommendations**: Enable to show AI advice automatically
3. **Test**: Start a combat with an NPC to verify everything works

## Configuration

### Difficulty Levels

| Level | Behavior | Use Case |
|-------|----------|----------|
| **Easy** | Defensive, makes obvious mistakes | New players, relaxed sessions |
| **Normal** | Tactical but imperfect | Standard D&D gameplay |
| **Hard** | Optimal tactical play | Experienced players, challenging encounters |
| **Deadly** | Ruthless efficiency | High-stakes encounters |
| **TPK** | Perfect meta-tactical play | Ultimate challenge mode |

### Advanced Settings

- **Number of Recommendations**: How many tactical options to generate (default: 3)
- **Include Player Names**: Whether to include PC names in recommendations
- **Context Memory**: Number of previous turns to remember (default: 3)
- **Request Timeout**: How long to wait for LLM response (default: 30 seconds)
- **Debug Mode**: Enable detailed logging for troubleshooting

### D&D Beyond Integration (Optional)

If you have the DDB Importer module and a D&D Beyond subscription:

1. Click "Configure DDB Importer" in module settings
2. Enable "Use DDB Importer"
3. Set Proxy URL: `https://proxy.ddb.mrprimate.co.uk`
4. Enter your Cobalt Session token from D&D Beyond cookies
5. Click **Save Configuration**

**Getting your Cobalt Session:**
1. Log in to [D&D Beyond](https://www.dndbeyond.com)
2. Press F12 → Application → Cookies
3. Find `CobaltSession` cookie and copy its value

## Usage

### Automatic Mode
When an NPC's turn begins:
1. Action Cache system loads pre-processed ability descriptions
2. Combat situation is analyzed (HP, positions, distances, conditions)
3. LLM generates tactical recommendations based on difficulty level
4. Recommendations appear in a dialog for the GM
5. GM selects and executes the chosen action

### Manual Mode
- Click **"Get AI Advice"** button in combat tracker
- Use the 🧠 brain icon in scene controls
- Request recommendations for any NPC at any time

### What the AI Considers
- **NPC Stats**: HP, AC, speed, conditions, available resources
- **Available Actions**: Pre-cached ability descriptions with damage, range, effects
- **Battlefield**: Enemy and ally positions, distances, cover
- **Combat Context**: Initiative order, recent actions, ally status
- **Difficulty**: Adjusts tactical sophistication and risk tolerance

## Cost Optimization

### Recommended Setup (Minimal Cost)
```
Action Cache: Local (llama3.2) - FREE
Combat LLM: OpenAI (gpt-4o-mini) - ~$0.15 per 1M tokens
```
**Estimated cost**: $0.02 - $0.10 per 3-hour session

### Performance Setup
```
Action Cache: OpenAI (gpt-4o-mini) - Fast processing
Combat LLM: OpenAI (o1 with high reasoning) - Best tactics
```
**Estimated cost**: $0.50 - $2.00 per 3-hour session

### Fully Free Setup
```
Action Cache: Local (llama3.2)
Combat LLM: Local (llama3.2:13b or larger)
```
**Estimated cost**: FREE (requires local LLM server)

## Troubleshooting

### No AI Recommendations Appearing
1. Check that "Enable AI Assistance" is turned on
2. Verify Combat LLM configuration has valid API key
3. Test connection in LLM configuration dialog
4. Check browser console (F12) for error messages
5. Try manual mode with "Get AI Advice" button

### Connection Errors
- **Cloud providers**: Verify internet connection and API key validity
- **Local LLMs**: Ensure server is running (`ollama serve` or LM Studio)
- **Timeout errors**: Increase timeout in advanced settings

### Poor Recommendations
- Adjust difficulty level to match desired complexity
- Verify NPC has proper stats and abilities
- Enable Debug Mode to see what data is being sent to LLM
- Check that Action Cache is working (console shows "Using cached actions")

### API Keys Not Persisting
- Keys are stored per-browser/per-device
- Re-enter keys on new devices or after clearing browser data
- Check browser console for migration messages
- Manually verify: `localStorage.getItem('dnd-combat-ai.combatLLM.apiKey')`

### Action Cache Not Working
- Verify Action Cache LLM is configured
- Check that combat has started (cache runs on `combatStart` hook)
- Enable Debug Mode to see cache status
- Check console for cache generation messages

## Development

### Requirements
- FoundryVTT v11+ (tested on v13)
- D&D 5e system v3.0+ (tested on v5.0.4)

### Module Structure
```
/scripts/
  ├── main.js              # Module initialization and hooks
  ├── combat-ai-manager.js # Core AI logic and coordination
  ├── combat-analyzer.js   # Combat situation analysis
  ├── llm-connector.js     # LLM API integration
  ├── settings.js          # Configuration management
  ├── action-cache.js      # Action caching system
  └── ui.js               # User interface components
/templates/
  ├── llm-config.hbs       # LLM configuration dialog
  └── ddb-importer-config.hbs # DDB integration settings
/styles/
  └── combat-ai.css       # Module styling
/lang/
  └── en.json            # Localization strings
```

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly in FoundryVTT
5. Submit a pull request

### API Reference

**Get LLM Configuration:**
```javascript
const config = CombatAISettings.getLLMConfig('combatRecommendation');
// or
const config = CombatAISettings.getLLMConfig('actionCache');
```

**Generate LLM Response:**
```javascript
const response = await llmConnector.generateResponse(
  prompt,
  'combatRecommendation' // or 'actionCache'
);
```

**Manage Action Cache:**
```javascript
// Get cached actions for an actor
const actions = await actionCache.getActorActions(actor, aiService);

// Clear cache for specific actor
actionCache.clearCache(actorId);

// Clear all cache
actionCache.clearCache();
```

## License

MIT License - see LICENSE file for details.

## Support

- **Issues**: [GitHub Issues](https://github.com/TheNightAngel17/foundry-vtt-dnd-combat-ai/issues)
- **Discussions**: [GitHub Discussions](https://github.com/TheNightAngel17/foundry-vtt-dnd-combat-ai/discussions)

---

*Created by Mitchell Lemons (@TheNightAngel17)*