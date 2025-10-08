# Simplified LLM Settings

## Overview

The LLM configuration has been simplified to use **shared settings** across all providers instead of having separate settings for each provider.

## Changes Made

### Before (16 Settings per Config Type)
Each config type (Action Cache, Combat Recommendation) had:
- `Provider` (openai/anthropic/local)
- `ApiKey`
- `OpenAIModel`
- `OpenAIReasoningEffort`
- `OpenAIMaxTokens`
- `AnthropicModel`
- `LocalEndpoint`
- `LocalModel`

**Total: 16 settings (8 per config type)**

### After (12 Settings Total)
Each config type now has:
- `Provider` (openai/anthropic/local)
- `ApiKey` (used by OpenAI and Anthropic, ignored by Local)
- `Model` (universal - works for all providers)
- `MaxTokens` (universal - works for all providers)
- `ReasoningEffort` (used by OpenAI O1 models, ignored by others)
- `LocalEndpoint` (used by Local only, ignored by others)

**Total: 12 settings (6 per config type)**

## Benefits

### 1. **Simpler Configuration**
- Single "Model" field instead of separate OpenAIModel, AnthropicModel, LocalModel
- Single "MaxTokens" field instead of separate OpenAIMaxTokens
- Less redundancy = easier to understand

### 2. **Flexible Model Names**
Users can now enter:
- Any OpenAI model: `gpt-4o-mini`, `gpt-4o`, `o1-mini`, `o1`, future models, etc.
- Any Anthropic model: `claude-3-5-haiku-20241022`, `claude-3-5-sonnet-20241022`, etc.
- Any local model: `llama3.2`, `llama3.2:13b`, `mistral`, `codellama`, custom models
- **No hardcoded dropdown limitations**

### 3. **Provider-Specific Fields**
The UI intelligently shows/hides fields based on selected provider:
- **OpenAI**: Shows API Key, Model, MaxTokens, ReasoningEffort
- **Anthropic**: Shows API Key, Model, MaxTokens
- **Local**: Shows Model, MaxTokens, LocalEndpoint

### 4. **Easier to Extend**
Adding a new provider only requires:
- Adding provider to dropdown
- Implementing the provider call method
- No need to add multiple new settings

## Settings Structure

### Action Cache LLM
```
actionCacheLLMProvider: 'local' (default)
actionCacheLLMApiKey: ''
actionCacheLLMModel: 'llama3.2' (default)
actionCacheLLMMaxTokens: 1000
actionCacheLLMReasoningEffort: 'low'
actionCacheLLMLocalEndpoint: 'http://localhost:11434'
```

### Combat Recommendation LLM
```
combatLLMProvider: 'openai' (default)
combatLLMApiKey: ''
combatLLMModel: 'gpt-4o-mini' (default)
combatLLMMaxTokens: 2000
combatLLMReasoningEffort: 'medium'
combatLLMLocalEndpoint: 'http://localhost:11434'
```

## UI Improvements

### Model Input Field
- Text input with `datalist` for suggestions
- Suggestions change based on provider:
  - OpenAI: gpt-4o-mini, gpt-4o, o1-mini, o1
  - Anthropic: claude-3-5-haiku-20241022, claude-3-5-sonnet-20241022, claude-opus-4-20250514
  - Local: llama3.2, llama3.2:13b, mistral, codellama
- Users can type any model name, not limited to suggestions

### Dynamic Form Sections
JavaScript toggles visibility:
```javascript
- API Key: Hidden when provider = 'local'
- Reasoning Effort: Hidden when provider != 'openai'
- Local Endpoint: Hidden when provider != 'local'
```

### Help Text
Context-aware help text changes based on provider:
- OpenAI: "Examples: gpt-4o-mini, gpt-4o, o1-mini, o1"
- Anthropic: "Examples: claude-3-5-haiku-20241022, claude-3-5-sonnet-20241022..."
- Local: "Model name from your local server (e.g., llama3.2, mistral)"

## Code Changes

