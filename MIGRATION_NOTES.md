# Migration Notes: Turn Tracker Dialog → Combat Tracker UI

## Update: TurnTracker Fully Removed

**As of latest version**: The `TurnTracker` class and `scripts/turn-tracker.js` file have been completely removed. All utility methods (snapshot, comparison, etc.) have been migrated into `CombatTrackerUI` as self-contained methods. The dialog system is no longer available.

---

## Summary of Changes

The turn tracking system has been completely refactored from a dialog-based approach to an embedded UI in the combat tracker.

## What Changed

### Removed
1. **Turn Description Dialog** (`TurnDescriptionDialog` class)
   - No more popup dialogs during combat
   - Removed "End Turn" button workflow
   - Removed dialog template handling
   - Removed `promptTurnDescription()` method
   - Removed `showDescriptionDialog()` method
   - Removed `onTurnStart()` method
   - Removed `addToHistory()` method
   - Removed `getHistory()` and `clearHistory()` methods

2. **Dialog Template** (still exists but unused)
   - `templates/turn-description-dialog.hbs` - can be deleted if desired

### Modified

1. **TurnTracker Class** (`scripts/turn-tracker.js`)
   - Now a **utility class** for state tracking only
   - Provides snapshot and comparison methods
   - No longer manages UI or dialogs
   - Simplified constructor (removed `turnHistory` and `currentCombat`)
   - Kept methods:
     - `takeSnapshot()` - Takes combat state snapshot
     - `getActorConditions()` - Gets actor conditions
     - `compareSnapshots()` - Compares two snapshots
     - `calculateMovement()` - Calculates movement distance/direction
     - `compareConditions()` - Compares condition lists
     - `onCombatStart()` - Initialize snapshots
     - `onCombatEnd()` - Cleanup

2. **Main Hooks** (`scripts/main.js`)
   - Removed all dialog-triggering code
   - Simplified turn change handlers
   - Now only calls `CombatTrackerUI` methods
   - Removed conditional logic for "if tracker UI enabled"

### Added

1. **CombatTrackerUI Class** (`scripts/combat-tracker-ui.js`)
   - Complete turn tracking implementation
   - Brain toggle button for enable/disable
   - Turn notes textarea with auto-save
   - Turn history with round/combatant tracking
   - Smart loading of existing vs new turns
   - Integration with TurnTracker utility methods

## Migration Path

If you have existing code that used the old system:

### Before (Dialog-based)
```javascript
// Turn tracker would show dialog
turnTracker.onTurnStart(combat, turnIndex);

// Access history
const history = turnTracker.getHistory();
```

### After (Combat Tracker UI)
```javascript
// Enable combat tracker UI (brain button or programmatically)
window.combatTrackerUI.isEnabled = true;

// Turn changes handled automatically via hooks

// Access history
const history = window.combatTrackerUI.getTurnHistory();
```

## Settings Impact

The following settings are no longer used:
- `enableTurnTracking` - Turn tracking is now controlled by the brain button

## User Experience Changes

### Before
1. Turn changes → Dialog popup appears
2. GM fills in notes
3. GM clicks "End Turn" button
4. Dialog advances to next turn automatically
5. Dialog can be cancelled

### After
1. GM enables brain button (once per combat)
2. Turn changes → Notes area updates in sidebar
3. GM fills in notes (no blocking popup)
4. Notes auto-save when clicking away
5. Navigate turns using Foundry's native controls
6. Click any combatant to view their turn notes

## Benefits

1. **Non-blocking** - No modal dialogs interrupting workflow
2. **Persistent** - Always visible in sidebar
3. **Navigable** - Jump to any turn instantly
4. **Optional** - Toggle on/off mid-combat
5. **Cleaner** - Uses Foundry's native turn advancement
6. **Faster** - No form submission delays

## Rollback Plan

If you need to rollback to the dialog system:

1. Restore the old `turn-tracker.js` from git history
2. Restore the old hooks in `main.js`
3. Disable `CombatTrackerUI.init()` in main.js
4. The dialog system will resume working

However, any data saved in `CombatTrackerUI` will not be accessible by the old system (different storage format).
