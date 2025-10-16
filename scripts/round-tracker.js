/**
 * Round Tracker - Tracks combat rounds, snapshots, and GM descriptions
 */

import { MODULE_ID, MODULE_TITLE } from './main.js';

export class RoundTracker {
    constructor() {
        this.roundHistory = [];
        this.currentSnapshot = null;
        this.previousSnapshot = null;
    }

    /**
     * Create a snapshot of all combatants in the current state
     */
    createCombatantSnapshot(combat) {
        if (!combat || !combat.combatants) {
            return null;
        }

        const snapshot = {
            round: combat.round,
            combatants: []
        };

        combat.combatants.forEach(combatant => {
            if (!combatant.actor) return;

            const actor = combatant.actor;
            const token = combatant.token;
            
            snapshot.combatants.push({
                id: combatant.id,
                name: actor.name,
                hp: {
                    current: actor.system.attributes.hp.value,
                    max: actor.system.attributes.hp.max
                },
                position: token ? { x: token.x, y: token.y } : null,
                conditions: this.getActorConditions(actor),
                isNPC: !actor.hasPlayerOwner
            });
        });

        return snapshot;
    }

    /**
     * Get actor conditions
     */
    getActorConditions(actor) {
        const conditions = [];
        
        if (actor.effects) {
            actor.effects.forEach(effect => {
                if (!effect.disabled) {
                    conditions.push({
                        name: effect.name || effect.label,
                        id: effect.id
                    });
                }
            });
        }

        return conditions;
    }

    /**
     * Compare two snapshots and generate a difference summary
     */
    generateSnapshotDiff(previousSnapshot, currentSnapshot) {
        if (!previousSnapshot || !currentSnapshot) {
            return '';
        }

        const changes = [];

        // Compare each combatant
        currentSnapshot.combatants.forEach(currentCombatant => {
            const previousCombatant = previousSnapshot.combatants.find(
                c => c.id === currentCombatant.id
            );

            if (!previousCombatant) {
                // New combatant added
                changes.push(`${currentCombatant.name} joined the combat`);
                return;
            }

            // Check HP changes
            const hpDiff = currentCombatant.hp.current - previousCombatant.hp.current;
            if (hpDiff < 0) {
                changes.push(`${currentCombatant.name} took ${Math.abs(hpDiff)} damage (${previousCombatant.hp.current} → ${currentCombatant.hp.current} HP)`);
            } else if (hpDiff > 0) {
                changes.push(`${currentCombatant.name} healed ${hpDiff} HP (${previousCombatant.hp.current} → ${currentCombatant.hp.current} HP)`);
            }

            // Check position changes
            if (currentCombatant.position && previousCombatant.position) {
                const dx = currentCombatant.position.x - previousCombatant.position.x;
                const dy = currentCombatant.position.y - previousCombatant.position.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // If moved more than half a grid square (considering typical grid size)
                if (distance > 50) {
                    const feet = Math.round(distance / canvas.grid.size) * 5;
                    changes.push(`${currentCombatant.name} moved approximately ${feet} ft`);
                }
            }

            // Check condition changes
            const previousConditionIds = new Set(previousCombatant.conditions.map(c => c.name));
            const currentConditionIds = new Set(currentCombatant.conditions.map(c => c.name));

            // New conditions
            currentCombatant.conditions.forEach(condition => {
                if (!previousConditionIds.has(condition.name)) {
                    changes.push(`${currentCombatant.name} gained condition: ${condition.name}`);
                }
            });

            // Removed conditions
            previousCombatant.conditions.forEach(condition => {
                if (!currentConditionIds.has(condition.name)) {
                    changes.push(`${currentCombatant.name} lost condition: ${condition.name}`);
                }
            });
        });

        // Check for removed combatants
        previousSnapshot.combatants.forEach(previousCombatant => {
            const exists = currentSnapshot.combatants.find(c => c.id === previousCombatant.id);
            if (!exists) {
                changes.push(`${previousCombatant.name} left the combat`);
            }
        });

        return changes.join('\n');
    }

    /**
     * Start tracking a new round
     */
    onRoundStart(combat) {
        if (!combat) return;

        // Store previous snapshot
        this.previousSnapshot = this.currentSnapshot;
        
        // Create new snapshot
        this.currentSnapshot = this.createCombatantSnapshot(combat);

        if (game.settings.get(MODULE_ID, 'debugMode')) {
            console.debug(`${MODULE_TITLE} | Round ${combat.round} snapshot created`, this.currentSnapshot);
        }
    }

