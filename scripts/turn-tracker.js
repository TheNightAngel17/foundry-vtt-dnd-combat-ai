/**
 * Turn Tracker - Tracks combat turn descriptions and actor state changes
 */

import { MODULE_ID, MODULE_TITLE } from './main.js';

export class TurnTracker {
    constructor() {
        this.previousSnapshot = null;
        this.currentSnapshot = null;
        this.turnHistory = [];
        this.currentCombat = null;
    }

    /**
     * Take a snapshot of all actors in combat
     * @param {Combat} combat - The combat instance
     * @returns {Object} Snapshot of all actor states
     */
    takeSnapshot(combat) {
        if (!combat || !combat.combatants) return null;

        const snapshot = {
            round: combat.round,
            turn: combat.turn,
            timestamp: Date.now(),
            actors: {}
        };

        for (const combatant of combat.combatants) {
            if (!combatant.actor) continue;

            const actor = combatant.actor;
            const token = combatant.token;

            snapshot.actors[combatant.id] = {
                id: combatant.id,
                name: actor.name,
                hp: actor.system.attributes.hp.value,
                tempHp: actor.system.attributes.hp.temp || 0,
                maxHp: actor.system.attributes.hp.max,
                position: {
                    x: token?.x || 0,
                    y: token?.y || 0
                },
                conditions: this.getActorConditions(actor)
            };
        }

        return snapshot;
    }

    /**
     * Get conditions applied to an actor
     * @param {Actor} actor - The actor to get conditions from
     * @returns {Array} Array of condition names
     */
    getActorConditions(actor) {
        const conditions = [];
        
        // Check for status effects
        if (actor.statuses) {
            for (const status of actor.statuses) {
                conditions.push(status);
            }
        }

        // Check for active effects (alternative method)
        if (actor.effects) {
            for (const effect of actor.effects) {
                if (effect.disabled) continue;
                
                // Get label from effect
                const label = effect.name || effect.label;
                if (label && !conditions.includes(label)) {
                    conditions.push(label);
                }
            }
        }

        return conditions;
    }

    /**
     * Compare two snapshots and generate state change descriptions
     * @param {Object} previous - Previous snapshot
     * @param {Object} current - Current snapshot
     * @returns {Array} Array of state change strings
     */
    compareSnapshots(previous, current) {
        const changes = [];
        if (!previous || !current) return changes;

        // Compare each actor
        for (const [combatantId, currentState] of Object.entries(current.actors)) {
            const previousState = previous.actors[combatantId];
            
            if (!previousState) {
                // New combatant added
                changes.push(`- ${currentState.name}: Entered combat`);
                continue;
            }

            const actorChanges = [];

            // HP changes
            if (currentState.hp !== previousState.hp) {
                actorChanges.push(`Current HP ${previousState.hp} -> ${currentState.hp}`);
            }

            // Temp HP changes
            if (currentState.tempHp !== previousState.tempHp) {
                actorChanges.push(`Temp HP ${previousState.tempHp} -> ${currentState.tempHp}`);
            }

            // Position changes (calculate distance and direction)
            const distanceInfo = this.calculateMovement(previousState.position, currentState.position);
            if (distanceInfo.distance > 0) {
                actorChanges.push(`Moved ${distanceInfo.distance} ft @ ${distanceInfo.direction}°`);
            }

            // Condition changes
            const conditionChanges = this.compareConditions(previousState.conditions, currentState.conditions);
            if (conditionChanges.gained.length > 0) {
                actorChanges.push(`Gained Conditions: ${conditionChanges.gained.join(', ')}`);
            }
            if (conditionChanges.lost.length > 0) {
                actorChanges.push(`Lost Conditions: ${conditionChanges.lost.join(', ')}`);
            }

            // Add all changes for this actor
            if (actorChanges.length > 0) {
                changes.push(`- ${currentState.name}: ${actorChanges.join('; ')}`);
            }
        }

        // Check for removed combatants
        for (const [combatantId, previousState] of Object.entries(previous.actors)) {
            if (!current.actors[combatantId]) {
                changes.push(`- ${previousState.name}: Left combat`);
            }
        }

        return changes;
    }

    /**
     * Calculate movement distance and direction
     * @param {Object} from - Starting position {x, y}
     * @param {Object} to - Ending position {x, y}
     * @returns {Object} {distance: number (in feet), direction: number (in degrees)}
     */
    calculateMovement(from, to) {
        const dx = to.x - from.x;
        const dy = to.y - from.y;

        // Distance in pixels
        const pixelDistance = Math.sqrt(dx * dx + dy * dy);
        
        // Convert to feet (assuming standard 5ft grid, 100 pixels = 1 grid square)
        const gridSize = canvas?.grid?.size || 100;
        const gridDistance = pixelDistance / gridSize;
        const feetDistance = Math.round(gridDistance * 5);

        // Calculate angle (0° = East, 90° = South, 180° = West, 270° = North)
        let angle = Math.atan2(dy, dx) * (180 / Math.PI);
        
        // Convert to compass bearing (0° = North, 90° = East, 180° = South, 270° = West)
        angle = (90 - angle + 360) % 360;
        angle = Math.round(angle);

        return {
            distance: feetDistance,
            direction: angle
        };
    }

    /**
     * Compare condition lists
     * @param {Array} previous - Previous conditions
     * @param {Array} current - Current conditions
     * @returns {Object} {gained: Array, lost: Array}
     */
    compareConditions(previous, current) {
        const gained = current.filter(c => !previous.includes(c));
        const lost = previous.filter(c => !current.includes(c));

        return { gained, lost };
    }

