/**
 * Action Cache - Caches LLM-generated action descriptions for NPCs
 */

import { MODULE_ID, MODULE_TITLE } from './main.js';
import { CombatAISettings } from './settings.js';

export class ActionCache {
    constructor() {
        this.cache = new Map(); // actorId -> { actions: [], timestamp: number }
        this.cacheTimeout = 3600000; // 1 hour in milliseconds
    }

    /**
     * Get cached actions for an actor, or generate them if not cached
     */
    async getActorActions(actor, aiService) {
        const actorId = actor.id;
        
        // Check if we have valid cached data
        if (this.cache.has(actorId)) {
            const cached = this.cache.get(actorId);
            const age = Date.now() - cached.timestamp;
            
            if (age < this.cacheTimeout) {
                if (game.settings.get(MODULE_ID, 'debugMode')) {
                    console.debug(`${MODULE_TITLE} | Using cached actions for ${actor.name}`);
                }
                return cached.actions;
            }
        }

        // No valid cache, generate new descriptions
        if (game.settings.get(MODULE_ID, 'debugMode')) {
            console.debug(`${MODULE_TITLE} | Generating action descriptions for ${actor.name}`);
        }

        const actions = await this.generateActionDescriptions(actor, aiService);
        
        // Cache the results
        this.cache.set(actorId, {
            actions: actions,
            timestamp: Date.now()
        });

        return actions;
    }

    /**
     * Generate LLM-optimized action descriptions
     */
    async generateActionDescriptions(actor, aiService) {
        // Check if we should use DDB Importer data
        const ddbConfig = CombatAISettings.getDDBImporterConfig();
        const hasDDBFlag = actor.flags?.ddbimporter?.id;
        
        if (ddbConfig.useDDBImporter && hasDDBFlag) {
            if (game.settings.get(MODULE_ID, 'debugMode')) {
                console.debug(`${MODULE_TITLE} | Using DDB Importer data for ${actor.name}`);
            }
            return await this.generateActionsFromDDB(actor, aiService, ddbConfig);
        }
        
        // Use default method (parse from Foundry actor items)
        const rawActions = this.extractRawActions(actor);
        
        if (rawActions.length === 0) {
            return [];
        }

        // Build prompt for LLM to create concise descriptions
        const prompt = this.buildDescriptionPrompt(actor, rawActions);
        
        try {
            const response = await aiService.generateResponse(prompt, 'actionCache');
            const parsedActions = this.parseActionDescriptions(response, rawActions);
            
            if (game.settings.get(MODULE_ID, 'debugMode')) {
                console.log(`${MODULE_TITLE} | Generated ${parsedActions.length} action descriptions for ${actor.name}:`, parsedActions);
            }
            
            return parsedActions;
        } catch (error) {
            console.error(`${MODULE_TITLE} | Error generating action descriptions:`, error);
            // Fallback to raw actions with cleaned descriptions
            return rawActions.map(action => ({
                name: action.name,
                description: this.cleanDescription(action.rawDescription),
                activationTime: action.activationTime,
                itemType: action.itemType
            }));
        }
    }

    /**
     * Generate action descriptions from DDB Importer proxy data
     */
    async generateActionsFromDDB(actor, aiService, ddbConfig) {
        try {
            // Fetch monster data from DDB proxy
            const ddbData = await this.fetchDDBMonsterData(actor, ddbConfig);
            
            if (!ddbData) {
                console.warn(`${MODULE_TITLE} | No DDB data found, falling back to local parsing`);
                // Fallback to local parsing
                const rawActions = this.extractRawActions(actor);
                const prompt = this.buildDescriptionPrompt(actor, rawActions);
                const response = await aiService.generateResponse(prompt, 'actionCache');
                return this.parseActionDescriptions(response, rawActions);
            }

            // Build DDB-specific prompt
            const prompt = this.buildDDBDescriptionPrompt(actor, ddbData);
            
            const response = await aiService.generateResponse(prompt, 'actionCache');
            const parsedActions = this.parseActionDescriptions(response, []);
            
            if (game.settings.get(MODULE_ID, 'debugMode')) {
                console.log(`${MODULE_TITLE} | Generated ${parsedActions.length} action descriptions from DDB for ${actor.name}:`, parsedActions);
            }
            
            return parsedActions;
        } catch (error) {
            console.error(`${MODULE_TITLE} | Error generating actions from DDB:`, error);
            // Fallback to local parsing
            const rawActions = this.extractRawActions(actor);
            return rawActions.map(action => ({
                name: action.name,
                description: this.cleanDescription(action.rawDescription),
                activationTime: action.activationTime,
                itemType: action.itemType
            }));
        }
    }