    /**
     * Prompt GM to describe the round
     */
    async promptRoundDescription(combat) {
        if (!game.user.isGM) return;
        if (!game.settings.get(MODULE_ID, 'enableRoundTracking')) return;

        const round = combat.round;
        
        // Generate diff from previous round
        const diffText = this.generateSnapshotDiff(this.previousSnapshot, this.currentSnapshot);
        
        // Build pre-filled description
        let prefilledDescription = '';
        if (diffText) {
            prefilledDescription = `Round ${round} Summary:\n\n${diffText}\n\nAdditional notes: `;
        } else {
            prefilledDescription = `Round ${round} begins...\n\n`;
        }

        return new Promise((resolve) => {
            new Dialog({
                title: `Round ${round} Description`,
                content: `
                    <div class="round-tracker-dialog">
                        <p>Describe what happened during round ${round} of combat:</p>
                        ${diffText ? `
                            <div class="auto-detected-changes">
                                <h4>Auto-detected changes:</h4>
                                <pre>${diffText}</pre>
                            </div>
                        ` : ''}
                        <div class="form-group">
                            <label for="round-description">Round Description:</label>
                            <textarea id="round-description" rows="6" style="width: 100%; resize: vertical;">${prefilledDescription}</textarea>
                        </div>
                    </div>
                    <style>
                        .round-tracker-dialog .auto-detected-changes {
                            margin: 10px 0;
                            padding: 10px;
                            background: #f0f0f0;
                            border-left: 3px solid #782e22;
                        }
                        .round-tracker-dialog .auto-detected-changes h4 {
                            margin: 0 0 5px 0;
                            color: #782e22;
                        }
                        .round-tracker-dialog .auto-detected-changes pre {
                            margin: 0;
                            white-space: pre-wrap;
                            font-family: inherit;
                            font-size: 0.9em;
                        }
                        .round-tracker-dialog .form-group {
                            margin-top: 10px;
                        }
                        .round-tracker-dialog label {
                            font-weight: bold;
                            display: block;
                            margin-bottom: 5px;
                        }
                    </style>
                `,
                buttons: {
                    save: {
                        icon: '<i class="fas fa-save"></i>',
                        label: 'Save Description',
                        callback: (html) => {
                            const description = html.find('#round-description').val();
                            this.saveRoundDescription(round, description);
                            resolve(description);
                        }
                    },
                    skip: {
                        icon: '<i class="fas fa-times"></i>',
                        label: 'Skip',
                        callback: () => {
                            resolve(null);
                        }
                    }
                },
                default: 'save',
                close: () => resolve(null)
            }, {
                width: 600
            }).render(true);
        });
    }

    /**
     * Save round description to history
     */
    saveRoundDescription(round, description) {
        if (!description || !description.trim()) return;

        this.roundHistory.push({
            round: round,
            description: description.trim(),
            snapshot: this.currentSnapshot,
            timestamp: Date.now()
        });

        if (game.settings.get(MODULE_ID, 'debugMode')) {
            console.debug(`${MODULE_TITLE} | Round ${round} description saved`, description);
        }

        ui.notifications.info(`${MODULE_TITLE}: Round ${round} description saved`);
    }

    /**
     * Get round history formatted for LLM prompts
     */
    getRoundHistoryForPrompt(maxRounds = null) {
        if (!game.settings.get(MODULE_ID, 'enableRoundTracking')) {
            return '';
        }

        if (this.roundHistory.length === 0) {
            return '';
        }

        // Get the most recent rounds
        const historyToInclude = maxRounds 
            ? this.roundHistory.slice(-maxRounds)
            : this.roundHistory;

        if (historyToInclude.length === 0) {
            return '';
        }

        const historyText = historyToInclude
            .map(entry => `Round ${entry.round}: ${entry.description}`)
            .join('\n\n');

        return `\n\nCombat History:\n${historyText}`;
    }

    /**
     * Clear round history (when combat ends)
     */
    clearHistory() {
        this.roundHistory = [];
        this.currentSnapshot = null;
        this.previousSnapshot = null;
        
        if (game.settings.get(MODULE_ID, 'debugMode')) {
            console.debug(`${MODULE_TITLE} | Round history cleared`);
        }
    }

    /**
     * Get full round history (for debugging or export)
     */
    getFullHistory() {
        return {
            roundHistory: this.roundHistory,
            currentSnapshot: this.currentSnapshot,
            previousSnapshot: this.previousSnapshot
        };
    }
}