    /**
     * Prompt GM for turn description
     * @param {Combat} combat - The combat instance
     * @param {Combatant} combatant - The combatant whose turn just ended
     */
    async promptTurnDescription(combat, combatant) {
        if (!game.user.isGM) return;

        
        // Take current snapshot
        this.currentSnapshot = this.takeSnapshot(combat);

        if (game.settings.get(MODULE_ID, 'debugMode')) {
            console.log(`${MODULE_TITLE} | Comparing snapshots:`, {
                previous: this.previousSnapshot,
                current: this.currentSnapshot
            });
        }

        // Compare with previous snapshot to get state changes
        const stateChanges = this.compareSnapshots(this.previousSnapshot, this.currentSnapshot);

        // Build the markdown template with pre-filled state changes
        const stateChangesText = stateChanges.length > 0 
            ? stateChanges.join('\n')
            : '- No significant state changes detected';

        const template = `### Actions Taken\n\n### Reactions Taken\n\n### Environment Changes\n\n### State Changes\n${stateChangesText}\n`;

        // Create dialog for GM input
        const turnDescription = await this.showDescriptionDialog(combatant, template, combat);

        if (turnDescription !== null) {
            // Store in history
            this.addToHistory(combat, combatant, turnDescription);
            
            // Update previous snapshot
            this.previousSnapshot = this.currentSnapshot;

            // Debug logging
            if (game.settings.get(MODULE_ID, 'debugMode')) {
                console.log(`${MODULE_TITLE} | Turn Description Submitted:`, {
                    round: combat.round,
                    turn: combat.turn,
                    combatant: combatant.name,
                    description: turnDescription
                });
                console.log(`${MODULE_TITLE} | Combat History:`, this.turnHistory);
            }
        }
    }

    /**
     * Show dialog for turn description input
     * @param {Combatant} combatant - The combatant whose turn just ended
     * @param {string} template - The markdown template with pre-filled data
     * @param {Combat} combat - The combat instance
     * @returns {Promise<string|null>} The entered description or null if cancelled
     */
    async showDescriptionDialog(combatant, template, combat) {
        return new Promise((resolve) => {
            const dialog = new Dialog({
                title: `Turn Description - ${combatant.name || combatant.actor?.name || 'Unknown'} (Round ${combat.round}, Turn ${combat.turn + 1})`,
                content: `
                    <form>
                        <div class="form-group">
                            <label for="turn-description">Describe what happened this turn:</label>
                            <textarea 
                                id="turn-description" 
                                name="turn-description" 
                                rows="20" 
                                style="width: 100%; font-family: monospace; resize: vertical;"
                            >${template}</textarea>
                        </div>
                        <p style="font-size: 0.9em; color: #666; margin-top: 10px;">
                            Edit the description above. State changes have been pre-filled.
                        </p>
                    </form>
                `,
                buttons: {
                    submit: {
                        icon: '<i class="fas fa-check"></i>',
                        label: "Submit",
                        callback: (html) => {
                            const description = html.find('#turn-description').val();
                            resolve(description);
                        }
                    },
                    cancel: {
                        icon: '<i class="fas fa-times"></i>',
                        label: "Cancel",
                        callback: () => resolve(null)
                    }
                },
                default: "submit",
                close: () => resolve(null)
            }, {
                width: 600,
                height: "auto"
            });

            dialog.render(true);
        });
    }

    /**
     * Add turn description to history
     * @param {Combat} combat - The combat instance
     * @param {Combatant} combatant - The combatant whose turn ended
     * @param {string} description - The turn description
     */
    addToHistory(combat, combatant, description) {
        const entry = {
            round: combat.round,
            turn: combat.turn,
            combatantId: combatant.id,
            combatantName: combatant.name || combatant.actor?.name || 'Unknown',
            actorId: combatant.actor?.id,
            initiative: combatant.initiative,
            timestamp: Date.now(),
            description: description,
            snapshot: this.currentSnapshot
        };

        this.turnHistory.push(entry);
    }

    /**
     * Initialize tracking for a new combat
     * @param {Combat} combat - The combat instance
     */
    onCombatStart(combat) {
        this.currentCombat = combat;
        this.turnHistory = [];
        this.previousSnapshot = this.takeSnapshot(combat);
        this.currentSnapshot = null;


        if (game.settings.get(MODULE_ID, 'debugMode')) {
            console.log(`${MODULE_TITLE} | Turn tracking initialized for combat`);
        }
    }

    /**
     * Clean up when combat ends
     * @param {Combat} combat - The combat instance
     */
    onCombatEnd(combat) {
        if (game.settings.get(MODULE_ID, 'debugMode')) {
            console.log(`${MODULE_TITLE} | Combat ended. Final turn history:`, this.turnHistory);
        }
        this.clearHistory();

        this.currentCombat = null;
        // Note: We keep turnHistory for post-combat review until next combat starts
    }

    /**
     * Handle turn change - this is called at the END of a turn, before moving to next
     * @param {Combat} combat - The combat instance
     * @param {number} previousTurn - The turn index that just ended
     */
    async onTurnEnd(combat, previousTurn) {
        if (!game.user.isGM) return;
        if (!game.settings.get(MODULE_ID, 'enableTurnTracking')) return;

        const previousCombatant = combat.turns[previousTurn];



        if (!previousCombatant) return;

        // Prompt for description of what happened on the turn that just ended
        await this.promptTurnDescription(combat, previousCombatant);
    }

    /**
     * Get the complete turn history
     * @returns {Array} The turn history array
     */
    getHistory() {
        return this.turnHistory;
    }

    /**
     * Clear turn history
     */
    clearHistory() {
        this.turnHistory = [];
        this.previousSnapshot = null;
        this.currentSnapshot = null;
        
        if (game.settings.get(MODULE_ID, 'debugMode')) {
            console.log(`${MODULE_TITLE} | Turn history cleared`);
        }
    }
}
