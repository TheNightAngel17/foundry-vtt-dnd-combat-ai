# Testing Separate LLM Configurations

## Overview
This document provides test scenarios for the new separate LLM configuration feature.

## Feature Summary
- Two independent LLM configurations: Action Cache and Combat Recommendations
- Each config has its own provider, model, and settings
- Allows mixing local and cloud providers for optimal cost/performance

## Files Changed
- ✅ `scripts/settings.js` - Added menu registrations, hidden settings, getLLMConfig method
- ✅ `scripts/llm-connector.js` - Added configType parameter to generateResponse and all provider methods
- ✅ `scripts/action-cache.js` - Passes 'actionCache' to generateResponse
- ✅ `scripts/combat-ai-manager.js` - Passes 'combatRecommendation' to generateResponse
- ✅ `templates/llm-config.hbs` - NEW configuration dialog template
- ✅ `styles/combat-ai.css` - Added styling for llm-config-form
- ✅ `SEPARATE_LLM_CONFIGS.md` - NEW documentation

## Test Scenarios

### Test 1: Configuration UI Accessibility
**Steps:**
1. Open Foundry VTT and enable the module
2. Go to Game Settings → Configure Settings → D&D 5e Combat AI
3. Look for two new buttons:
   - "Action Cache LLM Configuration" (database icon)
   - "Combat Recommendation LLM Configuration" (brain icon)

**Expected Result:**
- Both buttons should be visible
- Clicking each should open a configuration dialog

### Test 2: Action Cache Configuration Dialog
**Steps:**
1. Click "Action Cache LLM Configuration" button
2. Verify dialog opens with title "Action Cache LLM Configuration"
3. Check provider dropdown has options: OpenAI, Anthropic, Local
4. Select each provider and verify correct fields appear

**Expected Result:**
- OpenAI: Shows API key, model, reasoning effort, max tokens
- Anthropic: Shows API key, model selection
- Local: Shows endpoint URL, model name
- Only selected provider's fields are visible

### Test 3: Combat Recommendation Configuration Dialog
**Steps:**
1. Click "Combat Recommendation LLM Configuration" button
2. Verify dialog opens with title "Combat Recommendation LLM Configuration"
3. Select different providers and verify fields

**Expected Result:**
- Same provider options and field structure as Action Cache dialog
- Settings are independent (changing one doesn't affect the other)

### Test 4: Save Settings
**Steps:**
1. Open Action Cache LLM Configuration
2. Select "Local" provider
3. Enter endpoint: `http://localhost:11434`
4. Enter model: `llama3.2`
5. Click "Save Configuration"
6. Close dialog
7. Reopen dialog

**Expected Result:**
- Settings should be persisted
- Dialog shows previously entered values
- Notification "Action Cache LLM Configuration saved successfully" appears

### Test 5: Independent Configurations
**Steps:**
1. Configure Action Cache: Local (llama3.2)
2. Configure Combat Recommendations: OpenAI (gpt-4o-mini with API key)
3. Verify both are saved independently
4. Open each dialog and confirm different settings

**Expected Result:**
- Each configuration maintains its own settings
- No cross-contamination between configs

### Test 6: Action Cache Uses Correct Config
**Steps:**
1. Set Action Cache to Local with debug mode ON
2. Start a combat with NPC
3. Check console for action cache generation messages
4. Verify it uses local endpoint

**Expected Result:**
Console should show:
- Action cache request going to local endpoint
- Using local model specified in Action Cache config
- NOT using Combat Recommendation settings

### Test 7: Combat Recommendations Use Correct Config
**Steps:**
1. Set Combat Recommendations to OpenAI with debug mode ON
2. Start a combat
3. Request AI recommendations for NPC turn
4. Check console for LLM request

**Expected Result:**
Console should show:
- Combat recommendation request going to OpenAI
- Using model specified in Combat Recommendation config
- NOT using Action Cache settings

### Test 8: Provider Switching
**Steps:**
1. Configure Action Cache for OpenAI
2. Start combat and verify action caching works
3. Change Action Cache to Local
4. Start new combat
5. Verify action caching now uses local

**Expected Result:**
- System correctly switches between providers
- No errors when changing providers
- Actions are re-cached with new provider

### Test 9: Error Handling - Missing API Key
**Steps:**
1. Set Action Cache to OpenAI
2. Leave API key blank
3. Save configuration
4. Start combat with NPC that needs action caching

**Expected Result:**
- Error message: "No API key configured for actionCache"
- System should fall back gracefully
- Raw actions might be used instead of LLM-optimized descriptions

### Test 10: Mixed Local/Cloud Setup
**Steps:**
1. Configure Action Cache: Local (llama3.2)
2. Configure Combat Recommendations: OpenAI (gpt-4o-mini)
3. Start combat with multiple NPCs
4. Let several NPC turns play out
5. Monitor console for requests

**Expected Result:**
- Action cache requests go to local endpoint
- Combat recommendation requests go to OpenAI
- Both work simultaneously without conflicts

## Edge Cases to Test

### EC1: No Local Server Running
**Setup:** Configure Action Cache for Local, but don't start Ollama
**Expected:** Error message about connection failure, fallback to raw actions

### EC2: Invalid API Key
**Setup:** Configure Combat Recommendations with fake OpenAI key
**Expected:** Error from OpenAI API, fallback to basic recommendations

### EC3: Extremely Long Model Name
**Setup:** Enter very long model name in Local config
**Expected:** Should save and attempt to use (may fail at runtime but won't crash)

### EC4: Special Characters in API Key
**Setup:** Use API key with special characters (which is valid)
**Expected:** Should handle correctly, no encoding issues

### EC5: Rapid Provider Changes
**Setup:** Quickly switch between providers multiple times
**Expected:** Settings should update correctly, no race conditions

## Performance Tests

### PT1: Action Cache Performance
**Metric:** Time to cache 10 actions
**Configurations to Test:**
- Local (llama3.2)
- OpenAI (gpt-4o-mini)
- Anthropic (Claude 3.5 Haiku)

### PT2: Token Usage Tracking
**Test:** Run 5 combats with each configuration
**Track:** 
- Number of API calls to each provider
- Confirm separation (cache calls don't use combat config)

## Debugging Checklist

If something doesn't work:
1. ✅ Check browser console for JavaScript errors
2. ✅ Enable Debug Mode in module settings
3. ✅ Verify `game.settings.get(MODULE_ID, 'actionCacheLLMProvider')` returns expected value
4. ✅ Verify `game.settings.get(MODULE_ID, 'combatLLMProvider')` returns expected value
5. ✅ Check that LLMConfigMenu class is defined
6. ✅ Verify template file exists at correct path
7. ✅ Check CSS is loaded for dialog styling

## Success Criteria

All tests should pass with:
- ✅ Both configuration dialogs open and function
- ✅ Settings save and persist correctly
- ✅ Action Cache uses actionCacheLLM* settings
- ✅ Combat Recommendations use combatLLM* settings
- ✅ No cross-contamination between configs
- ✅ Proper error handling for missing/invalid settings
- ✅ UI is clear and user-friendly

## Known Limitations

1. **No Migration:** Existing users will need to reconfigure both LLM settings
2. **No Defaults:** First-time users must configure both before using AI features
3. **No Validation:** Dialog doesn't test connection before saving
