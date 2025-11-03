/**
 * Combat AI UI - User interface components and interactions
 */

import { MODULE_ID, MODULE_TITLE } from './main.js';
import { LLMConnector } from './llm-connector.js';

export class CombatAIUI {
    /**
     * Initialize UI components
     */
    static initialize() {
        this.addCombatControls();
        this.addSettingsButton();
    }

    /**
     * Add combat controls to the combat tracker
     * TODO: Re-enable this feature once UI injection is more stable
     */
    static addCombatControls() {
        // Temporarily disabled - causing issues with hook errors
        /*
        Hooks.on('renderCombatTracker', (app, html, data) => {
            if (!game.user.isGM) return;

            // Ensure html is a jQuery object - handle both jQuery objects and HTML elements
            const $html = html instanceof jQuery ? html : $(html);

            const header = $html.find('.window-title');
            if (header.length === 0) return;

            // Add AI difficulty selector
            const difficultyControl = $(`
                <div class="combat-ai-controls" style="margin-top: 5px;">
                    <label>AI Difficulty:</label>
                    <select id="ai-difficulty-select" style="margin-left: 5px;">
                        <option value="easy">Easy</option>
                        <option value="normal">Normal</option>
                        <option value="hard">Hard</option>
                        <option value="deadly">Deadly</option>
                        <option value="tpk">TPK</option>
                    </select>
                </div>
            `);

            header.after(difficultyControl);

            // Set current value
            const currentDifficulty = game.settings.get(MODULE_ID, 'aiDifficulty');
            difficultyControl.find('#ai-difficulty-select').val(currentDifficulty);

            // Handle difficulty change
            difficultyControl.find('#ai-difficulty-select').on('change', (event) => {
                const newDifficulty = event.target.value;
                game.settings.set(MODULE_ID, 'aiDifficulty', newDifficulty);
                ui.notifications.info(`${MODULE_TITLE}: AI difficulty set to ${newDifficulty.toUpperCase()}`);
            });

            // Add manual AI button for current combatant
            if (game.combat?.combatant?.actor && !game.combat.combatant.actor.hasPlayerOwner) {
                const aiButton = $(`
                    <button class="combat-ai-manual" style="margin-top: 5px;" title="Get AI recommendations for current NPC">
                        <i class="fas fa-brain"></i> Get AI Advice
                    </button>
                `);

                difficultyControl.append(aiButton);

                aiButton.on('click', () => {
                    this.requestManualAI();
                });
            }
        });
        */
    }

    /**
     * Add settings button to scene controls
     */
    static addSettingsButton() {
        Hooks.on('getSceneControlButtons', (controls) => {
            if (!game.user.isGM) return;

            const tokenControls = controls.find(c => c.name === 'token');
            if (!tokenControls) return;

            tokenControls.tools.push({
                name: 'combat-ai',
                title: 'Combat AI Settings',
                icon: 'fas fa-brain',
                button: true,
                onClick: () => this.openSettingsDialog()
            });
        });
    }

    /**
     * Request manual AI assistance
     */
    static async requestManualAI() {
        // Only allow GMs to use this feature
        if (!game.user.isGM) {
            return;
        }
        
        if (!game.combat?.combatant) {
            ui.notifications.warn(`${MODULE_TITLE}: No active combatant`);
            return;
        }

        const combatant = game.combat.combatant;
        if (combatant.actor.hasPlayerOwner) {
            ui.notifications.warn(`${MODULE_TITLE}: Current combatant is a player character`);
            return;
        }

        ui.notifications.info(`${MODULE_TITLE}: Generating AI recommendations...`);

        try {
            // Use the global combat AI manager
            if (window.combatAIManager) {
                await window.combatAIManager.handleNPCTurn(game.combat, combatant);
            } else {
                ui.notifications.error(`${MODULE_TITLE}: Combat AI manager not initialized`);
            }
        } catch (error) {
            console.error(`${MODULE_TITLE} | Manual AI request failed:`, error);
            ui.notifications.error(`${MODULE_TITLE}: Failed to generate recommendations`);
        }
    }

    /**
     * Open settings dialog
     */
    static openSettingsDialog() {
        CombatAISettingsDialog.show();
    }

    /**
     * Create quick difficulty buttons
     */
    static createDifficultyButtons() {
        const difficulties = ['easy', 'normal', 'hard', 'deadly', 'tpk'];
        const currentDifficulty = game.settings.get(MODULE_ID, 'aiDifficulty');

        const buttonsHtml = difficulties.map(diff => {
            const active = diff === currentDifficulty ? 'active' : '';
            const label = diff.charAt(0).toUpperCase() + diff.slice(1);
            return `<button class="difficulty-btn ${active}" data-difficulty="${diff}">${label}</button>`;
        }).join('');

        return `
            <div class="difficulty-buttons">
                <h3>AI Difficulty</h3>
                <div class="button-group">
                    ${buttonsHtml}
                </div>
            </div>
        `;
    }
}

/**
 * Settings dialog for Combat AI
 */
