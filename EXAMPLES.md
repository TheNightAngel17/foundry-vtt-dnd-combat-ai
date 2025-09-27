# Usage Examples

This document provides examples of how the D&D Combat AI module works in practice.

## Example Combat Scenario

**Setup**: A party of 4 level 5 adventurers is fighting 2 hobgoblins and 1 hobgoblin captain in a 30x30 ft room.

**Current Situation**:
- Round 3, Hobgoblin Captain's turn
- Captain: 32/58 HP, AC 18, positioned in center
- Rogue (PC): 15/45 HP, unconscious, 10 ft away
- Fighter (PC): 28/52 HP, adjacent to captain
- Wizard (PC): 22/31 HP, 25 ft away, behind cover
- Cleric (PC): 8/38 HP, 20 ft away

## AI Responses by Difficulty

### Easy Difficulty
```
AI Recommendations for Hobgoblin Captain

Difficulty: EASY

1. Attack with Longsword - Simple melee attack against adjacent fighter
2. Martial Advantage - Use pack tactics for advantage but target the healthy fighter
3. Move to Defensive Position - Step back to avoid opportunity attacks
```

### Normal Difficulty  
```
AI Recommendations for Hobgoblin Captain

Difficulty: NORMAL

1. Attack Unconscious Rogue - Force death saving throws with melee attack
2. Leadership (Recharge 4-6) - Grant allies extra attacks if available
3. Multiattack Fighter - Two longsword attacks on the adjacent threat
```

### Hard Difficulty
```
AI Recommendations for Hobgoblin Captain

Difficulty: HARD

1. Coup de Grace Unconscious Rogue - Eliminate the rogue permanently with critical hit
2. Position for Martial Advantage - Move to flank the fighter with hobgoblin ally
3. Javelin at Low-HP Cleric - Ranged attack to potentially eliminate healing threat
```

### Deadly Difficulty
```
AI Recommendations for Hobgoblin Captain

Difficulty: DEADLY

1. Stabilize then Execute Rogue - Attack unconscious rogue twice to ensure death
2. Command Minions Focus Fire - Use tactical positioning to maximize martial advantage  
3. Ready Action Counterstrike - Prepare to punish wizard's next spell with javelin
```

### TPK Mode
```
AI Recommendations for Hobgoblin Captain

Difficulty: TPK

1. Execute Unconscious Rogue - Two attacks on rogue, ensuring character death
2. Grapple Low-HP Cleric - Move and grapple to prevent healing and create hostage
3. Use Terrain Advantage - Position behind cover while maintaining threat presence
```

## Real Combat Flow

### Turn 1: Goblin Turn (Normal Difficulty)
```
[AUTOMATIC] Combat AI detects NPC turn
[ANALYZING] Goblin stats: 7/7 HP, AC 15, Scimitar available
[CONTEXT] Round 1, 4 PCs at full health, goblin is outnumbered
[GENERATING] Contacting OpenAI API...
[DISPLAY] Recommendation dialog appears for GM
```

**GM sees:**
```
AI Recommendations for Goblin Scout

Difficulty: NORMAL

1. Hide Action - Use stealth to gain advantage on next attack
2. Shortbow Attack on Wizard - Target the unarmored spellcaster
3. Nimble Escape - Attack then use bonus action to disengage and move
```

### Turn 2: Manual AI Request
```
[MANUAL] GM clicks "Get AI Advice" button
[CURRENT] Orc Warrior's turn, 15/30 HP remaining
[DIFFICULTY] GM changed to "Hard" via combat tracker dropdown
[PROCESSING] Analyzing current tactical situation...
```

**GM sees:**
```
AI Recommendations for Orc Warrior

Difficulty: HARD

1. Reckless Attack on Fighter - Use advantage to maximize damage
2. Great Weapon Master - Take -5 to hit for +10 damage against injured PC
3. Intimidating Presence - Frighten nearby enemies to control battlefield
```

## Settings Configuration Examples

### OpenAI Setup
```
LLM Provider: OpenAI
Model: GPT-3.5 Turbo
API Key: sk-your-key-here
Auto-display: ✓ Enabled
Context Turns: 3
Request Timeout: 30 seconds
```

### Local LLM Setup (Ollama)
```
LLM Provider: Local LLM
Endpoint: http://localhost:11434
Model: llama2:13b
Connection Test: ✓ Connected
Debug Mode: ✓ Enabled (for testing)
```

## Error Handling Examples

### API Key Missing
```
❌ D&D Combat AI: No API key configured. Please configure your LLM API key in module settings.
[FALLBACK] Using default tactical recommendations instead
```

### Connection Timeout
```
⚠️ D&D Combat AI: Request timed out after 30 seconds
[FALLBACK] Showing difficulty-appropriate default actions
```

### Invalid Response
```
⚠️ D&D Combat AI: Unexpected response format from LLM
[FALLBACK] Parsed partial recommendations: 2 of 3 actions available
```

## Integration Points

### Combat Tracker UI
- **Difficulty Dropdown**: Appears below combat tracker title
- **Manual Button**: "Get AI Advice" button when NPC is active
- **Status Indicator**: Shows when AI is generating recommendations

### Scene Controls
- **Brain Icon**: Quick access to settings and manual requests
- **Tooltip**: "Combat AI Settings" on hover
- **Active State**: Icon highlights when AI assistance is enabled

### Settings Dialog
- **Tabbed Interface**: General, Provider, Advanced settings
- **Connection Test**: Real-time API validation
- **Cost Calculator**: Estimated monthly costs based on usage

This module transforms NPC combat from manual tactical planning to AI-assisted decision making, allowing GMs to focus on storytelling while maintaining challenging and intelligent enemy behavior.