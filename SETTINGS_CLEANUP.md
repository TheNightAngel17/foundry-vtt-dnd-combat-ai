# Settings Cleanup - Removed Legacy LLM Settings

## What Was Removed

The following **legacy settings** have been removed from the module as they are now replaced by the new dual LLM configuration system:

### Removed Settings (9 total):

1. **llmProvider** - Main LLM provider selection
2. **apiKey** - Main API key field
3. **openaiModel** - OpenAI model selection (dropdown)
4. **openaiReasoningEffort** - OpenAI reasoning effort (dropdown)
5. **openaiMaxCompletionTokens** - OpenAI max tokens (number)
6. **anthropicModel** - Anthropic model selection (dropdown)
7. **localLLMEndpoint** - Local LLM endpoint URL
8. **localLLMModel** - Local LLM model name

### Removed Methods:

- **onProviderChange()** - No longer needed with menu-based configuration

## What Replaced Them

The old single LLM configuration has been replaced with **two separate LLM configurations**:

### Action Cache LLM (6 settings):
- `actionCacheLLMProvider` - Provider selection
- `actionCacheLLMApiKey` - API key
- `actionCacheLLMModel` - Universal model field
- `actionCacheLLMMaxTokens` - Token limit
- `actionCacheLLMReasoningEffort` - Reasoning effort (O1 models)
- `actionCacheLLMLocalEndpoint` - Local endpoint

### Combat Recommendation LLM (6 settings):
- `combatLLMProvider` - Provider selection
- `combatLLMApiKey` - API key
- `combatLLMModel` - Universal model field
- `combatLLMMaxTokens` - Token limit
- `combatLLMReasoningEffort` - Reasoning effort (O1 models)
- `combatLLMLocalEndpoint` - Local endpoint

## Benefits of the New System

### 1. Cleaner UI
- Old: 9 visible settings cluttering the main settings page
- New: 2 configuration buttons that open dedicated dialogs

### 2. More Flexible
- Old: Separate dropdowns for each provider's models
- New: Universal text field accepts any model name (future-proof)

### 3. Better Organization
- Old: All LLM settings mixed with general module settings
- New: LLM configs are hidden (`config: false`) and accessed via menu buttons

### 4. Independent Configurations
- Old: One LLM config for everything
- New: Separate configs for action caching vs combat recommendations

### 5. Updated Validation
- Old: Checked `settings.llmProvider` and `settings.apiKey`
- New: Validates both `actionCache` and `combatRecommendation` configs separately

## Migration Path

### For Existing Users:
Existing users will need to:
1. Open **Action Cache LLM Configuration** button
2. Configure their preferred provider/model for action caching
3. Open **Combat Recommendation LLM Configuration** button
4. Configure their preferred provider/model for combat recommendations

### Default Configuration:
- **Action Cache**: Local (llama3.2) - Fast and free
- **Combat Recommendations**: OpenAI (gpt-4o-mini) - Powerful and affordable

## Code Changes

### Files Modified:
- `scripts/settings.js` - Removed 104 lines of legacy settings code
- `scripts/settings.js` - Updated `getAllSettings()` to only return non-LLM settings
- `scripts/settings.js` - Updated `validateSettings()` to check both LLM configs
- `scripts/settings.js` - Removed `onProviderChange()` method

### Settings Count:
- **Before**: 23 total settings (14 general + 9 LLM)
- **After**: 20 total settings (8 general + 12 LLM hidden)
- **Net Change**: 3 fewer settings, but more organized

## Remaining Settings (Visible)

The following settings are still visible in the main configuration:

### General Settings (8):
1. Enable AI Assistance
2. AI Difficulty Level
3. Auto-display Recommendations
4. Number of Recommendations
5. Include Player Names
6. Context Memory (Turns)
7. Request Timeout
8. Debug Mode

### LLM Configuration Menus (2):
1. Action Cache LLM Settings (button)
2. Combat Recommendation LLM Settings (button)

## Testing Checklist

After this cleanup:
- ✅ No compile errors
- ✅ Old settings no longer appear in UI
- ✅ New LLM config buttons work
- ✅ Settings validation checks both configs
- ✅ `getAllSettings()` doesn't reference removed settings
- ✅ No references to `llmProvider` or `apiKey` in settings.js

## Breaking Changes

⚠️ **Important**: This is a breaking change for existing users!

Old settings will be ignored. Users must reconfigure LLMs using the new menu system.

Consider adding a migration message or one-time notification when users first load the updated module.
