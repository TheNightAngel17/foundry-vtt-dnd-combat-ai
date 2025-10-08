/**
 * D&D Combat AI Module
 * Provides AI-powered combat assistance for NPCs in D&D 5e
 */

import { CombatAIManager } from './combat-ai-manager.js';
import { CombatAISettings } from './settings.js';
import { CombatAIUI } from './ui.js';

// Module constants
const MODULE_ID = 'dnd-combat-ai';
const MODULE_TITLE = 'D&D Combat AI';

// Global module reference
let combatAIManager = null;

/**
 * Module initialization
 */
Hooks.once('init', async function() {
    console.log(`${MODULE_TITLE} | Initializing module`);
    
    // Register module settings
    CombatAISettings.registerSettings();
    
    // Initialize the combat AI manager
    combatAIManager = new CombatAIManager();
    
    // Make it globally accessible for UI
    window.combatAIManager = combatAIManager;
    
    console.log(`${MODULE_TITLE} | Module initialized`);
});

/**
 * Setup hooks once the game is ready
 */
Hooks.once('ready', async function() {
    console.log(`${MODULE_TITLE} | Game ready, setting up combat hooks`);
    
    // Initialize UI components
    CombatAIUI.initialize();
    
    // Set up combat hooks
    setupCombatHooks();
    
    console.log(`${MODULE_TITLE} | Module ready`);
});

/**
 * Set up combat-related hooks
 */
function setupCombatHooks() {
    // Hook into combat turn changes
    Hooks.on('combatTurn', onCombatTurn);
    
    // Hook into combat start
    Hooks.on('combatStart', onCombatStart);
    
    // Hook into combat end
    Hooks.on('combatEnd', onCombatEnd);
}

/**
 * Handle combat turn changes
 */
async function onCombatTurn(combat, updateData, options) {
    console.log(`${MODULE_TITLE} | Combat turn changed`);
    
    if (!combat) return;
    
    const currentCombatant = combat.turns[updateData.turn];
    if (!currentCombatant) return;
    
    // Check if current combatant is an NPC
    if (currentCombatant.actor && !currentCombatant.actor.hasPlayerOwner) {
        console.log(`${MODULE_TITLE} | NPC turn detected: ${currentCombatant.actor.name}`);
        
        // Only proceed if AI assistance is enabled
        if (game.settings.get(MODULE_ID, 'enableAI')) {
            await combatAIManager.handleNPCTurn(combat, currentCombatant);
        }
    }
}

/**
 * Handle combat start
 */
function onCombatStart(combat) {
    console.log(`${MODULE_TITLE} | Combat started`);
    if (combatAIManager) {
        combatAIManager.onCombatStart(combat);
    }
}

/**
 * Handle combat end
 */
function onCombatEnd(combat) {
    console.log(`${MODULE_TITLE} | Combat ended`);
    if (combatAIManager) {
        combatAIManager.onCombatEnd(combat);
    }
}

// Export module ID for use in other files
export { MODULE_ID, MODULE_TITLE };