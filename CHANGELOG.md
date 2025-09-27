# Changelog

All notable changes to the D&D Combat AI module will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-01-XX

### Added
- Initial release of D&D Combat AI module
- AI-powered NPC combat assistance with LLM integration
- Support for multiple difficulty levels:
  - Easy: Defensive, suboptimal play
  - Normal: Tactical but imperfect decisions
  - Hard: Optimal tactical play
  - Deadly: Ruthless efficiency
  - TPK: Perfect meta-tactical play
- Multi-provider LLM support:
  - OpenAI (GPT-3.5 Turbo, GPT-4, GPT-4 Turbo)
  - Anthropic (Claude 3 Haiku, Sonnet, Opus)
  - Local LLMs (Ollama, LM Studio, etc.)
- Automatic combat turn detection for NPCs
- Manual AI assistance via combat tracker button
- Comprehensive combat situation analysis:
  - NPC stats and abilities
  - Enemy and ally positions
  - Available actions and resources
  - Battlefield conditions
  - Combat history context
- Settings dialog with connection testing
- Combat tracker integration with quick difficulty controls
- Scene controls integration for easy access
- Responsive UI with FoundryVTT theming
- Full localization support (English)
- Debug mode for troubleshooting

### Features
- Automatic NPC turn detection via Foundry combat hooks
- Context-aware combat analysis including positioning, resources, and abilities
- Intelligent action prioritization based on difficulty settings
- Fallback recommendations when LLM requests fail
- Real-time difficulty adjustment during combat
- Connection testing and validation for all LLM providers
- Comprehensive error handling and user feedback
- Mobile-responsive design
- Dark mode compatibility

### Technical
- ES6 module architecture
- Compatible with FoundryVTT v11-13
- Requires D&D 5e system v3.0+
- Optimized API usage with configurable timeouts
- Secure API key storage
- Extensible provider system for future LLM additions

### Documentation
- Comprehensive README with setup instructions
- API cost estimates for cloud providers
- Troubleshooting guide
- Development setup guide
- Example AI responses for each difficulty level