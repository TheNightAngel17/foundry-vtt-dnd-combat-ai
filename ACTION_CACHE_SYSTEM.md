# Action Cache System

## Overview

The Action Cache system intelligently pre-processes NPC abilities using LLM to create optimized, concise descriptions. This reduces token usage during combat while providing better tactical information.

## How It Works

### 1. Combat Start Hook
When combat begins, the system automatically:
- Identifies all NPC combatants
- Pre-caches their actions in parallel
- Shows progress in the console

### 2. Action Extraction
For each NPC, the system:
- Extracts all items with activities (feats, spells, weapons)
- Gathers detailed mechanical information:
  - Damage formulas and types
  - Range and targeting
  - Save DCs and abilities
  - Healing amounts
  - Activation types

### 3. LLM Processing
The extracted data is sent to the LLM with a prompt that asks it to:
- Create concise tactical descriptions (max 100 words)
- Focus on mechanical details and tactical considerations
- Identify multiple distinct uses if applicable (e.g., a staff with multiple spells)
- Return structured JSON

### 4. Caching
Generated descriptions are cached with:
- **Actor ID** as the key
- **Timestamp** for expiration tracking
- **1 hour timeout** (configurable)

### 5. Combat Usage
During NPC turns:
- Cached descriptions are retrieved instantly
- No repeated LLM calls for the same NPC
- Minimal token usage per turn

## Benefits

### Token Efficiency
- **Before**: Sending full item descriptions every turn (~500+ tokens per NPC)
- **After**: One-time processing, then ~50-100 tokens per turn

### Better Descriptions
- LLM identifies key tactical information
- Removes formatting cruft and irrelevant lore
- Highlights what matters for combat decisions

### Performance
- Parallel pre-caching at combat start
- Instant retrieval during turns
- No delays waiting for LLM

## Example Flow

```
1. Combat Starts
   └─> System detects 3 NPCs
       ├─> Goblin Archer (processing...)
       ├─> Orc Warrior (processing...)
       └─> Evil Mage (processing...)

2. For "Evil Mage"
   └─> Extract items:
       ├─ Staff of Power (3 activities)
       ├─ Fireball spell
       └─ Shield spell
   └─> Send to LLM with mechanical data
   └─> Receive optimized descriptions:
       ├─ "Staff of Power - Fireball: Ranged spell attack, 8d6 fire, 150ft range..."
       ├─ "Staff of Power - Lightning Bolt: 8d6 lightning in 100ft line..."
       └─ "Shield: Reaction spell, +5 AC until next turn..."
   └─> Cache results

3. Evil Mage's Turn
   └─> Retrieve cached actions (instant!)
   └─> Send to combat AI with situation
   └─> Get tactical recommendations
```

## Cache Management

### Automatic
- **Combat Start**: Pre-cache all NPCs
- **Combat End**: Clear expired entries
- **1 Hour Timeout**: Entries auto-expire

### Manual
```javascript
// Clear specific actor
combatAIManager.actionCache.clearCache(actorId);

// Clear all cache
combatAIManager.actionCache.clearCache();

// Clear expired only
combatAIManager.actionCache.clearExpiredCache();
```

## Configuration

In `action-cache.js`:
```javascript
this.cacheTimeout = 3600000; // 1 hour in milliseconds
```

Adjust based on your needs:
- **1 hour** (default): Good balance
- **30 minutes**: More frequent updates
- **2 hours**: Longer persistence

## Debugging

Enable debug mode in module settings to see:
```
D&D Combat AI | Pre-caching actions for 3 NPCs...
D&D Combat AI | Generating action descriptions for Goblin Archer
D&D Combat AI | Generated 4 action descriptions for Goblin Archer
D&D Combat AI | Cached actions for Goblin Archer
D&D Combat AI | Using cached actions for Goblin Archer
```

## Fallback Behavior

If LLM processing fails:
- Falls back to cleaned raw descriptions
- Removes HTML tags
- Truncates to 100 characters
- Combat continues without interruption

## Future Enhancements

Potential improvements:
- [ ] Persistent cache across sessions
- [ ] Manual refresh button
- [ ] Custom timeout per actor type
- [ ] Cache statistics/monitoring
- [ ] Pre-cache on actor sheet open