### Files Modified
1. **scripts/settings.js**
   - Reduced settings registrations from 16 to 12
   - Updated `getLLMConfig()` to return simplified structure
   - Updated `LLMConfigMenu.getData()` to load simplified settings
   - Updated `LLMConfigMenu._updateObject()` to save simplified settings
   - Updated `activateListeners()` to handle dynamic field visibility

2. **templates/llm-config.hbs**
   - Replaced provider-specific sections with universal fields
   - Added `datalist` for model suggestions
   - Dynamic show/hide of optional fields
   - Context-aware placeholders and help text

3. **scripts/llm-connector.js**
   - Updated `callOpenAI()` to use `${prefix}Model` instead of `${prefix}OpenAIModel`
   - Updated `callAnthropic()` to use `${prefix}Model` instead of `${prefix}AnthropicModel`
   - Updated `callLocalLLM()` to use `${prefix}Model` instead of `${prefix}LocalModel`
   - All methods now use `${prefix}MaxTokens` uniformly

## Migration Notes

### For Existing Installations
Users will need to reconfigure their LLM settings because:
- Old setting names (e.g., `actionCacheLLMOpenAIModel`) no longer exist
- New setting names (e.g., `actionCacheLLMModel`) are used instead
- **No automatic migration** - intentional clean break for simplicity

### Default Values
- Action Cache: Local provider, llama3.2 model, 1000 tokens
- Combat Recommendations: OpenAI provider, gpt-4o-mini model, 2000 tokens
- Both: Low/Medium reasoning effort, localhost:11434 for local endpoint

## Example Configurations

### Configuration 1: Local Cache + OpenAI Combat
```
Action Cache:
  Provider: local
  Model: llama3.2
  MaxTokens: 1000
  LocalEndpoint: http://localhost:11434

Combat Recommendations:
  Provider: openai
  ApiKey: sk-...
  Model: gpt-4o-mini
  MaxTokens: 2000
  ReasoningEffort: medium
```

### Configuration 2: Anthropic Everything
```
Action Cache:
  Provider: anthropic
  ApiKey: sk-ant-...
  Model: claude-3-5-haiku-20241022
  MaxTokens: 1000

Combat Recommendations:
  Provider: anthropic
  ApiKey: sk-ant-...
  Model: claude-3-5-sonnet-20241022
  MaxTokens: 3000
```

### Configuration 3: All Local
```
Action Cache:
  Provider: local
  Model: llama3.2
  MaxTokens: 800
  LocalEndpoint: http://localhost:11434

Combat Recommendations:
  Provider: local
  Model: llama3.2:13b
  MaxTokens: 1500
  LocalEndpoint: http://localhost:11434
```

### Configuration 4: Advanced OpenAI
```
Action Cache:
  Provider: openai
  ApiKey: sk-...
  Model: gpt-4o-mini
  MaxTokens: 1000
  ReasoningEffort: low

Combat Recommendations:
  Provider: openai
  ApiKey: sk-...
  Model: o1
  MaxTokens: 4000
  ReasoningEffort: high
```

## Testing Checklist

- [ ] Open Action Cache LLM Configuration dialog
- [ ] Verify provider dropdown works (OpenAI, Anthropic, Local)
- [ ] Switch providers and verify correct fields show/hide
- [ ] Enter model name manually (not using dropdown)
- [ ] Save configuration and reopen to verify persistence
- [ ] Repeat for Combat Recommendation LLM Configuration
- [ ] Test actual LLM calls with each provider
- [ ] Verify model name is used correctly in API calls
- [ ] Verify maxTokens is respected
- [ ] Verify reasoningEffort works for O1 models (OpenAI only)

## Backward Compatibility

**Breaking Change**: This is a breaking change for users who have already configured their LLM settings.

**Impact**: Users will see empty/default values in the new configuration dialogs and will need to reconfigure.

**Mitigation**: Clear documentation and sensible defaults minimize impact.

## Future Enhancements

Potential improvements:
- Add "Test Connection" button in the dialog
- Auto-detect available local models from Ollama API
- Validate model name format before saving
- Add temperature/top_p advanced settings
- Show estimated cost per token for cloud providers
