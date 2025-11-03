/**
 * Combat Tracker UI Extensions
 * Adds custom UI elements to the combat tracker
 */

import { MODULE_ID, MODULE_TITLE } from './main.js';

export class CombatTrackerUI {
    constructor() {
        this.turnData = []; // Array of {round, turn, combatantId, actorId, description, snapshot}
        this.isEnabled = false;
        this.currentCombat = null;
        this.previousCombatantId = null; // Track the previous combatant for saving
    }

    /**
     * Initialize combat tracker UI hooks
     */
    static init() {
        // Only initialize for GMs
        if (!game.user?.isGM) {
            return;
        }
        
        // Create singleton instance
        if (!window.combatTrackerUI) {
            window.combatTrackerUI = new CombatTrackerUI();
        }
        
        Hooks.on('renderCombatTracker', CombatTrackerUI._onRenderCombatTracker);
    }

    /**
     * Handle combat tracker rendering
     * @param {CombatTracker} app - The combat tracker application
     * @param {HTMLElement} element - The rendered HTML element
     * @param {Object} data - The render data
     */
    static _onRenderCombatTracker(app, element, data) {
        // Only show combat tracker UI elements to GMs
        if (!game.user.isGM) return;
        
        const tracker = window.combatTrackerUI;
        if (!tracker) return;

        // Convert to jQuery if needed
        const html = $(element);
        
        // Add the brain button to the header
        tracker._addBrainButton(html);
        
        // Add the textarea between combatant list and nav
        tracker._addTextArea(html);
        
        // Restore state if enabled
        if (tracker.isEnabled) {
            const button = html.find('.dnd-combat-ai-test-button');
            button.attr('data-toggled', 'true');
            button.addClass('toggled');
            html.find('.dnd-combat-ai-notes').show();
        }
    }

    /**
     * Add the brain button to the combat tracker header
     * @param {jQuery} html - The combat tracker HTML
     */
    _addBrainButton(html) {
        // Find the right control buttons area to add our button
        const rightControls = html.find('.encounter-controls .control-buttons.right');
        
        if (rightControls.length === 0) {
            console.warn(`${MODULE_TITLE} | Could not find combat tracker right controls`);
            return;
        }

        // Check if button already exists (prevent duplicates)
        if (html.find('.dnd-combat-ai-test-button').length > 0) {
            return;
        }

        // Create our custom toggle button (matching Foundry's inline-control style)
        const button = $(`
            <button type="button" class="inline-control combat-control icon fa-solid fa-brain dnd-combat-ai-test-button" 
                    data-tooltip="Toggle Combat AI Turn Tracking" 
                    aria-label="Toggle Combat AI Turn Tracking"
                    data-toggled="${this.isEnabled}">
            </button>
        `);

        // Add click handler for toggle functionality
        button.on('click', (event) => {
            event.preventDefault();
            
            // Toggle the state
            this.isEnabled = !this.isEnabled;
            
            button.attr('data-toggled', this.isEnabled.toString());
            
            // Find the notes section
            const notesSection = html.find('.dnd-combat-ai-notes');
            
            if (this.isEnabled) {
                button.addClass('toggled');
                notesSection.slideDown(200);
                if (game.user.isGM) {
                    ui.notifications.info(`${MODULE_TITLE}: Turn tracking enabled`);
                }
                
                // Load current turn data if in combat
                if (game.combat) {
                    this.onTurnChange(game.combat);
                }
            } else {
                button.removeClass('toggled');
                notesSection.slideUp(200);
                if (game.user.isGM) {
                    ui.notifications.info(`${MODULE_TITLE}: Turn tracking disabled`);
                }
            }
            
            console.log(`${MODULE_TITLE} | Turn tracking toggled:`, this.isEnabled);
        });

        // Insert before the spacer in the right controls
        const spacer = rightControls.find('.spacer');
        if (spacer.length > 0) {
            button.insertBefore(spacer);
        } else {
            // Fallback: prepend to right controls
            rightControls.prepend(button);
        }
    }

