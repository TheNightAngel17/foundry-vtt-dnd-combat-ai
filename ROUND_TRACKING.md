# Round Tracking Feature

## Overview

The Round Tracking feature automatically monitors combat progression and prompts the GM to describe each round of combat. This provides valuable context to the AI when generating combat recommendations.

## Features

### 1. Automatic Snapshots
- At the start of each combat round, the system automatically captures:
  - Each combatant's current HP
  - Position on the battlefield
  - Active conditions and effects
  - Whether they are an NPC or player character

### 2. Auto-Detection of Changes
The system automatically detects and reports changes between rounds:
- **Damage Taken**: "Goblin took 15 damage (30 → 15 HP)"
- **Healing**: "Fighter healed 8 HP (12 → 20 HP)"
- **Movement**: "Wizard moved approximately 30 ft"
- **Conditions Applied**: "Rogue gained condition: Poisoned"
- **Conditions Removed**: "Barbarian lost condition: Stunned"
- **Combatants Joining/Leaving**: Tracks when combatants enter or exit combat

### 3. GM Description Dialog
At the start of each round, a dialog prompts the GM to describe the round with:
- Pre-filled auto-detected changes from the previous round
- Text area for adding additional narrative details
- Option to save or skip the description

### 4. Combat History in AI Prompts
Round descriptions are automatically included in AI combat recommendations:
- Provides context about what has happened in previous rounds
- Helps the AI make more informed tactical decisions
- Configurable number of rounds to include (default: 3)

## Settings

### Enable Round Tracking
**Default**: Enabled  
**Description**: Turn on/off the round tracking system

### Round History Context
**Default**: 3 rounds  
**Range**: 1-10 rounds  
**Description**: How many previous rounds of combat to include in AI prompts

## Usage

### For Game Masters

1. **Starting Combat**: When combat begins, the system initializes round tracking automatically.

2. **Each Round**: 
   - At the start of a new round, a dialog appears showing auto-detected changes
   - Review the auto-detected information
   - Add your own narrative description of what happened
   - Click "Save Description" to store it, or "Skip" to dismiss

3. **AI Recommendations**: When the AI generates recommendations for NPCs, it will automatically include relevant round history to provide better tactical context.

4. **Combat End**: Round history is automatically cleared when combat ends.

### Example Round Description

```
Round 2 Summary:

Goblin Scout took 12 damage (18 → 6 HP)
Fighter moved approximately 25 ft
Wizard gained condition: Concentrating
Rogue took 8 damage (24 → 16 HP)

Additional notes: The goblin scout attempted to flee but was cornered by the fighter. The wizard cast Haste on the rogue, who then moved in for a sneak attack but took damage from an opportunity attack.
```

## Benefits

1. **Better AI Decisions**: AI has context about combat flow and can make more intelligent recommendations
2. **Combat Narrative**: Helps GMs track what happened for session notes
3. **Tactical Context**: Understanding movement patterns and damage distribution helps NPCs react more realistically
4. **Minimal Effort**: Auto-detection reduces the work needed from the GM

## Technical Details

### Implementation
- Round snapshots are stored in memory during combat
- Snapshots include combatant state before each round
- Comparison between snapshots generates the auto-detected changes
- Round history is formatted and injected into LLM prompts

### Data Tracked
Each snapshot captures:
```javascript
{
  round: number,
  combatants: [{
    id: string,
    name: string,
    hp: { current: number, max: number },
    position: { x: number, y: number },
    conditions: [{ name: string, id: string }],
    isNPC: boolean
  }]
}
```

### Round History Format
Round descriptions are stored as:
```javascript
{
  round: number,
  description: string,
  snapshot: CombatantSnapshot,
  timestamp: number
}
```

## Future Enhancements

Potential future improvements:
- Export combat logs as markdown or JSON
- More detailed movement tracking (direction, distance to specific targets)
- Resource usage tracking (spell slots, abilities used)
- Damage type analysis
- Turn-by-turn action tracking (not just round summaries)