    /**
     * Fetch monster data from DDB Importer proxy
     */
    async fetchDDBMonsterData(actor, ddbConfig) {
        const ddbId = actor.flags?.ddbimporter?.id;
        
        if (!ddbId) {
            throw new Error('No DDB Importer ID found on actor');
        }

        if (!ddbConfig.ddbImporterUrl) {
            throw new Error('DDB Importer URL not configured');
        }

        if (!ddbConfig.cobaltSession) {
            throw new Error('Cobalt session not configured');
        }

        const url = `${ddbConfig.ddbImporterUrl}/proxy/monsters/ids`;
        const requestBody = {
            cobalt: ddbConfig.cobaltSession,
            ids: [ddbId.toString()]
        };

        if (game.settings.get(MODULE_ID, 'debugMode')) {
            console.debug(`${MODULE_TITLE} | Fetching DDB data from ${url} for ID ${ddbId}`);
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`DDB proxy request failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        if (!data.success || !data.data || data.data.length === 0) {
            throw new Error('DDB proxy returned no data');
        }

        return data.data[0]; // Return first monster in array
    }

    /**
     * Build prompt for LLM using DDB description data
     */
    buildDDBDescriptionPrompt(actor, ddbData) {
        const sections = {
            specialTraits: ddbData.specialTraitsDescription || '',
            actions: ddbData.actionsDescription || '',
            bonusActions: ddbData.bonusActionsDescription || '',
            reactions: ddbData.reactionsDescription || '',
            legendaryActions: ddbData.legendaryActionsDescription || '',
            mythicActions: ddbData.mythicActionsDescription || '',
            lair: ddbData.lairActionsDescription || ''
        };

        // Filter out empty sections
        const activeSections = Object.entries(sections)
            .filter(([_, content]) => content && content.trim().length > 0)
            .map(([key, content]) => `### ${key.toUpperCase()}\n${content}`)
            .join('\n\n');

        return `You are helping to create concise, tactical descriptions of D&D 5e creature abilities for combat AI decision-making.

For the creature "${actor.name}", analyze the following ability descriptions from D&D Beyond and create a comprehensive action list:

IMPORTANT RULES:
1. Extract EVERY distinct combat action, ability, spell, and option
2. For Multiattack with multiple attack options, create separate entries for each attack pattern   
3. For abilities with multiple uses (spells, legendary actions, lair actions), create separate entries for each distinct option
4. Keep descriptions to a max 200 characters
   - Ensure to gather (if necissary): damage, range, targets, applied conditions
   - If special effects are mentioned or implied, include them with as much detail as possible while keeping to the word limit.
5. Parse HTML text and dice notation (e.g., "<span data-dicenotation="2d10+8">") to extract key information
6. Categorize activation times correctly: action, bonus, reaction, legendary, lair, mythic
7. Use consistent formatting for all names and descriptions:
   - Attacks: 
      - Name: "<name-of-action>"
      - Description: "<Melee/Ranged> <Spell/Weapon> Attack: +X to hit, range y/Y ft., target. Hit: Z (damage dice) type [+ additional effects]"
      - Example: 
         \`\`\`json
         {
            "name": "Bow Attack",
            "description": "Ranged Weapon Attack: +5 to hit, range 60/120 ft., target. Hit: 1d6+3 piercing damage.",
            "activationTime": "action",
            "itemType": "weapon"
         }
         \`\`\`
   - Saves: 
      - Name: "<name-of-action>"
      - Description: "<Target(s)>. DC X [ability] save or [effect]. On save: [reduced effect]"
      - Example: 
         \`\`\`json
         {
            "name": "Knock Down",
            "description": "15 foot cone from self. DC 15 STR save or take 3d6 bludgeoning damage and be knocked prone. On save: half damage, not prone.",
            "activationTime": "action",
            "itemType": "weapon"
         }
         \`\`\`
   - Spells:
      - Name: "<name-of-spell> (Spell)"
      - Description: "x/day, [spell level] spell. [effect] [success effect]"
      - Inate Example: 
         \`\`\`json
         {
            "name": "Misty Step (Spell)",
            "description": "1/day, 2nd-level spell. Target can teleport up to 30 feet to an unoccupied space.",
            "activationTime": "bonus",
            "itemType": "spell"
         }
         \`\`\`
      - Slot Example: 
         \`\`\`json
         {
            "name": "Fireball (Spell)",
            "description": "3rd-level spell. Can Be upcast. 20-ft radius, 150 ft. range. DC 15 DEX save or take 8d6 fire damage. On save: half damage.",
            "activationTime": "action",
            "itemType": "spell"
         }
         \`\`\`
   - Recharge abilities: 
      - Name: "<name-of-action> (Recharge X-Y)"
      - Description: "[description]"
   - Multiattack:
      - when there are multiple attack options, create separate entries for each attack pattern
         - e.g. if Multiattack says 3 bites or claw attacks, create separate entries for each:
            - 3 bites
            - 3 claws
            - 2 claws + 1 bite
            - 2 bites + 1 claw
      - Only use action names such as "Makes 3 Bite Attacks" or "Makes 2 Claw and 1 Bite Attacks"
      - Example:
         \`\`\`json
         {
            "name": "Multiattack (3 Bow Attacks)",
            "description": "Make 3 bow attacks.",
            "activationTime": "action",
            "itemType": "weapon"
         },
         {
            "name": "Multiattack (2 Bow Attacks, 1 Knock Down)",
            "description": "Make 2 bow attacks and use Knock Down.",
            "activationTime": "action",
            "itemType": "weapon"
         }
         \`\`\`
   - Ensure that the actions referenced in Multiattack are included in the final list as their own entries   
   - Legendary/Mythic Actions: 
      - If an action doesn't specify a cost, assume it costs 1 action
      - If an action references other actions, replace the legendary/mythic action's description with the description from the referenced action
      - Name: "<name-of-action> (<Legendary/Mythic> - <cost> Actions)"
      - Description: "[description]"
      - Example:
         \`\`\`json
         {
            "name": "Bow Attack (Legendary - 1 Action)",
            "description": "Ranged Weapon Attack: +5 to hit, range 60/120 ft., target. Hit: 1d6+3 piercing damage.",
            "activationTime": "legendary",
            "itemType": "weapon"
         }
         \`\`\`
      - Example:
         \`\`\`json
         {
            "name": "Fireball (Mythic - 1 Action)",
            "description": "3rd-level spell. Can Be upcast. 20-ft radius, 150 ft. range. DC 15 DEX save or take 8d6 fire damage. On save: half damage.",
            "activationTime": "mythic",
            "itemType": "spell"
         }
         \`\`\`

Ability Data:
${activeSections}

Respond with a JSON array where each entry has this exact structure:
{
    "name": "ability name (with variants if applicable)",
    "description": "concise tactical description",
    "activationTime": "action/bonus/reaction/legendary/lair/mythic/special",
    "itemType": "feat/spell/weapon"
}

EXAMPLES:
- From Multiattack with options: Create multiple entries for each attack pattern
- From Spellcasting list: Create separate entry for each spell
- From Legendary Actions: Create entry for each legendary action option
- Extract damage from HTML: "<span data-dicenotation="2d10+8">" → "2d10+8"

Respond ONLY with the JSON array, no other text.`;
    }

    /**
     * Extract raw action data from actor items
     */
    extractRawActions(actor) {
        const rawActions = [];

        if (!actor.items) return rawActions;

        actor.items.forEach(item => {
            try {
                if (item.system?.activities && typeof item.system.activities === 'object') {
                    const activityEntries = item.system.activities instanceof Map 
                        ? Array.from(item.system.activities.entries())
                        : Object.entries(item.system.activities);
                    
                    if (activityEntries.length === 0) return;

                    // Collect all activation times
                    const activationTimes = activityEntries
                        .map(([_, activity]) => activity?.activation?.type)
                        .filter(type => type);
                    
                    let activationTime = 'action';
                    if (activationTimes.length === 1) {
                        activationTime = activationTimes[0];
                    } else if (activationTimes.length > 1) {
                        const uniqueTimes = [...new Set(activationTimes)];
                        activationTime = uniqueTimes.length === 1 ? uniqueTimes[0] : 'multiple';
                    }

                    // Extract detailed information for LLM processing
                    const actionInfo = {
                        name: item.name,
                        itemType: item.type,
                        activationTime: activationTime,
                        rawDescription: item.system.description?.value || '',
                        activities: activityEntries.map(([id, activity]) => ({
                            type: activity.type,
                            activationType: activity.activation?.type,
                            damage: this.extractDamageInfo(activity),
                            range: this.extractRangeInfo(activity),
                            target: this.extractTargetInfo(activity),
                            save: this.extractSaveInfo(activity),
                            healing: this.extractHealingInfo(activity)
                        }))
                    };

                    rawActions.push(actionInfo);
                }
            } catch (error) {
                console.warn(`${MODULE_TITLE} | Error extracting action from item ${item.name}:`, error);
                // Continue processing other items
            }
        });

        return rawActions;
    }

    /**
     * Extract damage information from activity
     */
    extractDamageInfo(activity) {
        if (activity.damage?.parts) {
            // Handle both Map and Array formats
            const parts = activity.damage.parts instanceof Map
                ? Array.from(activity.damage.parts.values())
                : activity.damage.parts;
            
            if (parts.length > 0) {
                return parts.map(part => {
                    // Handle both array [formula, type] and object {formula, type} formats
                    if (Array.isArray(part)) {
                        return {
                            formula: part[0],
                            type: part[1]
                        };
                    } else if (typeof part === 'object') {
                        return {
                            formula: part.formula || part.number || '',
                            type: part.type || part.denomination || ''
                        };
                    }
                    return null;
                }).filter(p => p !== null);
            }
        }
        return null;
    }

    /**
     * Extract range information from activity
     */
    extractRangeInfo(activity) {
        if (activity.range) {
            return {
                value: activity.range.value,
                units: activity.range.units,
                long: activity.range.long
            };
        }
        return null;
    }

    /**
     * Extract target information from activity
     */
    extractTargetInfo(activity) {
        if (activity.target?.affects) {
            return {
                count: activity.target.affects.count,
                type: activity.target.affects.type
            };
        }
        return null;
    }

    /**
     * Extract save information from activity
     */
    extractSaveInfo(activity) {
        if (activity.save) {
            return {
                ability: activity.save.ability,
                dc: activity.save.dc
            };
        }
        return null;
    }

    /**
     * Extract healing information from activity
     */
    extractHealingInfo(activity) {
        if (activity.healing) {
            return activity.healing;
        }
        return null;
    }

    /**
     * Build prompt for LLM to create action descriptions
     */
    buildDescriptionPrompt(actor, rawActions) {
        const actionsJson = JSON.stringify(rawActions, null, 2);
        
        return `You are helping to create concise, tactical descriptions of D&D 5e creature abilities for combat AI decision-making.

For the creature "${actor.name}", analyze ALL the following abilities and create a comprehensive action list:

IMPORTANT RULES:
1. Extract EVERY distinct combat action, ability, spell, and option
2. Merge related actions intelligently (e.g., "Multiattack" with multiple attack options should list all variants)
3. For abilities with multiple uses (spells, legendary actions, lair actions), create separate entries for each distinct option
4. Keep descriptions concise (max 200 characters) focusing on: damage, range, targets, applied conditions, and special effects
5. Categorize activation times correctly: action, bonus, reaction, legendary, lair, mythic, special
6. Extract all numerical values from damage formulas and modifiers
7. Use consistent formatting for all names and descriptions:
   - Attacks: 
      - Name: "<name-of-action>"
      - Description: "<Melee/Ranged> <Spell/Weapon> Attack: +X to hit, range y/Y ft., target. Hit: Z (damage dice) type [+ additional effects]"
      - Example: 
         \`\`\`json
         {
            "name": "Bow Attack",
            "description": "Ranged Weapon Attack: +5 to hit, range 60/120 ft., target. Hit: 1d6+3 piercing damage.",
            "activationTime": "action",
            "itemType": "weapon"
         }
         \`\`\`
   - Saves: 
      - Name: "<name-of-action>"
      - Description: "<Target(s)>. DC X [ability] save or [effect]. On save: [reduced effect]"
      - Example: 
         \`\`\`json
         {
            "name": "Knock Down",
            "description": "15 foot cone from self. DC 15 STR save or take 3d6 bludgeoning damage and be knocked prone. On save: half damage, not prone.",
            "activationTime": "action",
            "itemType": "weapon"
         }
         \`\`\`
   - Spells:
      - Name: "<name-of-spell> (Spell)"
      - Description: "x/day, [spell level] spell. [effect] [success effect]"
      - Inate Example: 
         \`\`\`json
         {
            "name": "Misty Step (Spell)",
            "description": "1/day, 2nd-level spell. Target can teleport up to 30 feet to an unoccupied space.",
            "activationTime": "bonus",
            "itemType": "spell"
         }
         \`\`\`
      - Slot Example: 
         \`\`\`json
         {
            "name": "Fireball (Spell)",
            "description": "3rd-level spell. Can Be upcast. 20-ft radius, 150 ft. range. DC 15 DEX save or take 8d6 fire damage. On save: half damage.",
            "activationTime": "action",
            "itemType": "spell"
         }
         \`\`\`
   - Recharge abilities: 
      - Name: "<name-of-action> (Recharge X-Y)"
      - Description: "[description]"
   - Multiattack:
      - when there are multiple attack options, create separate entries for each attack pattern
         - e.g. if Multiattack says 3 bites or claw attacks, create separate entries for each:
            - 3 bites
            - 3 claws
            - 2 claws + 1 bite
            - 2 bites + 1 claw
      - Only use action names such as "Makes 3 Bite Attacks" or "Makes 2 Claw and 1 Bite Attacks"
      - Example:
         \`\`\`json
         {
            "name": "Multiattack (3 Bow Attacks)",
            "description": "Make 3 bow attacks.",
            "activationTime": "action",
            "itemType": "weapon"
         },
         {
            "name": "Multiattack (2 Bow Attacks, 1 Knock Down)",
            "description": "Make 2 bow attacks and use Knock Down.",
            "activationTime": "action",
            "itemType": "weapon"
         }
         \`\`\`
   - Ensure that the actions referenced in Multiattack are included in the final list as their own entries   
   - Legendary/Mythic Actions: 
      - If an action doesn't specify a cost, assume it costs 1 action
      - If an action references other actions, replace the legendary/mythic action's description with the description from the referenced action
      - Name: "<name-of-action> (<Legendary/Mythic> - <cost> Actions)"
      - Description: "[description]"
      - Example:
         \`\`\`json
         {
            "name": "Bow Attack (Legendary - 1 Action)",
            "description": "Ranged Weapon Attack: +5 to hit, range 60/120 ft., target. Hit: 1d6+3 piercing damage.",
            "activationTime": "legendary",
            "itemType": "weapon"
         }
         \`\`\`
      - Example:
         \`\`\`json
         {
            "name": "Fireball (Mythic - 1 Action)",
            "description": "3rd-level spell. Can Be upcast. 20-ft radius, 150 ft. range. DC 15 DEX save or take 8d6 fire damage. On save: half damage.",
            "activationTime": "mythic",
            "itemType": "spell"
         }
         \`\`\`

Raw ability data:
${actionsJson}

Respond with a JSON array where each entry has this exact structure:
{
    "name": "ability name (with variants if applicable)",
    "description": "concise tactical description following formatting rules",
    "activationTime": "action/bonus/reaction/legendary/lair/mythic/special",
    "itemType": "feat/spell/weapon"
}

EXAMPLES:
- "Multiattack (3 Bites)": "Make three bite attacks, each +7 to hit, 2d6+4 piercing"
- "Multiattack (2 Claws, 1 Bite)": "+6 to hit. Two claws 1d8+3 slashing, one bite +7 to hit 2d6+4 piercing"
- "Fire Breath (Recharge 5-6)": "60-ft cone. DC 18 Dex save or 56 (16d6) fire damage, half on success"
- "Legendary Claw": "Legendary Action (1 Action): Melee Weapon Attack: +6 to hit, 1d8+3 slashing"
- "Spellcasting (Fireball)": "1/day: 8d6 fire damage, 20-ft radius, DC 15 Dex save for half"

Respond ONLY with the JSON array, no other text.`;
    }

    /**
     * Parse LLM response into action descriptions
     */
    parseActionDescriptions(response, rawActions) {
        try {
            // Try to extract JSON from response
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (!jsonMatch) {
                throw new Error('No JSON array found in response');
            }

            const parsed = JSON.parse(jsonMatch[0]);
            
            if (!Array.isArray(parsed)) {
                throw new Error('Response is not an array');
            }

            return parsed;
        } catch (error) {
            console.error(`${MODULE_TITLE} | Failed to parse LLM response:`, error);
            // Fallback to cleaned raw actions
            return rawActions.map(action => ({
                name: action.name,
                description: this.cleanDescription(action.rawDescription),
                activationTime: action.activationTime,
                itemType: action.itemType
            }));
        }
    }

    /**
     * Clean HTML from description
     */
    cleanDescription(description) {
        if (!description) return 'No description available';
        
        let cleaned = description.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        if (cleaned.length > 150) {
            cleaned = cleaned.substring(0, 147) + '...';
        }
        return cleaned;
    }

    /**
     * Clear cache for specific actor or all actors
     */
    clearCache(actorId = null) {
        if (actorId) {
            this.cache.delete(actorId);
            if (game.settings.get(MODULE_ID, 'debugMode')) {
                console.debug(`${MODULE_TITLE} | Cleared cache for actor ${actorId}`);
            }
        } else {
            this.cache.clear();
            if (game.settings.get(MODULE_ID, 'debugMode')) {
                console.debug(`${MODULE_TITLE} | Cleared entire action cache`);
            }
        }
    }

    /**
     * Clear expired cache entries
     */
    clearExpiredCache() {
        const now = Date.now();
        let cleared = 0;
        
        for (const [actorId, cached] of this.cache.entries()) {
            const age = now - cached.timestamp;
            if (age >= this.cacheTimeout) {
                this.cache.delete(actorId);
                cleared++;
            }
        }

        if (cleared > 0 && game.settings.get(MODULE_ID, 'debugMode')) {
            console.debug(`${MODULE_TITLE} | Cleared ${cleared} expired cache entries`);
        }
    }
}
