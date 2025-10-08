/**
 * Action Cache - Caches LLM-generated action descriptions for NPCs
 */

import { MODULE_ID, MODULE_TITLE } from './main.js';

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
        const rawActions = this.extractRawActions(actor);
        
        if (rawActions.length === 0) {
            return [];
        }

        // Build prompt for LLM to create concise descriptions
        const prompt = this.buildDescriptionPrompt(actor, rawActions);
        
        try {
            const response = await aiService.chat(prompt);
            const parsedActions = this.parseActionDescriptions(response, rawActions);
            
            if (game.settings.get(MODULE_ID, 'debugMode')) {
                console.debug(`${MODULE_TITLE} | Generated ${parsedActions.length} action descriptions for ${actor.name}`);
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

For the creature "${actor.name}", I need you to analyze the following abilities and create clear, concise descriptions (max 100 words each) that focus on:
1. What the ability does mechanically
2. Key tactical considerations (damage, range, targets, special effects)
3. If one item has multiple distinct activities, note them separately

Here is the raw ability data:
${actionsJson}

Please respond with a JSON array where each entry has:
{
    "name": "ability name",
    "description": "concise tactical description",
    "activationTime": "action/bonus/reaction/multiple",
    "itemType": "feat/spell/weapon"
}

If a single item has multiple distinct usable activities (like a staff that can cast fireball AND lightning bolt), create separate entries for each distinct use.

Respond ONLY with valid JSON, no additional text.`;
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
        if (cleaned.length > 100) {
            cleaned = cleaned.substring(0, 97) + '...';
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