    /**
     * Add a textarea between the combatant list and navigation
     * @param {jQuery} html - The combat tracker HTML
     */
    _addTextArea(html) {
        // Check if we already added the textarea (prevent duplicates)
        if (html.find('.dnd-combat-ai-notes').length > 0) {
            return;
        }
        
        // Find the combatant list using the correct selector
        const combatantList = html.find('ol[data-application-part="tracker"]');
        
        if (combatantList.length === 0) {
            console.warn(`${MODULE_TITLE} | Could not find combatant list`);
            return;
        }

        // Create the textarea container (initially hidden unless enabled)
        const textareaContainer = $(`
            <div class="dnd-combat-ai-notes" style="display: ${this.isEnabled ? 'block' : 'none'};">
                <label for="dnd-combat-ai-textarea">Turn Notes:</label>
                <textarea id="dnd-combat-ai-textarea" 
                          placeholder="### Actions Taken\n\n### Reactions Taken\n\n### Environment Changes\n"
                          rows="8"></textarea>
            </div>
        `);

        // Add event listener for textarea changes
        const textarea = textareaContainer.find('textarea');
        textarea.on('blur', () => {
            this.saveTurnData();
        });

        // Insert after the combatant list
        textareaContainer.insertAfter(combatantList);
    }

    /**
     * Get the template for a new turn
     * @param {Combat} combat - The combat instance
     * @param {Combatant} combatant - The current combatant
     * @returns {string} The template text (without state changes)
     */
    getTurnTemplate(combat, combatant) {
        return `### Actions Taken\n\n### Reactions Taken\n\n### Environment Changes\n\n`;
    }

    /**
     * Find existing turn data for a specific round and combatant
     * @param {number} round - The combat round
     * @param {string} combatantId - The combatant ID
     * @returns {Object|null} The turn data or null if not found
     */
    findTurnData(round, combatantId) {
        return this.turnData.find(entry => 
            entry.round === round && entry.combatantId === combatantId
        );
    }

    /**
     * Save the current turn data
     * @param {string} combatantIdToSave - Optional specific combatant ID to save (defaults to current combatant)
     */
    saveTurnData(combatantIdToSave = null) {
        if (!this.isEnabled || !game.combat) return;

        const combat = game.combat;
        const round = combat.round;
        
        // Determine which combatant to save for
        let combatantId = combatantIdToSave || this.previousCombatantId;
        
        // If no specific ID provided and no previous tracked, use current
        if (!combatantId) {
            const combatant = combat.combatant;
            if (!combatant) return;
            combatantId = combatant.id;
        }
        
        // Find the combatant object
        const combatant = combat.combatants.get(combatantId);
        if (!combatant) return;

        const textarea = $('#dnd-combat-ai-textarea');
        if (textarea.length === 0) return;

        let description = textarea.val();
        const actorId = combatant.actor?.id;

        // Find the turn index for this combatant
        const turnIndex = combat.turns.findIndex(t => t.id === combatantId);

        // Check if description already contains state changes section
        const hasStateChanges = description.includes('### State Changes');
        
        // If no state changes section exists, append it
        if (!hasStateChanges) {
            const stateChanges = this.getStateChanges(combat);
            if (stateChanges.length > 0) {
                const stateChangesText = stateChanges.join('\n');
                description += `### State Changes (since last turn)\n${stateChangesText}\n`;
            }
        }

        // Find existing entry or create new one
        let entry = this.findTurnData(round, combatantId);
        
        if (entry) {
            // Update existing
            entry.description = description;
            entry.timestamp = Date.now();
        } else {
            // Create new entry
            entry = {
                round: round,
                turn: turnIndex, // Turn index for Combat AI Manager compatibility
                combatantId: combatantId,
                combatantName: combatant.name || combatant.actor?.name || 'Unknown',
                actorId: actorId,
                initiative: combatant.initiative,
                description: description,
                timestamp: Date.now(),
                snapshot: this.takeSnapshot(combat)
            };
            this.turnData.push(entry);
        }

        if (game.settings.get(MODULE_ID, 'debugMode')) {
            console.log(`${MODULE_TITLE} | Turn data saved:`, entry);
        }
    }

