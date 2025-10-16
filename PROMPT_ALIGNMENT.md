# Action Description Prompt Alignment

This document shows the alignment between the DDB Importer and local parsing prompts to ensure consistent output formatting.

## Shared Important Rules

Both prompts now follow the same core rules:

### 1. Extraction Rules
- ✅ Extract EVERY distinct combat action, ability, spell, and option
- ✅ Merge related actions intelligently (e.g., Multiattack variants)
- ✅ Create separate entries for distinct abilities (spells, legendary actions, etc.)

### 2. Description Format
- ✅ Max 200 characters per description
- ✅ Focus on: damage, range, targets, applied conditions, special effects
- ✅ Extract all numerical values from formulas

### 3. Activation Time Categories
Both prompts use the same categories:
- `action`
- `bonus`
- `reaction`
- `legendary`
- `lair`
- `mythic`
- `special`

### 4. Consistent Formatting Standards

#### Attack Format
```
Melee/Ranged Spell/Weapon Attack: +X to hit, range Y ft., target. Hit: Z (damage dice) type [+ additional effects]
```

**Example:**
```json
{
  "name": "Bite",
  "description": "Melee Weapon Attack: +15 to hit, reach 15 ft., one target. Hit: 19 (2d10+8) piercing plus 13 (3d8) force"
}
```

#### Save Format
```
DC X [ability] save or [effect]. On save: [reduced effect]
```

**Example:**
```json
{
  "name": "Fire Breath (Recharge 5-6)",
  "description": "60-ft cone. DC 18 Dex save or 56 (16d6) fire damage, half on success"
}
```

#### Legendary Action Format
```
Legendary Action (X Actions): [description]
```

**Example:**
```json
{
  "name": "Legendary Claw",
  "description": "Legendary Action (1 Action): Melee Weapon Attack: +6 to hit, 1d8+3 slashing"
}
```

#### Spell Format
```
[Frequency]: [spell name] - [key effects]
```

**Example:**
```json
{
  "name": "Spellcasting (Fireball)",
  "description": "1/day: 8d6 fire damage, 20-ft radius, DC 15 Dex save for half"
}
```

#### Recharge Abilities
```
[Ability name] (Recharge X-Y): [description]
```

**Example:**
```json
{
  "name": "Singularity Breath (Recharge 5-6)",
  "description": "90-ft cone. DC 23 Str save or 63 (14d8) force damage, speed 0 until dragon's next turn"
}
```

## Output Structure

Both prompts produce the same JSON structure:

```json
[
  {
    "name": "ability name (with variants if applicable)",
    "description": "concise tactical description following formatting rules",
    "activationTime": "action/bonus/reaction/legendary/lair/mythic/special",
    "itemType": "feat/spell/weapon"
  }
]
```

## Differences Between Prompts

### DDB Importer Prompt
- **Input**: HTML-formatted description text from D&D Beyond
- **Parsing**: Must extract damage from `<span data-dicenotation="">` tags
- **Source**: Pre-formatted official descriptions

### Local Parsing Prompt
- **Input**: Raw JSON data from Foundry actor items
- **Parsing**: Must construct descriptions from structured data (damage.parts, range, target, etc.)
- **Source**: Foundry item system data

## Example Outputs (Should be identical)

### Multiattack Example
```json
{
  "name": "Multiattack (3 Bites)",
  "description": "Make three bite attacks, each +7 to hit, 2d6+4 piercing",
  "activationTime": "action",
  "itemType": "feat"
}
```

### Breath Weapon Example
```json
{
  "name": "Singularity Breath (Recharge 5-6)",
  "description": "90-ft cone. DC 23 Str save or 63 (14d8) force damage, speed becomes 0. Half damage on save",
  "activationTime": "action",
  "itemType": "feat"
}
```

### Legendary Action Example
```json
{
  "name": "Psionics",
  "description": "Legendary Action (2 Actions): Use Psychic Step or Spellcasting",
  "activationTime": "legendary",
  "itemType": "feat"
}
```

### Spell Example
```json
{
  "name": "Spellcasting (Blink)",
  "description": "1/day: Randomly vanish at end of turn, 50% chance to reappear",
  "activationTime": "action",
  "itemType": "spell"
}
```

## Quality Assurance

To ensure consistent output between both methods:

1. ✅ Same character limit (200)
2. ✅ Same formatting patterns
3. ✅ Same activation time categories
4. ✅ Same itemType values
5. ✅ Same JSON structure
6. ✅ Same level of tactical detail
7. ✅ Same handling of multiattack variants
8. ✅ Same notation for saves, attacks, and damage

## Testing Consistency

Use the same actor with both methods and compare outputs:

```javascript
// Test with DDB setting ON
const ddbActions = await actionCache.getActorActions(actor, aiService);

// Test with DDB setting OFF
const localActions = await actionCache.getActorActions(actor, aiService);

// Compare outputs - should have similar structure and detail level
console.log('DDB Actions:', ddbActions);
console.log('Local Actions:', localActions);
```

Both should produce comparable quality descriptions with consistent formatting, even though they parse from different data sources.
