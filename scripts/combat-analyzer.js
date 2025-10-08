/**
 * Combat Analyzer - Analyzes combat situations for AI decision making
 */

import { MODULE_ID, MODULE_TITLE } from './main.js';

export class CombatAnalyzer {
    /**
     * Analyze the current combat situation for AI decision making
     */
    analyzeCombatSituation(combat, currentCombatant) {
        const actor = currentCombatant.actor;
        
        const situation = {
            currentNPC: this.analyzeNPC(actor, currentCombatant),
            round: combat.round,
            turn: combat.turn,
            initiativeOrder: this.getInitiativeOrder(combat),
            availableActions: this.getAvailableActions(actor),
            enemies: this.getEnemies(combat, currentCombatant),
            allies: this.getAllies(combat, currentCombatant),
            recentActions: this.getRecentActions(combat),
            battlefieldConditions: this.getBattlefieldConditions(combat)
        };

        if (game.settings.get(MODULE_ID, 'debugMode')) {
            console.debug(`${MODULE_TITLE} | Combat situation analyzed`, situation);
        }

        return situation;
    }

    /**
     * Analyze the current NPC
     */
    analyzeNPC(actor, combatant) {
        const token = combatant.token;
        
        return {
            name: actor.name,
            type: actor.type,
            hp: {
                current: actor.system.attributes.hp.value,
                max: actor.system.attributes.hp.max,
                percentage: Math.round((actor.system.attributes.hp.value / actor.system.attributes.hp.max) * 100)
            },
            ac: actor.system.attributes.ac.value,
            speed: actor.system.attributes.movement?.walk || 30,
            position: token ? { x: token.x, y: token.y } : null,
            conditions: this.getActorConditions(actor),
            resources: this.getActorResources(actor)
        };
    }

    /**
     * Get available actions for the actor
     */
    getAvailableActions(actor) {
        const actions = [];

        if (game.settings.get(MODULE_ID, 'debugMode')) {
            console.debug(`${MODULE_TITLE} | Getting available actions for ${actor.name}`);
            console.debug(`${MODULE_TITLE} | Actor has items:`, !!actor.items);
            console.debug(`${MODULE_TITLE} | Items type:`, actor.items?.constructor?.name);
        }

        // Basic actions
        actions.push(
            { name: 'Attack', description: 'Make a weapon or spell attack', type: 'action' },
            { name: 'Dash', description: 'Move up to your speed', type: 'action' },
            { name: 'Dodge', description: 'Focus on avoiding attacks', type: 'action' },
            { name: 'Help', description: 'Give an ally advantage on their next check', type: 'action' },
            { name: 'Hide', description: 'Make a Stealth check', type: 'action' },
            { name: 'Ready', description: 'Prepare an action for a specific trigger', type: 'action' },
            { name: 'Search', description: 'Look for something', type: 'action' }
        );

        // Extract all activities from items
        if (actor.items) {
            if (game.settings.get(MODULE_ID, 'debugMode')) {
                console.debug(`${MODULE_TITLE} | Processing ${actor.items.size || actor.items.length} items for ${actor.name}`);
            }

            actor.items.forEach(item => {
                if (game.settings.get(MODULE_ID, 'debugMode')) {
                    console.debug(`${MODULE_TITLE} | Item: ${item.name}, Type: ${item.type}, Has activities: ${!!item.system?.activities}`, item.system?.activities);
                }

                // Check if the item has activities (new dnd5e system structure)
                if (item.system?.activities && typeof item.system.activities === 'object') {
                    const activityEntries = Object.entries(item.system.activities);
                    
                    if (game.settings.get(MODULE_ID, 'debugMode')) {
                        console.debug(`${MODULE_TITLE} | Found ${activityEntries.length} activities in ${item.name}`);
                    }

                    activityEntries.forEach(([activityId, activity]) => {
                        if (!activity || typeof activity !== 'object') {
                            if (game.settings.get(MODULE_ID, 'debugMode')) {
                                console.warn(`${MODULE_TITLE} | Invalid activity in ${item.name}: ${activityId}`, activity);
                            }
                            return;
                        }

                        const actionData = {
                            itemName: item.name,
                            itemType: item.type,
                            activityId: activityId,
                            activityType: activity.type,
                            name: `${item.name}${activity.type ? ` (${activity.type})` : ''}`,
                            description: this.extractActivityDescription(item, activity),
                            activation: activity.activation,
                            uses: activity.uses || item.system.uses,
                            consumption: activity.consumption,
                            range: activity.range,
                            target: activity.target,
                            duration: activity.duration
                        };

                        // Add activity-specific details
                        if (activity.type === 'attack') {
                            actionData.attack = activity.attack;
                            actionData.damage = activity.damage;
                        } else if (activity.type === 'save') {
                            actionData.save = activity.save;
                            actionData.damage = activity.damage;
                        } else if (activity.type === 'heal') {
                            actionData.healing = activity.healing;
                        } else if (activity.type === 'utility') {
                            actionData.roll = activity.roll;
                        }

                        actions.push(actionData);

                        if (game.settings.get(MODULE_ID, 'debugMode')) {
                            console.debug(`${MODULE_TITLE} | Added activity: ${actionData.name}`);
                        }
                    });
                }
                // Fallback for legacy items without activities
                else if (item.type === 'feat' && item.system.activation?.type) {
                    actions.push({
                        itemName: item.name,
                        itemType: item.type,
                        name: item.name,
                        description: item.system.description?.value || 'Special ability',
                        activation: item.system.activation,
                        uses: item.system.uses
                    });
                } else if (item.type === 'spell' && item.system.preparation?.prepared) {
                    actions.push({
                        itemName: item.name,
                        itemType: item.type,
                        name: item.name,
                        description: item.system.description?.value || 'Spell',
                        activation: { type: 'action', value: 1 },
                        level: item.system.level,
                        school: item.system.school
                    });
                } else if (item.type === 'weapon') {
                    actions.push({
                        itemName: item.name,
                        itemType: item.type,
                        name: `Attack with ${item.name}`,
                        description: `${item.system.damage?.parts?.[0]?.[0] || '1d6'} damage`,
                        activation: { type: 'action', value: 1 },
                        range: item.system.range
                    });
                }
            });
        }

        if (game.settings.get(MODULE_ID, 'debugMode')) {
            console.debug(`${MODULE_TITLE} | Total actions found: ${actions.length}`, actions);
        }

        return actions;
    }