    /**
     * Load turn data into the UI
     * @param {Combat} combat - The combat instance
     * @param {number} turnIndex - Optional specific turn index to load (defaults to current turn)
     * @param {number} roundNumber - Optional specific round number to load (defaults to current round)
     */
    async onTurnChange(combat, turnIndex = null, roundNumber = null) {
        if (!this.isEnabled) return;

        // Use provided turn index or fall back to current turn
        const actualTurnIndex = turnIndex !== null ? turnIndex : combat.turn;
        const combatant = combat.turns?.[actualTurnIndex];
        
        if (!combatant) {
            console.warn(`${MODULE_TITLE} | No combatant found at turn index ${actualTurnIndex}`);
            return;
        }

        // Use provided round number or fall back to current round
        const round = roundNumber !== null ? roundNumber : combat.round;
        const combatantId = combatant.id;

        if (game.settings.get(MODULE_ID, 'debugMode')) {
            console.log(`${MODULE_TITLE} | onTurnChange - Loading turn ${actualTurnIndex} for ${combatant.name} (R${round})`);
        }

        // Update tracking for next save
        this.previousCombatantId = combatantId;

        // Find existing turn data
        const existingData = this.findTurnData(round, combatantId);

        const textarea = $('#dnd-combat-ai-textarea');
        if (textarea.length === 0) return;

        if (existingData) {
            // Load existing data (description already contains state changes if they were added)
            textarea.val(existingData.description);
            
            if (game.settings.get(MODULE_ID, 'debugMode')) {
                console.log(`${MODULE_TITLE} | Loaded existing turn data for R${round} - ${combatant.name}`);
            }
        } else {
            // Generate new template (just the editable sections)
            const template = this.getTurnTemplate(combat, combatant);
            textarea.val(template);
            
            if (game.settings.get(MODULE_ID, 'debugMode')) {
                console.log(`${MODULE_TITLE} | Created new turn template for R${round} - ${combatant.name}`);
            }
        }
    }

    /**
     * Get state changes since the last snapshot
     * @param {Combat} combat - The combat instance
     * @returns {Array} Array of state change strings
     */
    getStateChanges(combat) {
        const currentSnapshot = this.takeSnapshot(combat);
        const lastSnapshot = this.getLastSnapshot();
        
        if (lastSnapshot && currentSnapshot) {
            return this.compareSnapshots(lastSnapshot, currentSnapshot);
        }
        
        return [];
    }

    /**
     * Get the last snapshot from turn data
     * @returns {Object|null} The last snapshot or null
     */
    getLastSnapshot() {
        if (this.turnData.length === 0) return null;
        
        // Get the most recent entry with a snapshot
        const entriesWithSnapshots = this.turnData.filter(entry => entry.snapshot);
        if (entriesWithSnapshots.length === 0) return null;
        
        return entriesWithSnapshots[entriesWithSnapshots.length - 1].snapshot;
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
     * Handle combat start
     * @param {Combat} combat - The combat instance
     */
    onCombatStart(combat) {
        this.currentCombat = combat;
        this.turnData = [];
        
        if (game.settings.get(MODULE_ID, 'debugMode')) {
            console.log(`${MODULE_TITLE} | Combat tracker UI initialized for new combat`);
        }
    }

    /**
     * Handle combat end
     * @param {Combat} combat - The combat instance
     */
    onCombatEnd(combat) {
        this.currentCombat = null;
        
        if (game.settings.get(MODULE_ID, 'debugMode')) {
            console.log(`${MODULE_TITLE} | Combat tracker UI closed. Total turns tracked: ${this.turnData.length}`);
        }
    }

    /**
     * Get turn history
     * @returns {Array} The turn data array
     */
    getTurnHistory() {
        return this.turnData;
    }
}
