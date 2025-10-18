/**
 * D&D Combat AI Module
 * Provides AI-powered combat assistance for NPCs in D&D 5e
 */

import { CombatAIManager } from './combat-ai-manager.js';
import { CombatAISettings } from './settings.js';
import { CombatAIUI } from './ui.js';
import { TurnTracker } from './turn-tracker.js';

// Module constants
const MODULE_ID = 'dnd-combat-ai';
const MODULE_TITLE = 'D&D Combat AI';

// Global module reference
let combatAIManager = null;
let turnTracker = null;

/**
 * Module initialization
 */
Hooks.once('init', async function() {
    console.log(`${MODULE_TITLE} | Initializing module`);
    
    // Register module settings
    CombatAISettings.registerSettings();
    
    // Initialize the combat AI manager
    combatAIManager = new CombatAIManager();
    
    // Initialize the turn tracker
    turnTracker = new TurnTracker();
    
    // Link them together
    combatAIManager.setTurnTracker(turnTracker);
    
    // Make them globally accessible for UI
    window.combatAIManager = combatAIManager;
    window.turnTracker = turnTracker;
    
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
    
    // Hook into combat round changes (for first turn of new round)
    Hooks.on('combatRound', onCombatRound);
    
    // Hook into combat start
    Hooks.on('combatStart', onCombatStart);
    
    // Hook into combat end
    Hooks.on('combatEnd', onCombatEnd);
    
    // Hook into combatant creation to pre-cache NPC actions
    Hooks.on('createCombatant', onCreateCombatant);
}

/**
 * Handle NPC turn (shared logic for turn and round changes)
 */
async function handleNPCTurnIfNeeded(combat, turnIndex, context) {
    const currentCombatant = combat?.turns?.[turnIndex];
    console.log(`${MODULE_TITLE} | Current combatant (${context}):`, currentCombatant?.name || currentCombatant?.actor?.name || 'none', currentCombatant);
    
    if (!combat || !currentCombatant) return;

    // Check if current combatant is an NPC
    if (currentCombatant.actor && !currentCombatant.actor.hasPlayerOwner) {
        console.log(`${MODULE_TITLE} | NPC turn detected (${context}): ${currentCombatant.actor.name}`);

        // Only proceed if AI assistance is enabled
        if (game.settings.get(MODULE_ID, 'enableAI')) {
            await combatAIManager.handleNPCTurn(combat, currentCombatant);
        }
    }
}

/**
 * Handle combat turn changes
 */
async function onCombatTurn(combat, updateData, options) {
    console.log(`${MODULE_TITLE} | Combat turn changed`);
    
    // Handle turn tracking FIRST - for the turn that just ended
    // The previous turn is the one before updateData.turn
    const previousTurn = updateData.turn > 0 ? updateData.turn - 1 : combat.turns.length - 1;
    if (turnTracker && updateData.turn !== 0) {
        // Only track if not the first turn of combat (turn 0)
        await turnTracker.onTurnEnd(combat, previousTurn);
    }
    
    // THEN handle NPC AI for the new turn
    await handleNPCTurnIfNeeded(combat, updateData.turn, 'turn change');
}

/**
 * Handle combat round changes (first turn of new round)
 */
async function onCombatRound(combat, updateData, options) {
    console.log(`${MODULE_TITLE} | Combat round changed to round ${updateData.round}`);
    
    // Handle turn tracking FIRST - for the last turn of the previous round
    // Only if this is not the first round
    if (turnTracker && updateData.round > 1) {
        const lastTurn = combat.turns.length - 1;
        await turnTracker.onTurnEnd(combat, lastTurn);
    }
    
    // THEN handle NPC AI for the first combatant of the new round (turn 0)
    await handleNPCTurnIfNeeded(combat, 0, 'round change');
}

/**
 * Handle combat start
 */
async function onCombatStart(combat) {
    console.log(`${MODULE_TITLE} | Combat started`);
    if (turnTracker) {
        turnTracker.onCombatStart(combat);
    }
    if (combatAIManager) {
        combatAIManager.onCombatStart(combat);
        await handleNPCTurnIfNeeded(combat, 0, 'round change');
    }
}

/**
 * Handle combatant creation - pre-cache NPC actions
 */
async function onCreateCombatant(combatant, options, userId) {
    // Only proceed if AI is enabled and this is an NPC
    if (!game.settings.get(MODULE_ID, 'enableAI')) return;
    if (!combatant.actor || combatant.actor.hasPlayerOwner) return;
    
    console.log(`${MODULE_TITLE} | NPC added to combat: ${combatant.actor.name}, pre-caching actions...`);
    
    try {
        await combatAIManager.actorLlmActions.getActorActions(combatant.actor, combatAIManager.llmConnector);
        console.log(`${MODULE_TITLE} | Successfully cached actions for ${combatant.actor.name}`);
    } catch (error) {
        console.error(`${MODULE_TITLE} | Failed to cache actions for ${combatant.actor.name}:`, error);
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
    if (turnTracker) {
        turnTracker.onCombatEnd(combat);
    }
}

// Export module ID for use in other files
export { MODULE_ID, MODULE_TITLE };