    /**
     * Extract a clean description from an activity
     */
    extractActivityDescription(item, activity) {
        // Try to get description from activity first, then item
        let description = activity.description?.value || item.system.description?.value || '';
        
        // Clean HTML tags for a simpler text representation
        if (description) {
            // Remove HTML tags but keep the text content
            description = description.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
            // Limit length for AI context
            if (description.length > 500) {
                description = description.substring(0, 497) + '...';
            }
        }
        
        return description || `${activity.type} activity`;
    }

    /**
     * Get initiative order information
     */
    getInitiativeOrder(combat) {
        return combat.combatants.map(c => ({
            name: c.actor?.name || 'Unknown',
            initiative: c.initiative,
            hp: c.actor ? `${c.actor.system.attributes.hp.value}/${c.actor.system.attributes.hp.max}` : 'Unknown',
            isNPC: c.actor ? !c.actor.hasPlayerOwner : false,
            isActive: c.id === combat.combatant?.id
        })).sort((a, b) => (b.initiative || 0) - (a.initiative || 0));
    }

    /**
     * Get enemy combatants
     */
    getEnemies(combat, currentCombatant) {
        const currentActor = currentCombatant.actor;
        if (!currentActor) return [];

        return combat.combatants.filter(c => {
            if (!c.actor || c.id === currentCombatant.id) return false;
            
            // NPCs are enemies of PCs, PCs are enemies of NPCs
            return currentActor.hasPlayerOwner !== c.actor.hasPlayerOwner;
        }).map(c => this.analyzeCombatant(c, currentCombatant));
    }

    /**
     * Get allied combatants
     */
    getAllies(combat, currentCombatant) {
        const currentActor = currentCombatant.actor;
        if (!currentActor) return [];

        return combat.combatants.filter(c => {
            if (!c.actor || c.id === currentCombatant.id) return false;
            
            // NPCs are allies of NPCs, PCs are allies of PCs
            return currentActor.hasPlayerOwner === c.actor.hasPlayerOwner;
        }).map(c => this.analyzeCombatant(c, currentCombatant));
    }

    /**
     * Analyze a combatant relative to the current combatant
     */
    analyzeCombatant(combatant, currentCombatant) {
        const actor = combatant.actor;
        const token = combatant.token;
        const currentToken = currentCombatant.token;

        let distance = 'Unknown';
        if (token && currentToken) {
            const dx = token.x - currentToken.x;
            const dy = token.y - currentToken.y;
            distance = Math.round(Math.sqrt(dx * dx + dy * dy) / canvas.grid.size) * 5; // Convert to feet
        }

        return {
            name: actor.name,
            hp: `${actor.system.attributes.hp.value}/${actor.system.attributes.hp.max}`,
            hpPercentage: Math.round((actor.system.attributes.hp.value / actor.system.attributes.hp.max) * 100),
            ac: actor.system.attributes.ac.value,
            distance: `${distance} ft`,
            conditions: this.getActorConditions(actor),
            unconscious: actor.system.attributes.hp.value <= 0,
            position: token ? { x: token.x, y: token.y } : null
        };
    }

    /**
     * Get recent combat actions (placeholder - would need to track actions)
     */
    getRecentActions(combat) {
        // In a full implementation, this would track and return recent actions
        // For now, return placeholder data
        return [
            { actor: 'Previous Turn', action: 'Used a spell attack' },
            { actor: 'Two turns ago', action: 'Moved and attacked' }
        ];
    }

    /**
     * Get battlefield conditions and environmental factors
     */
    getBattlefieldConditions(combat) {
        // Placeholder for environmental analysis
        // In a full implementation, this would analyze:
        // - Lighting conditions
        // - Terrain features
        // - Active area effects
        // - Cover and concealment
        return {
            lighting: 'Normal',
            terrain: 'Open ground',
            activeEffects: [],
            cover: 'None'
        };
    }

    /**
     * Get actor conditions and status effects
     */
    getActorConditions(actor) {
        const conditions = [];
        
        if (actor.effects) {
            actor.effects.forEach(effect => {
                if (!effect.disabled) {
                    conditions.push({
                        name: effect.name || effect.label,
                        description: effect.description || 'Active condition'
                    });
                }
            });
        }

        return conditions;
    }

    /**
     * Get actor resources (spell slots, abilities, etc.)
     */
    getActorResources(actor) {
        const resources = {};

        // Spell slots
        if (actor.system.spells) {
            Object.entries(actor.system.spells).forEach(([level, data]) => {
                if (data.max > 0) {
                    resources[`spell${level}`] = {
                        current: data.value,
                        max: data.max
                    };
                }
            });
        }

        // Other resources
        if (actor.system.resources) {
            Object.entries(actor.system.resources).forEach(([key, resource]) => {
                if (resource.max > 0) {
                    resources[key] = {
                        current: resource.value,
                        max: resource.max,
                        label: resource.label
                    };
                }
            });
        }

        return resources;
    }
}