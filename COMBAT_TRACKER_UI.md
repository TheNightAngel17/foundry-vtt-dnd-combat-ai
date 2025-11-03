# Combat Tracker UI - Turn Tracking System

## Overview
The Combat Tracker UI is a complete replacement for the turn description dialog system. Instead of popup dialogs, turn tracking is now embedded directly into the combat tracker sidebar, providing a streamlined, non-blocking workflow for GMs to track combat actions and state changes.

## Features

### 1. **Brain Toggle Button** 🧠
- Located in the combat tracker header (right side controls)
- Click to enable/disable turn tracking
- Visual toggle state with highlight when active
- Tooltip: "Toggle Combat AI Turn Tracking"
- **When OFF**: No turn tracking occurs
- **When ON**: Full turn tracking with auto-save/load

## Features

### 1. **Brain Toggle Button** 🧠
- Located in the combat tracker header (right side controls)
- Click to enable/disable turn tracking
- Visual toggle state with highlight when active
- Tooltip: "Toggle Combat AI Turn Tracking"

### 2. **Turn Notes Textarea**
- Appears below the combatant list when brain button is toggled ON
- Automatically hides when brain button is toggled OFF
- Smooth slide-down/slide-up animations
- Saves automatically on blur (when you click away)

### 3. **Turn History Tracking**
When the brain button is ON, the system tracks:
- **Combat notes** from the textarea for each turn
- **State changes** for all tokens (HP, position, conditions)
- Data organized by **round number** and **combatant ID**

### 4. **Smart Loading**
- When navigating to a turn (forward or backward):
  - If data exists for that round/combatant → loads the saved notes
  - If no data exists → creates a new template with state changes
- Template includes sections for:
  - Actions Taken
  - Reactions Taken
  - Environment Changes
  - State Changes (auto-populated from previous turn)

### 5. **Self-Contained State Tracking**
- Includes all snapshot/comparison utility methods internally
- No external dependencies for state tracking
- All turn tracking UI and logic is handled by `CombatTrackerUI`

## Data Structure

Each turn entry contains:
```javascript
{
    round: number,              // Combat round number
    combatantId: string,        // Unique combatant ID
    combatantName: string,      // Display name
    actorId: string,           // Actor ID
    initiative: number,         // Initiative value
    notes: string,             // Text from textarea
    timestamp: number,         // When saved
    snapshot: Object           // State snapshot for comparison
}
```

## Usage Flow

1. **Enable Tracking**: Click the brain button in combat tracker header
2. **Combat Starts**: First turn loads with template
3. **Take Notes**: Add actions, reactions, environment changes
4. **Turn Changes**: Notes auto-save, new turn loads (existing or template)
5. **Navigate**: Click any combatant to jump to their turn - notes load automatically
6. **Combat Ends**: All turn data is preserved in `window.combatTrackerUI.getTurnHistory()`

## Technical Implementation

### Files Modified
- `scripts/combat-tracker-ui.js` - Main implementation
- `scripts/main.js` - Integration hooks
- `styles/combat-ai.css` - Styling for UI elements

### Key Classes
- `CombatTrackerUI` - Manages UI, turn data, and state tracking
  - Instance available at: `window.combatTrackerUI`

### Hooks Used
- `renderCombatTracker` - Injects UI elements
- `combatTurn` - Saves/loads data on turn change
- `combatRound` - Handles round transitions
- `combatStart` - Initializes tracking
- `combatEnd` - Cleanup

### Public Methods
```javascript
// Access the tracker
const tracker = window.combatTrackerUI;

// Get all turn history
tracker.getTurnHistory();

// Check if enabled
tracker.isEnabled;

// Manually save current turn
tracker.saveTurnData();

// Force reload current turn
tracker.onTurnChange(game.combat);
```

## Advantages Over Dialog System

1. **Always visible** - No popup to manage, track stays in sidebar
2. **Faster workflow** - Notes embedded in tracker, no separate window
3. **Better navigation** - Click any combatant to review their turn instantly
4. **No blocking** - Doesn't interrupt GM flow or require dismissing dialogs
5. **State preservation** - Full history accessible at any time
6. **Optional** - Toggle on/off as needed during combat

## Migrated Functionality

The following features from the original turn tracker dialog have been migrated to the Combat Tracker UI:

- ✅ Turn-by-turn notes with markdown sections
- ✅ Automatic state change detection and population
- ✅ Turn history storage with snapshots
- ✅ Round and combatant tracking
- ✅ Debug logging and settings integration

**Removed:**
- ❌ Turn description dialog popup
- ❌ "End Turn" button workflow (now uses native Foundry turn advancement)
- ❌ Dialog template and form handling

## Future Enhancements

Potential additions:
- Export turn history to markdown/journal
- Search/filter turn history
- Visual timeline view
- Turn summary display in combatant tooltips
- Collaborative editing for multiple GMs
