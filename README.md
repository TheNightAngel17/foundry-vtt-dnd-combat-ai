# D&D Combat AI for FoundryVTT

An intelligent FoundryVTT module that provides AI-powered combat assistance for NPCs in D&D 5e games. This module uses Large Language Models (LLMs) to generate tactical recommendations based on combat situation analysis and customizable difficulty settings.

## Features

### 🧠 AI-Powered NPC Combat
- Automatically detects NPC turns and provides intelligent action recommendations
- Context-aware analysis of battlefield conditions, enemy positions, and available abilities
- Supports multiple difficulty levels from Easy to TPK mode

### 🎯 Difficulty-Based Tactics
- **Easy**: Defensive play with suboptimal choices
- **Normal**: Tactical but imperfect decision making
- **Hard**: Optimal use of abilities and positioning
- **Deadly**: Ruthless efficiency with advanced tactics
- **TPK Mode**: Perfect tactical play with meta-knowledge

### 🔌 Multiple LLM Providers
- **OpenAI (ChatGPT)**: GPT-3.5 Turbo, GPT-4, and GPT-4 Turbo models
- **Anthropic (Claude)**: Claude 3 Haiku, Sonnet, and Opus models  
- **Local LLMs**: Support for Ollama, LM Studio, and other local endpoints

### 🎮 Seamless Integration
- Automatic combat turn detection
- Quick-access difficulty controls in combat tracker
- Manual AI assistance button for current NPCs
- Comprehensive settings dialog with connection testing

## Installation

1. **Install from Foundry**: Search for "D&D Combat AI" in the Add-on Modules tab
2. **Manual Installation**: Use this manifest URL:
   ```
   https://github.com/TheNightAngel17/foundry-vtt-dnd-combat-ai/releases/latest/download/module.json
   ```

## Quick Setup

1. **Enable the Module**: Activate "D&D Combat AI" in your world's module settings
2. **Configure API**: Go to Module Settings and:
   - Choose your LLM provider (OpenAI, Anthropic, or Local)
   - Enter your API key (for cloud providers)
   - Test the connection
3. **Set Difficulty**: Choose your preferred AI difficulty level
4. **Start Playing**: The AI will automatically provide recommendations during NPC turns

## Configuration

### LLM Provider Setup

#### OpenAI Setup
1. Get an API key from [OpenAI Platform](https://platform.openai.com/)
2. Select your preferred model (GPT-3.5 Turbo recommended for speed/cost)
3. Enter the API key in module settings

#### Anthropic Setup  
1. Get an API key from [Anthropic Console](https://console.anthropic.com/)
2. Select your preferred Claude model
3. Enter the API key in module settings

#### Local LLM Setup
1. Install a local LLM server like [Ollama](https://ollama.ai/) or [LM Studio](https://lmstudio.ai/)
2. Configure the endpoint URL (default: http://localhost:11434)
3. Specify the model name you want to use

### Difficulty Levels Explained

| Level | Behavior | Use Case |
|-------|----------|----------|
| **Easy** | Defensive, makes obvious mistakes | New players, relaxed sessions |
| **Normal** | Tactical but imperfect | Standard D&D gameplay |
| **Hard** | Optimal tactical play | Experienced players, challenging encounters |
| **Deadly** | Ruthless efficiency | High-stakes encounters |
| **TPK** | Perfect meta-tactical play | Ultimate challenge mode |

## Usage

### Automatic Mode
- Combat AI automatically activates when an NPC's turn begins
- Recommendations appear in a dialog box for the GM
- Quick difficulty adjustment available in combat tracker

### Manual Mode
- Click "Get AI Advice" button in combat tracker
- Use the brain icon in scene controls to access settings
- Request recommendations for any NPC at any time

### What the AI Considers
- **Current NPC Stats**: HP, AC, speed, conditions, available resources
- **Available Actions**: Attacks, spells, class features, and special abilities
- **Battlefield Analysis**: Enemy positions, distances, cover, and terrain
- **Combat Context**: Initiative order, recent actions, ally status
- **Difficulty Setting**: Adjusts tactical sophistication accordingly

## Examples

**Easy Difficulty Response:**
```
1. [Basic Attack] - Simple melee strike, avoiding complex tactics
2. [Move to Safety] - Defensive repositioning away from threats
3. [Dodge Action] - Focus on survival over offense
```

**Deadly Difficulty Response:**
```
1. [Multi-attack Weakest PC] - Eliminate the unconscious rogue to force death saves
2. [Legendary Action Movement] - Position for flanking and opportunity attacks
3. [Counterspell] - Ready action to counter the wizard's next spell
```

## Troubleshooting

### Common Issues

**No AI Recommendations Appearing**
- Check that AI assistance is enabled in settings
- Verify API key is correctly configured
- Test connection in settings dialog
- Check console for error messages

**Connection Errors**
- Verify internet connection for cloud providers
- Check API key validity and billing status
- For local LLMs, ensure server is running and accessible

**Poor Recommendations**
- Try adjusting the difficulty level
- Check if NPC has proper stats and abilities configured
- Verify the AI has sufficient context about the combat situation

### API Costs

**OpenAI Estimated Costs (per request):**
- GPT-3.5 Turbo: ~$0.001-0.002
- GPT-4: ~$0.01-0.02
- GPT-4 Turbo: ~$0.005-0.01

**Anthropic Estimated Costs (per request):**
- Claude 3 Haiku: ~$0.001-0.002
- Claude 3 Sonnet: ~$0.005-0.01  
- Claude 3 Opus: ~$0.02-0.04

**Local LLMs**: Free after initial setup

## Development

### Requirements
- FoundryVTT v11+ (tested on v13)
- D&D 5e system v3.0+ (tested on v5.0.4)

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly in FoundryVTT
5. Submit a pull request

### Module Structure
```
/scripts/
  ├── main.js              # Module initialization and hooks
  ├── combat-ai-manager.js # Core AI logic and coordination
  ├── combat-analyzer.js   # Combat situation analysis
  ├── llm-connector.js     # LLM API integration
  ├── settings.js          # Configuration management
  └── ui.js               # User interface components
/styles/
  └── combat-ai.css       # Module styling
/lang/
  └── en.json            # Localization strings
```

## Changelog

### v1.0.0
- Initial release
- Support for OpenAI, Anthropic, and local LLMs
- Five difficulty levels with distinct behaviors
- Automatic and manual AI recommendation modes
- Comprehensive combat situation analysis
- Full FoundryVTT v13 and D&D 5e v5.0+ compatibility

## License

MIT License - see LICENSE file for details.

## Support

- **Issues**: [GitHub Issues](https://github.com/TheNightAngel17/foundry-vtt-dnd-combat-ai/issues)
- **Discussions**: [GitHub Discussions](https://github.com/TheNightAngel17/foundry-vtt-dnd-combat-ai/discussions)

---

*Created by Mitchell Lemons (@TheNightAngel17)*