# Actor Actions Dialog Implementation

## Overview
Added a complete UI system for managing LLM-generated action descriptions directly from NPC character sheets.

## Files Created/Modified

### New Files:
1. **`scripts/actor-actions-dialog.js`** - Dialog class for managing actor actions
2. **`templates/actor-actions-dialog.hbs`** - Handlebars template for the dialog UI

### Modified Files:
1. **`scripts/action-cache.js`** - Renamed from `ActionCache` to `ActorLlmActions`
2. **`scripts/combat-ai-manager.js`** - Updated to use `actorLlmActions` instead of `actionCache`
3. **`scripts/combat-analyzer.js`** - Updated to use `actorLlmActions`
4. **`scripts/main.js`** - Added imports, Handlebars helper, and character sheet hook
5. **`styles/combat-ai.css`** - Added comprehensive styling for the dialog

## Features

### Dialog Functionality:
- **View Actions**: See all currently cached actions for an actor
- **Add Actions**: Manually add new actions with custom properties
- **Edit Actions**: Modify name, description, activation time, and item type
- **Delete Actions**: Remove unwanted actions with confirmation
- **Generate with AI**: Clear cache and regenerate all actions using LLM
- **Save Changes**: Persist modifications to actor flags
- **Unsaved Changes Warning**: Prompts user before closing with unsaved changes

### Action Properties:
Each action has:
- **Name**: The action's display name
- **Description**: Tactical description for AI decision-making (max 200 chars)
- **Activation Time**: action/bonus/reaction/legendary/lair/mythic/special
- **Item Type**: weapon/spell/feat

### Access:
- A "AI Actions" button appears on NPC character sheets (in the header area)
- Only visible for NPCs (not player-owned actors)
- Button opens the management dialog

## How to Use

1. **Open an NPC Character Sheet**
2. **Click the "AI Actions" button** (with brain icon)
3. **In the dialog you can:**
   - Click "Generate with AI" to auto-generate actions from actor data
   - Click "Add Action" to manually create a new action
   - Edit any field directly in the form
   - Click the trash icon to delete an action
   - Click "Save Changes" to persist to actor flags

## Technical Details

### Data Storage:
- Actions are stored in actor flags at `MODULE_ID.cachedActions`
- Flag structure:
  ```javascript
  {
    actions: [...],      // Array of action objects
    timestamp: 123456,   // When generated/saved
    version: '1.0'       // For future migrations
  }
  ```

### Persistence:
- No more in-memory cache - all data reads/writes from actor flags
- Survives Foundry reloads automatically
- Can be exported/imported with actors

### Integration:
- Fully integrated with existing `ActorLlmActions` class
- Uses same LLM generation logic as before
- Compatible with DDB Importer fallback

## Benefits

1. **User Control**: GMs can now review and modify AI-generated actions
2. **Manual Entry**: Can add custom actions without LLM
3. **Transparency**: See exactly what the AI is working with
4. **Persistence**: No need to regenerate on every reload
5. **Flexibility**: Mix AI-generated and manually-entered actions