class CombatAISettingsDialog extends foundry.applications.api.DialogV2 {
    static async show() {
        return this.wait({
            window: { 
                title: `${MODULE_TITLE} Settings`,
                icon: 'fas fa-brain'
            },
            position: {
                width: 500
            },
            content: this.getContent(),
            buttons: [
                {
                    action: 'save',
                    label: 'Save',
                    icon: 'fas fa-save',
                    default: true,
                    callback: (event, button, dialog) => this.saveSettings(dialog)
                },
                {
                    action: 'cancel',
                    label: 'Cancel',
                    icon: 'fas fa-times'
                }
            ],
            render: (event, dialog) => this.activateListeners(dialog),
            close: () => {}
        });
    }

    static getContent() {
        return `
            <div class="combat-ai-settings">
                <div class="form-group">
                    <label>Enable AI Assistance:</label>
                    <input type="checkbox" id="enable-ai" ${game.settings.get(MODULE_ID, 'enableAI') ? 'checked' : ''}>
                </div>
                
                <div class="form-group">
                    <label>LLM Provider:</label>
                    <select id="llm-provider">
                        <option value="openai" ${game.settings.get(MODULE_ID, 'llmProvider') === 'openai' ? 'selected' : ''}>OpenAI</option>
                        <option value="anthropic" ${game.settings.get(MODULE_ID, 'llmProvider') === 'anthropic' ? 'selected' : ''}>Anthropic</option>
                        <option value="local" ${game.settings.get(MODULE_ID, 'llmProvider') === 'local' ? 'selected' : ''}>Local LLM</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label>API Key:</label>
                    <input type="password" id="api-key" value="${game.settings.get(MODULE_ID, 'apiKey')}" placeholder="Enter your API key">
                </div>
                
                <div class="form-group">
                    <label>Auto-display Recommendations:</label>
                    <input type="checkbox" id="auto-display" ${game.settings.get(MODULE_ID, 'autoDisplay') ? 'checked' : ''}>
                </div>
                
                <div class="form-group">
                    <button type="button" id="test-connection">Test Connection</button>
                    <span id="connection-status"></span>
                </div>
                
                ${CombatAIUI.createDifficultyButtons()}
            </div>
            
            <style>
                .combat-ai-settings .form-group {
                    margin-bottom: 10px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                
                .combat-ai-settings label {
                    min-width: 150px;
                    font-weight: bold;
                }
                
                .combat-ai-settings input, .combat-ai-settings select {
                    flex: 1;
                }
                
                .difficulty-buttons {
                    margin-top: 20px;
                    text-align: center;
                }
                
                .button-group {
                    display: flex;
                    gap: 5px;
                    justify-content: center;
                    margin-top: 10px;
                }
                
                .difficulty-btn {
                    padding: 5px 15px;
                    border: 1px solid #ccc;
                    background: #f0f0f0;
                    cursor: pointer;
                }
                
                .difficulty-btn.active {
                    background: #007bff;
                    color: white;
                    border-color: #007bff;
                }
                
                #test-connection {
                    padding: 5px 15px;
                    background: #28a745;
                    color: white;
                    border: none;
                    cursor: pointer;
                }
                
                #connection-status {
                    margin-left: 10px;
                    font-weight: bold;
                }
            </style>
        `;
    }

    static activateListeners(dialog) {
        const html = dialog.element;

        // Test connection button
        const testButton = html.querySelector('#test-connection');
        const status = html.querySelector('#connection-status');
        
        testButton?.addEventListener('click', async () => {
            testButton.disabled = true;
            testButton.textContent = 'Testing...';
            status.textContent = '';

            try {
                const connector = new LLMConnector();
                const result = await connector.testConnection();
                
                if (result.success) {
                    status.textContent = '✓ Connected';
                    status.style.color = 'green';
                } else {
                    status.textContent = `✗ Failed: ${result.error}`;
                    status.style.color = 'red';
                }
            } catch (error) {
                status.textContent = `✗ Error: ${error.message}`;
                status.style.color = 'red';
            } finally {
                testButton.disabled = false;
                testButton.textContent = 'Test Connection';
            }
        });

        // Difficulty buttons
        const difficultyButtons = html.querySelectorAll('.difficulty-btn');
        difficultyButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                difficultyButtons.forEach(btn => btn.classList.remove('active'));
                event.target.classList.add('active');
            });
        });
    }

    static async saveSettings(dialog) {
        const html = dialog.element;
        
        const settings = {
            enableAI: html.querySelector('#enable-ai').checked,
            llmProvider: html.querySelector('#llm-provider').value,
            apiKey: html.querySelector('#api-key').value,
            autoDisplay: html.querySelector('#auto-display').checked,
            aiDifficulty: html.querySelector('.difficulty-btn.active')?.dataset.difficulty || 'normal'
        };

        for (const [key, value] of Object.entries(settings)) {
            await game.settings.set(MODULE_ID, key, value);
        }

        if (game.user.isGM) {
            ui.notifications.info(`${MODULE_TITLE}: Settings saved`);
        }
        
        return true;
    }
}

