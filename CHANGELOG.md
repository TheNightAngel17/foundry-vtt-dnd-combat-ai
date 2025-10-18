# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2025-xx-xx

### Added
- Initial release of D&D Combat AI module for FoundryVTT
- AI-powered NPC combat assistance using Large Language Models
- Five difficulty levels: Easy, Normal, Hard, Deadly, and TPK mode
- Dual LLM configuration system:
  - Separate Action Cache LLM for pre-processing NPC abilities
  - Separate Combat Recommendation LLM for real-time tactical decisions
- Multi-provider LLM support:
  - OpenAI (GPT-4o-mini, GPT-4o, O1-mini, O1 with reasoning effort control)
  - Anthropic (Claude 3.5 Haiku, Claude 3.5 Sonnet, Claude Opus 4)
  - Local LLM servers (Ollama, LM Studio, custom endpoints)
- Intelligent action cache system:
  - Pre-caches NPC abilities at combat start
  - LLM-processed concise tactical descriptions
  - 1-hour cache timeout with automatic cleanup
  - Parallel processing for multiple NPCs
  - 80-90% reduction in token usage during combat
- D&D Beyond Importer integration:
  - Optional DDB proxy support for rich monster data
  - Automatic fallback to local parsing
  - Cobalt session authentication
- Enhanced security features:
  - API keys stored in browser localStorage
  - Keys never saved in world database
  - Automatic migration from legacy storage
  - Per-device/per-browser configuration
- Automatic NPC turn detection via combat hooks
- Manual AI assistance via combat tracker button
- Comprehensive combat situation analysis:
  - NPC stats, conditions, and resources
  - Available actions with damage, range, and effects
  - Enemy and ally positions and distances
  - Battlefield conditions and terrain
  - Combat history context
- Settings configuration:
  - Separate LLM configuration dialogs
  - Connection testing for all providers
  - Difficulty adjustment during combat
  - Customizable number of recommendations
  - Context memory (turn history)
  - Request timeout settings
  - Debug mode for troubleshooting
- Combat tracker UI integration:
  - Difficulty dropdown
  - "Get AI Advice" button
  - Status indicators
- Scene controls integration with brain icon
- Mobile-responsive design
- Dark mode compatibility
- Full localization support (English)
- Comprehensive documentation and examples

### Changed
- N/A (initial release)

### Deprecated
- N/A (initial release)

### Removed
- N/A (initial release)

### Fixed
- N/A (initial release)

### Security
- API keys stored in browser localStorage instead of world database
- Keys are not included in world exports
- Automatic migration from legacy game settings storage

---
