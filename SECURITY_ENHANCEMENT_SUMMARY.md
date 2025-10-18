# Security Enhancement: localStorage for API Keys

## Summary

This update moves API keys from Foundry VTT game settings to browser localStorage, enhancing security by preventing API keys from being saved in the world database.

## Files Modified

### 1. `scripts/settings.js`
- **Added** `STORAGE_KEYS` constant with localStorage key names
- **Added** `setSecureValue(key, value)` - Store sensitive data in localStorage
- **Added** `getSecureValue(key)` - Retrieve sensitive data from localStorage
- **Added** `migrateAPIKeysToLocalStorage()` - One-time migration of existing keys
- **Removed** `actionCacheLLMApiKey` setting registration
- **Removed** `combatLLMApiKey` setting registration
- **Updated** `getLLMConfig()` - Now reads API keys from localStorage
- **Updated** `getData()` in LLMConfigMenu - Reads API keys from localStorage
- **Updated** `_updateObject()` in LLMConfigMenu - Writes API keys to localStorage

### 2. `scripts/llm-connector.js`
- **Added** Import of `CombatAISettings`
- **Updated** `generateResponse()` - Retrieves API keys from localStorage via `CombatAISettings.getSecureValue()`

### 3. `scripts/main.js`
- **Updated** `ready` hook - Calls `CombatAISettings.migrateAPIKeysToLocalStorage()` on initialization

### 4. `API_KEY_SECURITY.md` (New)
- Comprehensive documentation of the security enhancement
- Usage guide for developers
- Migration details
- Troubleshooting information

## Key Changes

### Before
```javascript
// Stored in game settings
const apiKey = game.settings.get(MODULE_ID, 'actionCacheLLMApiKey');
await game.settings.set(MODULE_ID, 'actionCacheLLMApiKey', newKey);
```

### After
```javascript
// Stored in localStorage
const apiKey = CombatAISettings.getSecureValue(
    CombatAISettings.STORAGE_KEYS.ACTION_CACHE_API_KEY
);
CombatAISettings.setSecureValue(
    CombatAISettings.STORAGE_KEYS.ACTION_CACHE_API_KEY, 
    newKey
);
```

## Security Benefits

1. ✅ API keys NOT saved in world database
2. ✅ API keys NOT included in world exports
3. ✅ Reduced risk of accidental exposure
4. ✅ Keys stored per-device/per-browser
5. ✅ Automatic migration from old storage

## Testing Checklist

- [ ] Module loads without errors
- [ ] Migration runs successfully on first load
- [ ] Existing API keys are migrated to localStorage
- [ ] New API keys can be saved via settings UI
- [ ] API keys are retrieved correctly by LLM connector
- [ ] Settings UI displays current API keys correctly
- [ ] LLM requests work with localStorage-based keys
- [ ] Console shows migration messages (if applicable)

## User Communication

### Breaking Changes
- **None** - Automatic migration handles existing setups

### User Action Required
- **Multi-device users**: Need to re-enter API keys on each device
- **After world export/import**: Need to re-enter API keys

### Release Notes
```markdown
### Security Enhancement: API Keys in localStorage

API keys are now stored in browser localStorage instead of the world database for enhanced security. This prevents API keys from being accidentally exposed through world exports or database backups.

**What you need to know:**
- Existing API keys will be automatically migrated
- No action required for single-device setups
- If using multiple devices, re-enter API keys on each device
- API keys will NOT be included in world exports (re-enter after import)
```

## Rollback Plan

If issues arise, revert these changes and restore the old behavior:

1. Restore `actionCacheLLMApiKey` and `combatLLMApiKey` settings registration
2. Update `getLLMConfig()` to read from game settings
3. Update `getData()` and `_updateObject()` to use game settings
4. Update `llm-connector.js` to read from game settings
5. Remove migration call from `main.js`

## Future Enhancements

Consider for future versions:
1. Encrypt API keys in localStorage
2. Optional password protection for API keys
3. Key rotation reminders
4. Export/import API keys securely (with encryption)
