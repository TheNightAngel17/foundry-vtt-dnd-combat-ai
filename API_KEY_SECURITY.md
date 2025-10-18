# API Key Security Enhancement

## Overview

API keys and other sensitive values are now stored in **browser localStorage** instead of Foundry VTT's game settings to enhance security. This prevents API keys from being saved in the world database and reduces the risk of accidental exposure.

## What Changed

### Before
- API keys were stored in game settings (`game.settings`)
- Keys were saved in the world database
- Keys could potentially be exported with world data

### After
- API keys are stored in browser localStorage
- Keys are stored locally per-browser/per-device
- Keys are NOT saved in the world database
- Keys are NOT exported with world data

## Affected Settings

The following settings are now stored in localStorage:

1. **Action Cache LLM API Key** - `dnd-combat-ai.actionCacheLLM.apiKey`
2. **Combat Recommendation LLM API Key** - `dnd-combat-ai.combatLLM.apiKey`

## Migration

When the module loads, it automatically migrates existing API keys from game settings to localStorage:

1. Reads API keys from old game settings
2. Stores them securely in localStorage
3. Clears the keys from game settings
4. Logs migration actions to console

This migration runs automatically on module initialization and is safe to run multiple times.

## Using the API

### Storing an API Key

```javascript
import { CombatAISettings } from './settings.js';

// Store an API key
CombatAISettings.setSecureValue(
    CombatAISettings.STORAGE_KEYS.COMBAT_API_KEY,
    'your-api-key-here'
);
```

### Retrieving an API Key

```javascript
import { CombatAISettings } from './settings.js';

// Retrieve an API key
const apiKey = CombatAISettings.getSecureValue(
    CombatAISettings.STORAGE_KEYS.COMBAT_API_KEY
);
```

### Available Storage Keys

```javascript
CombatAISettings.STORAGE_KEYS = {
    ACTION_CACHE_API_KEY: 'dnd-combat-ai.actionCacheLLM.apiKey',
    COMBAT_API_KEY: 'dnd-combat-ai.combatLLM.apiKey'
};
```

## User Impact

### For Users
- **First-time setup**: Enter API keys in module settings as before
- **Existing users**: API keys are automatically migrated on first load after update
- **Multiple devices**: Need to enter API keys separately on each device/browser
- **World export/import**: API keys will NOT be included (need to re-enter)

### For Developers
- Use `CombatAISettings.getSecureValue()` to retrieve API keys
- Use `CombatAISettings.setSecureValue()` to store API keys
- Never store API keys in game settings directly
- API keys are retrieved from localStorage by `getLLMConfig()`

## Security Considerations

### Benefits
✅ API keys not saved in world database
✅ API keys not included in world exports
✅ Reduces risk of accidental exposure
✅ Keys stored per-device/per-browser

### Limitations
⚠️ localStorage is still accessible via browser dev tools
⚠️ Not encrypted in browser localStorage
⚠️ Users must re-enter keys on new devices
⚠️ Browser cache clearing will remove keys

### Best Practices
- Always use environment-specific API keys (dev vs production)
- Regularly rotate API keys
- Use API key restrictions when available (IP, domain, rate limits)
- Never commit API keys to version control
- Educate users on API key security

## Technical Details

### localStorage Keys

```
dnd-combat-ai.actionCacheLLM.apiKey
dnd-combat-ai.combatLLM.apiKey
```

### Code Changes

1. **settings.js**
   - Added `STORAGE_KEYS` constant
   - Added `setSecureValue()` method
   - Added `getSecureValue()` method
   - Added `migrateAPIKeysToLocalStorage()` method
   - Removed API key settings registration
   - Updated `getLLMConfig()` to read from localStorage
   - Updated `getData()` and `_updateObject()` in LLMConfigMenu

2. **llm-connector.js**
   - Updated `generateResponse()` to read API keys from localStorage via `CombatAISettings`

3. **main.js**
   - Added migration call in `ready` hook

## Troubleshooting

### API Keys Not Working After Update

1. Check browser console for migration messages
2. Re-enter API keys in module settings
3. Verify localStorage in browser dev tools:
   ```javascript
   localStorage.getItem('dnd-combat-ai.combatLLM.apiKey')
   localStorage.getItem('dnd-combat-ai.actionCacheLLM.apiKey')
   ```

### Clearing Stored API Keys

To manually clear API keys from localStorage:

```javascript
localStorage.removeItem('dnd-combat-ai.combatLLM.apiKey');
localStorage.removeItem('dnd-combat-ai.actionCacheLLM.apiKey');
```

Or use the helper method:

```javascript
CombatAISettings.setSecureValue(CombatAISettings.STORAGE_KEYS.COMBAT_API_KEY, '');
CombatAISettings.setSecureValue(CombatAISettings.STORAGE_KEYS.ACTION_CACHE_API_KEY, '');
```

## Future Enhancements

Potential improvements for future versions:

1. **Encryption**: Encrypt API keys in localStorage
2. **Password protection**: Require password to access stored keys
3. **Secure storage APIs**: Use browser's secure storage if available
4. **Key management UI**: Better interface for managing multiple keys
5. **Expiration**: Optional key expiration for additional security
