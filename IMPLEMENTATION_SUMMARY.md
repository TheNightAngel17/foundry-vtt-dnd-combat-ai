# Round Tracking Implementation Summary

## Overview
This document summarizes the implementation of the Round Tracking feature for the D&D Combat AI module.

## Implementation Details

### New Files Created

#### 1. `scripts/round-tracker.js`
A new module that handles all round tracking functionality:
- **RoundTracker class**: Main class for managing combat round history
- **Snapshot creation**: Captures combatant state at round start
- **Change detection**: Compares snapshots to identify what changed
- **GM dialog**: Prompts GM to describe rounds with pre-filled context
- **History management**: Stores and retrieves round descriptions

Key methods:
- `createCombatantSnapshot(combat)`: Takes a snapshot of all combatants
- `generateSnapshotDiff(prev, current)`: Compares two snapshots and generates change summary
- `onRoundStart(combat)`: Called when a new round starts
- `promptRoundDescription(combat)`: Shows dialog to GM for description input
- `getRoundHistoryForPrompt(maxRounds)`: Formats history for inclusion in LLM prompts
- `clearHistory()`: Cleans up when combat ends

### Modified Files

#### 1. `scripts/combat-ai-manager.js`
- Imported `RoundTracker` class
- Added `roundTracker` instance to constructor
- Added `onRoundStart(combat)` method to handle round start events
- Modified `buildPrompt()` to include round history in AI prompts
- Updated `onCombatEnd()` to clear round history

#### 2. `scripts/main.js`
- Modified `onCombatRound()` hook to call `combatAIManager.onRoundStart(combat)`
- Ensures round tracking happens before NPC turn processing

#### 3. `scripts/settings.js`
Added two new settings:
- `enableRoundTracking`: Boolean to enable/disable the feature (default: true)
- `roundHistoryContext`: Number of rounds to include in AI context (default: 3, range: 1-10)

#### 4. `lang/en.json`
Added localization strings for:
- Settings names and hints
- UI elements (Round Description, Save Description, Skip, etc.)
- Status messages

#### 5. `module.json`
- Updated version from "0.0.2" to "0.1.0"

### Documentation Files

#### 1. `ROUND_TRACKING.md` (New)
Complete documentation covering:
- Feature overview and capabilities
- Settings and configuration
- Usage instructions for GMs
- Example round descriptions
- Technical implementation details
- Future enhancement ideas

#### 2. `README.md` (Updated)
- Added "Round Tracking" feature section
- Linked to detailed documentation

#### 3. `CHANGELOG.md` (Updated)
- Added v0.1.0 release notes
- Documented all changes and new features

## How It Works

### Combat Flow

1. **Combat Starts**: 
   - `onCombatStart()` called
   - Round history is cleared

2. **Round Begins**:
   - `onCombatRound()` hook fires
   - `onRoundStart()` is called
   - Previous snapshot becomes the baseline
   - New snapshot is created
   - Changes are detected by comparing snapshots
   - GM dialog appears with auto-detected changes
   - GM can add narrative description

3. **During Round**:
   - When AI generates recommendations, round history is included in prompt
   - AI has context about previous combat actions

4. **Combat Ends**:
   - `onCombatEnd()` called
   - Round history is cleared

### Data Flow

```
Combat Round Start
    ↓
Create Snapshot (HP, position, conditions)
    ↓
Compare with Previous Snapshot
    ↓
Generate Change Summary
    ↓
Show GM Dialog with Changes
    ↓
GM Adds Description → Saved to History
    ↓
AI Turn Processing
    ↓
Include Round History in Prompt
    ↓
AI Generates Better Recommendations
```

## Key Features Implemented

### ✅ Automatic Snapshots
- Captures state at start of each round
- Tracks HP, position, conditions for all combatants
- Minimal performance impact (in-memory only)

### ✅ Change Detection
- Damage/healing tracking
- Movement detection (with distance calculation)
- Condition tracking (gained/lost)
- Combatant join/leave detection

### ✅ GM Dialog
- Auto-populated with detected changes
- Text area for narrative description
- Save or Skip options
- Clean, themed UI matching Foundry

### ✅ AI Context Integration
- Round history automatically added to prompts
- Configurable number of rounds (1-10)
- Properly formatted for LLM consumption
- Can be disabled via settings

### ✅ Settings
- Enable/disable round tracking
- Configure context window size
- Accessible through standard Foundry settings

## Testing Considerations

While this implementation cannot be fully tested without a running Foundry VTT instance, the code includes:

1. **Null checks**: Defensive programming for missing combat/combatants
2. **Setting guards**: Features check if enabled before executing
3. **Debug logging**: Optional debug mode for troubleshooting
4. **Graceful degradation**: System continues if snapshots fail
5. **Clean state management**: History cleared on combat end

## Configuration Examples

### Minimal Context (Fast but less aware)
```javascript
enableRoundTracking: true
roundHistoryContext: 1
```

### Balanced (Default)
```javascript
enableRoundTracking: true
roundHistoryContext: 3
```

### Maximum Context (Slow but most aware)
```javascript
enableRoundTracking: true
roundHistoryContext: 10
```

### Disabled
```javascript
enableRoundTracking: false
```

## Future Enhancements

Potential improvements identified during implementation:

1. **Turn-level tracking**: Track individual turns, not just rounds
2. **Action logging**: Capture specific actions taken (attacks, spells, etc.)
3. **Damage type analysis**: Track what types of damage are being dealt
4. **Resource tracking**: Monitor spell slots, abilities, etc.
5. **Export functionality**: Save combat logs as markdown/JSON
6. **Replay system**: Ability to review past combats
7. **Statistics**: Aggregate data across multiple combats

## Validation Checklist

- [x] JavaScript syntax validated with Node.js
- [x] JSON files validated (module.json, lang/en.json)
- [x] Module version updated
- [x] Documentation created
- [x] CHANGELOG updated
- [x] README updated
- [x] Code follows existing patterns
- [x] Minimal changes approach
- [x] No breaking changes to existing functionality
- [x] Settings properly registered
- [x] Language strings added
- [ ] Manual testing in Foundry VTT (requires live environment)

## Files Changed Summary

**New Files (1):**
- `scripts/round-tracker.js` (320 lines)
- `ROUND_TRACKING.md` (documentation)

**Modified Files (7):**
- `scripts/combat-ai-manager.js` (+28 lines)
- `scripts/main.js` (+6 lines)
- `scripts/settings.js` (+27 lines)
- `lang/en.json` (+20 lines)
- `module.json` (+1 line)
- `README.md` (+6 lines)
- `CHANGELOG.md` (+20 lines)

**Total Changes:**
- ~408 lines added
- ~3 lines removed
- 8 files changed

## Conclusion

The Round Tracking feature has been successfully implemented with:
- Clean separation of concerns (new RoundTracker class)
- Minimal changes to existing code
- Comprehensive documentation
- Proper settings integration
- Ready for testing in a Foundry VTT environment

The implementation follows the requirements from the problem statement:
1. ✅ GM can input actions/reactions each round
2. ✅ Actions tracked and stored in encounter array
3. ✅ Snapshots of combatant state before each round
4. ✅ Auto-detection of damage, movement, conditions
5. ✅ Pre-filled description box with detected changes
6. ✅ History passed to LLM prompts for context
7. ✅ Implemented in releases/v0.1.0_RoundTracking branch
