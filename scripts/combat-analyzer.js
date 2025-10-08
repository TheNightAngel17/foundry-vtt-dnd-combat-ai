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

        // Add class features and spells if available
        if (actor.items) {
            actor.items.forEach(item => {
                if (item.type === 'feat' && item.system.activation?.type) {
                    actions.push({
                        name: item.name,
                        description: item.system.description?.value || 'Special ability',
                        type: item.system.activation.type,
                        uses: item.system.uses
                    });
                } else if (item.type === 'spell' && item.system.preparation?.prepared) {
                    actions.push({
                        name: item.name,
                        description: item.system.description?.value || 'Spell',
                        type: 'action',
                        level: item.system.level,
                        school: item.system.school
                    });
                } else if (item.type === 'weapon') {
                    actions.push({
                        name: `Attack with ${item.name}`,
                        description: `${item.system.damage?.parts?.[0]?.[0] || '1d6'} damage`,
                        type: 'action',
                        range: item.system.range
                    });
                }
            });
        }

        return actions;
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