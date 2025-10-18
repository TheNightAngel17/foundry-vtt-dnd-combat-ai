# Turn Description Tracker Implementation

## Overview
Implemented a turn description tracker that prompts the Game Master after every turn to document what happened during that turn. The system automatically tracks state changes and pre-fills them in the description dialog.

## Features Implemented

### 1. **Turn Tracker Module** (`scripts/turn-tracker.js`)
A new module that handles:
- **State Snapshots**: Captures actor state at the end of each turn including:
  - Current HP
  - Temporary HP
  - Max HP
  - Token Location
  - Active Conditions
  
- **State Comparison**: Automatically compares snapshots between turns to detect:
  - HP changes
  - Temporary HP changes
  - Movement (distance in feet and direction in degrees)
  - Conditions gained/lost
  - Combatants entering/leaving combat

- **Turn History**: Maintains an array of turn descriptions with:
  - Round and turn number
  - Combatant information
  - Timestamp
  - GM-provided description
  - State snapshot

### 2. **GM Description Dialog**
After each turn, a dialog appears prompting the GM to describe what happened. The dialog includes:
- **Pre-filled Markdown Template**:
  ```markdown
  ## Actions Taken
  
  ## Reactions Taken
  
  ## Environment Changes
  
  ## State Changes
  - ActorX: Current HP 66 -> 52
  - ActorX: Moved 35 ft @ 135 degrees
  - ActorY: Gained Conditions: Stunned, Restrained
  ```
  
- The `State Changes` section is automatically populated based on detected changes
- The GM can edit any section before submitting
- Submit or Cancel buttons to save or skip the entry

### 3. **Settings Integration**
Added a new setting in `scripts/settings.js`:
- **Enable Turn Tracking**: World-level setting (default: enabled)
  - Allows GMs to enable/disable the turn tracking feature

### 4. **Combat Hooks Integration**
Updated `scripts/main.js` to:
- Initialize turn tracker on module load
- Hook into `preUpdateCombat` to capture the turn that's ending
- Integrate turn tracker with combat start/end events
- Link turn tracker to the Combat AI Manager

### 5. **Combat AI Manager Integration**
Updated `scripts/combat-ai-manager.js` to:
- Maintain a reference to the turn tracker
- Provide `getTurnHistory()` method to access turn history
- Allow integration with future features that might need turn history

### 6. **Debug Mode Logging**
When debug mode is enabled:
- Logs each turn description submission with full details
- Logs the complete combat history array after each submission
- Tracks turn tracking initialization and cleanup events

## How It Works

1. **Combat Start**: When combat begins, turn tracker initializes and clears history

2. **Turn Change**: 
   - `preUpdateCombat` hook fires BEFORE the turn changes
   - System captures current state snapshot
   - Compares with previous snapshot to detect changes
   - Prompts GM with pre-filled description dialog
   - GM can edit and submit or cancel

3. **State Detection**:
   - HP changes: `Current HP 66 -> 52`
   - Movement: Calculates distance (in feet) and direction (in degrees)
   - Conditions: Lists gained/lost status effects
   - Temp HP changes
   - Combatants entering/leaving

4. **History Storage**:
   - Each submitted description is stored in the turn history array
   - Includes full snapshot for potential future use
   - Available through `combatAIManager.getTurnHistory()`

5. **Combat End**: 
   - Turn history is logged (if debug mode enabled)
   - History persists until next combat starts

## Usage

### For Game Masters
1. Enable "Enable Turn Tracking" in module settings
2. Run combat as normal
3. After each combatant's turn, a dialog will appear
4. Review the pre-filled state changes
5. Add details about actions taken, reactions, and environment changes
6. Click Submit to save or Cancel to skip

### For Developers
Access turn history:
```javascript
// Get turn history
const history = window.combatAIManager.getTurnHistory();

// Get current turn tracker
const tracker = window.turnTracker;

// Clear history
tracker.clearHistory();
```

### Debug Mode
Enable "Debug Mode" in settings to see:
- Turn tracking initialization messages
- Submitted turn descriptions in console
- Complete combat history after each submission

## Files Modified
1. `scripts/turn-tracker.js` - NEW file (core turn tracking logic)
2. `scripts/main.js` - Added turn tracker initialization and hooks
3. `scripts/settings.js` - Added enableTurnTracking setting
4. `scripts/combat-ai-manager.js` - Added turn tracker integration

## Technical Notes

### Movement Calculation
- Uses canvas grid size (default 100px = 5ft)
- Calculates Euclidean distance
- Converts to compass bearing (0° = North, 90° = East, etc.)

### Condition Detection
- Checks `actor.statuses` for status effects
- Falls back to `actor.effects` for active effects
- Filters out disabled effects

### Snapshot Timing
- Snapshots are taken at the END of a turn (before moving to next)
- Uses `preUpdateCombat` hook for accurate timing
- Handles both turn changes and round changes

## Future Enhancements (Not Implemented)
- LLM integration to use turn history in AI recommendations
- Export turn history to chat/journal
- Turn-by-turn replay functionality
- Custom templates for different game styles
