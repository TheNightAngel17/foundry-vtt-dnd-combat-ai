/**
 * Combat Tracker UI Extensions
 * Adds custom UI elements to the combat tracker
 */

import { MODULE_ID, MODULE_TITLE } from './main.js';

export class CombatTrackerUI {
    /**
     * Initialize combat tracker UI hooks
     */
    static init() {
        Hooks.on('renderCombatTracker', CombatTrackerUI._onRenderCombatTracker);
    }

    /**
     * Handle combat tracker rendering
     * @param {CombatTracker} app - The combat tracker application
     * @param {HTMLElement} element - The rendered HTML element
     * @param {Object} data - The render data
     */
    static _onRenderCombatTracker(app, element, data) {
        // Convert to jQuery if needed
        const html = $(element);
        
        // Add the brain button to the header
        CombatTrackerUI._addBrainButton(html);
        
        // Add the textarea between combatant list and nav
        CombatTrackerUI._addTextArea(html);
    }

    /**
     * Add the brain button to the combat tracker header
     * @param {jQuery} html - The combat tracker HTML
     */
    static _addBrainButton(html) {
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
                    data-tooltip="Toggle Combat AI Notes" 
                    aria-label="Toggle Combat AI Notes"
                    data-toggled="false">
            </button>
        `);

        // Add click handler for toggle functionality
        button.on('click', (event) => {
            event.preventDefault();
            
            // Toggle the state
            const isToggled = button.attr('data-toggled') === 'true';
            const newState = !isToggled;
            
            button.attr('data-toggled', newState.toString());
            
            // Find the notes section
            const notesSection = html.find('.dnd-combat-ai-notes');
            
            if (newState) {
                button.addClass('toggled');
                notesSection.slideDown(200); // Smooth slide down animation
                ui.notifications.info(`${MODULE_TITLE}: Combat Notes shown`);
            } else {
                button.removeClass('toggled');
                notesSection.slideUp(200); // Smooth slide up animation
                ui.notifications.info(`${MODULE_TITLE}: Combat Notes hidden`);
            }
            
            console.log(`${MODULE_TITLE} | Combat Notes toggled:`, newState);
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
    static _addTextArea(html) {
        // Check if we already added the textarea (prevent duplicates)
        if (html.find('.dnd-combat-ai-notes').length > 0) {
            console.log(`${MODULE_TITLE} | Textarea already exists, skipping`);
            return;
        }
        
        // Find the combatant list using the correct selector
        const combatantList = html.find('ol[data-application-part="tracker"]');
        
        if (combatantList.length === 0) {
            console.warn(`${MODULE_TITLE} | Could not find combatant list`);
            return;
        }

        // Create the textarea container (initially hidden)
        const textareaContainer = $(`
            <div class="dnd-combat-ai-notes" style="display: none;">
                <label for="dnd-combat-ai-textarea">Combat Notes:</label>
                <textarea id="dnd-combat-ai-textarea" 
                          placeholder="Add combat notes here..."
                          rows="4"></textarea>
            </div>
        `);

        // Insert after the combatant list
        textareaContainer.insertAfter(combatantList);
        
        console.log(`${MODULE_TITLE} | Added textarea to combat tracker (initially hidden)`);
    }
}
