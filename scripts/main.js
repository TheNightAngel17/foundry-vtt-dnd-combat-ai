/**
 * D&D Combat AI Module
 * Provides AI-powered combat assistance for NPCs in D&D 5e
 */

import { CombatAIManager } from './combat-ai-manager.js';
import { CombatAISettings } from './settings.js';
import { CombatAIUI } from './ui.js';
import { TurnTracker } from './turn-tracker.js';
import { ActorActionsDialog } from './actor-actions-dialog.js';
import { CombatTrackerUI } from './combat-tracker-ui.js';

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
    
    // Register Handlebars helpers
    Handlebars.registerHelper('eq', function(a, b) {
        return a === b;
    });
    
    // Register module settings
    CombatAISettings.registerSettings();
    
    // Initialize combat tracker UI extensions
    CombatTrackerUI.init();
    
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

Hooks.once("init", () => {
  console.log(`${MODULE_TITLE} | 🧠 D&D5e header button hook registered`);

    Hooks.on("getHeaderControlsActorSheetV2", onGetActorSheetHeaderButtons);
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
    
    // Set up actor sheet hook
    
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
    
    // Show turn tracking dialog at the START of the turn FIRST (immediate feedback)
    if (turnTracker) {
        // Don't await - let it open asynchronously
        turnTracker.onTurnStart(combat, updateData.turn);
    }
    
    // THEN handle NPC AI for the new turn (may take time for LLM response)
    await handleNPCTurnIfNeeded(combat, updateData.turn, 'turn change');
}

/**
 * Handle combat round changes (first turn of new round)
 */
async function onCombatRound(combat, updateData, options) {
    console.log(`${MODULE_TITLE} | Combat round changed to round ${updateData.round}`);
    
    // Show turn tracking dialog at the START of the first turn FIRST (immediate feedback)
    if (turnTracker) {
        // Don't await - let it open asynchronously
        turnTracker.onTurnStart(combat, 0);
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
        await handleNPCTurnIfNeeded(combat, 0, 'combat start');
    }
    // Show turn tracking dialog for the first turn
    if (turnTracker) {
        await turnTracker.onTurnStart(combat, 0);
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

/**
 * Add "Manage AI Actions" button to actor sheet headers
 */
function onGetActorSheetHeaderButtons(app, buttons) {
    const actor = app.actor;
    
    // Only add button for GMs
    if (!game.user.isGM) {
        if (game.settings.get(MODULE_ID, 'debugMode')) {
            console.debug(`${MODULE_TITLE} | Skipping - user is not a GM`);
        }
        return;
    }
    
    // Only add button if user is owner
    if (!actor?.isOwner) {
        if (game.settings.get(MODULE_ID, 'debugMode')) {
            console.debug(`${MODULE_TITLE} | Skipping - user is not owner`);
        }
        return;
    }
    
    // Only add button for NPC actors
    if (!actor || actor.hasPlayerOwner) {
        if (game.settings.get(MODULE_ID, 'debugMode')) {
            console.debug(`${MODULE_TITLE} | Skipping - not an NPC`);
        }
        return;
    }

    // Check if it's a character or NPC sheet
    const isCharacterSheet = app.constructor.name === "ActorSheet5eCharacter";
    const isNpcSheet = app.constructor.name === "NPCActorSheet";

    if (!isCharacterSheet && !isNpcSheet) {
        if (game.settings.get(MODULE_ID, 'debugMode')) {
            console.debug(`${MODULE_TITLE} | Unknown sheet type: ${app.constructor.name}`);
        }
    }

    if (game.settings.get(MODULE_ID, 'debugMode')) {
        console.debug(`${MODULE_TITLE} | Adding AI Actions button to ${actor.name}`);
    }

    app.options.actions["dd-ai-actions"] = () => {
            if (game.settings.get(MODULE_ID, 'debugMode')) {
                console.debug(`${MODULE_TITLE} | AI Actions button clicked for ${actor.name}`);
            }
            if (combatAIManager) {
                const dialog = new ActorActionsDialog(
                    actor,
                    combatAIManager.actorLlmActions,
                    combatAIManager.llmConnector
                );
                dialog.render(true);
            } else {
                console.error(`${MODULE_TITLE} | combatAIManager not initialized`);
            }
        };
    buttons.unshift({
        label: "AI Actions",
        class: "combat-ai-actions-button",
        icon: "fas fa-brain",
        action: "dd-ai-actions"
    });
}

// Export module ID for use in other files
export { MODULE_ID, MODULE_TITLE };