/**
 * Combat AI Settings - Module configuration and settings
 */

import { MODULE_ID } from './main.js';

export class CombatAISettings {
    /**
     * LocalStorage keys for sensitive data
     */
    static STORAGE_KEYS = {
        ACTION_CACHE_API_KEY: 'dnd-combat-ai.actionCacheLLM.apiKey',
        COMBAT_API_KEY: 'dnd-combat-ai.combatLLM.apiKey'
    };

    /**
     * Store sensitive data in localStorage
     * @param {string} key - Storage key
     * @param {string} value - Value to store
     */
    static setSecureValue(key, value) {
        try {
            if (value) {
                localStorage.setItem(key, value);
            } else {
                localStorage.removeItem(key);
            }
        } catch (error) {
            console.error(`${MODULE_ID} | Failed to store secure value:`, error);
            throw new Error('Failed to store API key securely');
        }
    }

    /**
     * Retrieve sensitive data from localStorage
     * @param {string} key - Storage key
     * @returns {string} - Retrieved value or empty string
     */
    static getSecureValue(key) {
        try {
            return localStorage.getItem(key) || '';
        } catch (error) {
            console.error(`${MODULE_ID} | Failed to retrieve secure value:`, error);
            return '';
        }
    }

    /**
     * Register all module settings
     */
    static registerSettings() {
        // Enable/Disable AI assistance
        game.settings.register(MODULE_ID, 'enableAI', {
            name: 'Enable AI Assistance',
            hint: 'Enable AI-powered combat recommendations for NPCs',
            scope: 'world',
            config: true,
            type: Boolean,
            default: true,
            onChange: value => {
                console.log('AI assistance', value ? 'enabled' : 'disabled');
            }
        });

        // Difficulty level
        game.settings.register(MODULE_ID, 'aiDifficulty', {
            name: 'AI Difficulty Level',
            hint: 'Controls how tactically the AI plays NPCs',
            scope: 'world',
            config: true,
            type: String,
            choices: {
                'easy': 'Easy (Defensive, suboptimal)',
                'normal': 'Normal (Tactical but imperfect)',
                'hard': 'Hard (Optimal play)',
                'deadly': 'Deadly (Ruthless efficiency)',
                'tpk': 'TPK Mode (Perfect tactics)'
            },
            default: 'normal'
        });

        // Auto-display recommendations
        game.settings.register(MODULE_ID, 'autoDisplay', {
            name: 'Auto-display Recommendations',
            hint: 'Automatically show AI recommendations when NPC turn starts',
            scope: 'world',
            config: true,
            type: Boolean,
            default: true
        });

        // Number of recommendations
        game.settings.register(MODULE_ID, 'numRecommendations', {
            name: 'Number of Recommendations',
            hint: 'How many action recommendations to generate for each NPC turn',
            scope: 'world',
            config: true,
            type: Number,
            default: 3,
            range: {
                min: 1,
                max: 5,
                step: 1
            }
        });

        // Include player character names in prompts
        game.settings.register(MODULE_ID, 'includePlayerNames', {
            name: 'Include Player Names',
            hint: 'Include player character names in AI prompts (may improve roleplay)',
            scope: 'world',
            config: true,
            type: Boolean,
            default: false
        });

        // Context memory turns
        game.settings.register(MODULE_ID, 'contextTurns', {
            name: 'Context Memory (Turns)',
            hint: 'How many previous turns to include in AI context',
            scope: 'world',
            config: true,
            type: Number,
            default: 3,
            range: {
                min: 1,
                max: 10,
                step: 1
            }
        });

        // Request timeout
        game.settings.register(MODULE_ID, 'requestTimeout', {
            name: 'Request Timeout (seconds)',
            hint: 'How long to wait for AI response before timing out',
            scope: 'world',
            config: true,
            type: Number,
            default: 30,
            range: {
                min: 5,
                max: 120,
                step: 5
            }
        });

        // Debug mode
        game.settings.register(MODULE_ID, 'debugMode', {
            name: 'Debug Mode',
            hint: 'Enable detailed logging for troubleshooting',
            scope: 'world',
            config: true,
            type: Boolean,
            default: false
        });

        // Turn tracking
        game.settings.register(MODULE_ID, 'enableTurnTracking', {
            name: 'Enable Turn Tracking',
            hint: 'Track what happened each turn with GM descriptions and state changes',
            scope: 'world',
            config: true,
            type: Boolean,
            default: true
        });

        // ========================================
        // DDB Importer Configuration
        // ========================================
        
        game.settings.register(MODULE_ID, 'useDDBImporter', {
            name: 'Use DDB Importer Integration',
            hint: 'Enable integration with D&D Beyond Importer module (if installed)',
            scope: 'world',
            config: true,
            type: Boolean,
            default: false
        });

        // ========================================
        // Action Cache LLM Configuration
        // ========================================
        
        game.settings.registerMenu(MODULE_ID, 'actionCacheLLMConfig', {
            name: 'Action Cache LLM Settings',
            label: 'Configure Action Cache LLM',
            hint: 'Configure the LLM used for generating cached action descriptions',
            icon: 'fas fa-database',
            type: ActionCacheLLMConfigMenu,
            restricted: true
        });

        // Action Cache LLM - Simplified settings
        game.settings.register(MODULE_ID, 'actionCacheLLMProvider', {
            scope: 'world',
            config: false,
            type: String,
            default: 'local',
            choices: {
                'openai': 'OpenAI',
                'anthropic': 'Anthropic',
                'local': 'Local'
            }
        });

        // Note: API keys are now stored in localStorage for security
        // Use CombatAISettings.getSecureValue() to retrieve them

        game.settings.register(MODULE_ID, 'actionCacheLLMModel', {
            scope: 'world',
            config: false,
            type: String,
            default: 'llama3.2'
        });

        game.settings.register(MODULE_ID, 'actionCacheLLMMaxTokens', {
            scope: 'world',
            config: false,
            type: Number,
            default: 1000
        });

        game.settings.register(MODULE_ID, 'actionCacheLLMReasoningEffort', {
            scope: 'world',
            config: false,
            type: String,
            default: 'low',
            choices: {
                'minimal': 'Minimal',
                'low': 'Low',
                'medium': 'Medium',
                'high': 'High',
                'max': 'Max'
            }
        });

        game.settings.register(MODULE_ID, 'actionCacheLLMTemperature', {
            scope: 'world',
            config: false,
            type: Number,
            default: 0.7
        });

        game.settings.register(MODULE_ID, 'actionCacheLLMTopP', {
            scope: 'world',
            config: false,
            type: Number,
            default: 1.0
        });

        game.settings.register(MODULE_ID, 'actionCacheLLMLocalEndpoint', {
            scope: 'world',
            config: false,
            type: String,
            default: 'http://localhost:11434'
        });

        // ========================================
        // Combat Recommendation LLM Configuration
        // ========================================
        
        game.settings.registerMenu(MODULE_ID, 'combatLLMConfig', {
            name: 'Combat Recommendation LLM Settings',
            label: 'Configure Combat LLM',
            hint: 'Configure the LLM used for generating combat recommendations',
            icon: 'fas fa-brain',
            type: CombatLLMConfigMenu,
            restricted: true
        });

        // Combat LLM - Simplified settings
        game.settings.register(MODULE_ID, 'combatLLMProvider', {
            scope: 'world',
            config: false,
            type: String,
            default: 'openai',
            choices: {
                'openai': 'OpenAI',
                'anthropic': 'Anthropic',
                'local': 'Local'
            }
        });

        // Note: API keys are now stored in localStorage for security
        // Use CombatAISettings.getSecureValue() to retrieve them

        game.settings.register(MODULE_ID, 'combatLLMModel', {
            scope: 'world',
            config: false,
            type: String,
            default: 'gpt-4o-mini'
        });

        game.settings.register(MODULE_ID, 'combatLLMMaxTokens', {
            scope: 'world',
            config: false,
            type: Number,
            default: 2000
        });

        game.settings.register(MODULE_ID, 'combatLLMReasoningEffort', {
            scope: 'world',
            config: false,
            type: String,
            default: 'medium',
            choices: {
                'minimal': 'Minimal',
                'low': 'Low',
                'medium': 'Medium',
                'high': 'High',
                'max': 'Max'
            }
        });

        game.settings.register(MODULE_ID, 'combatLLMTemperature', {
            scope: 'world',
            config: false,
            type: Number,
            default: 0.7
        });

        game.settings.register(MODULE_ID, 'combatLLMTopP', {
            scope: 'world',
            config: false,
            type: Number,
            default: 1.0
        });

        game.settings.register(MODULE_ID, 'combatLLMLocalEndpoint', {
            scope: 'world',
            config: false,
            type: String,
            default: 'http://localhost:11434'
        });
    }

    /**
     * Get all current settings as an object
     */
    static getAllSettings() {
        return {
            enableAI: game.settings.get(MODULE_ID, 'enableAI'),
            aiDifficulty: game.settings.get(MODULE_ID, 'aiDifficulty'),
            autoDisplay: game.settings.get(MODULE_ID, 'autoDisplay'),
            numRecommendations: game.settings.get(MODULE_ID, 'numRecommendations'),
            includePlayerNames: game.settings.get(MODULE_ID, 'includePlayerNames'),
            contextTurns: game.settings.get(MODULE_ID, 'contextTurns'),
            requestTimeout: game.settings.get(MODULE_ID, 'requestTimeout'),
            debugMode: game.settings.get(MODULE_ID, 'debugMode')
        };
    }

    /**
     * Validate settings configuration
     */
    static validateSettings() {
        const settings = this.getAllSettings();
        const issues = [];

        if (!settings.enableAI) {
            return { valid: true, issues: ['AI assistance is disabled'] };
        }

        // Validate Action Cache LLM config
        const actionCacheConfig = this.getLLMConfig('actionCache');
        if (actionCacheConfig.provider !== 'local' && !actionCacheConfig.apiKey) {
            issues.push('Action Cache: API key is required for cloud providers');
        }
        if (actionCacheConfig.provider === 'local' && !actionCacheConfig.localEndpoint) {
            issues.push('Action Cache: Local LLM endpoint URL is required');
        }

        // Validate Combat Recommendation LLM config
        const combatConfig = this.getLLMConfig('combatRecommendation');
        if (combatConfig.provider !== 'local' && !combatConfig.apiKey) {
            issues.push('Combat Recommendations: API key is required for cloud providers');
        }
        if (combatConfig.provider === 'local' && !combatConfig.localEndpoint) {
            issues.push('Combat Recommendations: Local LLM endpoint URL is required');
        }

        return {
            valid: issues.length === 0,
            issues: issues
        };
    }

    /**
     * Get LLM configuration for a specific purpose
     */
    static getLLMConfig(configType) {
        const prefix = configType === 'actionCache' ? 'actionCacheLLM' : 'combatLLM';
        const storageKey = configType === 'actionCache' 
            ? this.STORAGE_KEYS.ACTION_CACHE_API_KEY 
            : this.STORAGE_KEYS.COMBAT_API_KEY;
        
        return {
            provider: game.settings.get(MODULE_ID, `${prefix}Provider`),
            apiKey: this.getSecureValue(storageKey),
            model: game.settings.get(MODULE_ID, `${prefix}Model`),
            maxTokens: game.settings.get(MODULE_ID, `${prefix}MaxTokens`),
            reasoningEffort: game.settings.get(MODULE_ID, `${prefix}ReasoningEffort`),
            temperature: game.settings.get(MODULE_ID, `${prefix}Temperature`),
            topP: game.settings.get(MODULE_ID, `${prefix}TopP`),
            localEndpoint: game.settings.get(MODULE_ID, `${prefix}LocalEndpoint`)
        };
    }

    /**
     * Get DDB Importer configuration
     */
    static getDDBImporterConfig() {
        const useDDBImporter = game.settings.get(MODULE_ID, 'useDDBImporter');
        
        // If not using DDB Importer, return empty config
        if (!useDDBImporter) {
            return {
                useDDBImporter: false,
                ddbImporterUrl: '',
                cobaltSession: ''
            };
        }
        
        // Read directly from DDB Importer module settings
        // Check if the module is installed and active
        const ddbModule = game.modules.get('ddb-importer');
        if (!ddbModule?.active) {
            console.warn('Combat AI: D&D Beyond Importer module is not active');
            return {
                useDDBImporter: false,
                ddbImporterUrl: '',
                cobaltSession: ''
            };
        }
        
        // Read settings from DDB Importer
        // Common setting keys: 'api-endpoint' or 'apiEndpoint', 'cobalt-cookie' or 'cobaltCookie'
        // Default DDB Importer proxy URL
        const DEFAULT_DDB_PROXY_URL = 'https://proxy.ddb.mrprimate.co.uk';
        
        let ddbImporterUrl = '';
        let cobaltSession = '';
        let useCustomProxy = false;
        
        // Check if custom proxy is enabled
        try {
            useCustomProxy = game.settings.get('ddb-importer', 'custom-proxy') || 
                           game.settings.get('ddb-importer', 'customProxy') || false;
        } catch (e) {
            console.warn('Combat AI: Could not read DDB Importer custom proxy setting, defaulting to false');
        }
        
        // Get the API endpoint URL
        try {
            if (useCustomProxy) {
                // Use custom proxy URL if enabled
                ddbImporterUrl = game.settings.get('ddb-importer', 'api-endpoint') || 
                               game.settings.get('ddb-importer', 'apiEndpoint') || 
                               DEFAULT_DDB_PROXY_URL;
            } else {
                // Use default proxy URL
                ddbImporterUrl = DEFAULT_DDB_PROXY_URL;
            }
        } catch (e) {
            console.warn('Combat AI: Could not read DDB Importer API endpoint setting, using default');
            ddbImporterUrl = DEFAULT_DDB_PROXY_URL;
        }
        
        // Get the cobalt session cookie from localStorage (DDB Importer stores it there)
        try {
            cobaltSession = localStorage.getItem('ddb-cobalt-cookie') || '';
        } catch (e) {
            console.warn('Combat AI: Could not read DDB Importer cobalt cookie from localStorage');
        }
        
        return {
            useDDBImporter: true,
            ddbImporterUrl,
            cobaltSession
        };
    }
}

/**
 * Base LLM Configuration Menu
 */
class LLMConfigMenu extends foundry.applications.api.HandlebarsApplicationMixin(
    foundry.applications.api.ApplicationV2
) {
    constructor(options = {}) {
        super(options);
        // Subclasses will set this.configType
    }

    static DEFAULT_OPTIONS = {
        classes: ['dnd-combat-ai', 'llm-config'],
        tag: 'form',
        window: {
            resizable: true
        },
        position: {
            width: 600,
            height: 'auto'
        },
        form: {
            closeOnSubmit: false,
            submitOnChange: false
        },
        actions: {
            save: LLMConfigMenu.prototype._onSave
        }
    };

    static PARTS = {
        form: {
            template: 'modules/dnd-combat-ai/templates/llm-config.hbs'
        }
    };

    get title() {
        return this.configType === 'actionCache' 
            ? 'Action Cache LLM Configuration' 
            : 'Combat Recommendation LLM Configuration';
    }

    async _prepareContext(options) {
        const prefix = this.configType === 'actionCache' ? 'actionCacheLLM' : 'combatLLM';
        const provider = game.settings.get(MODULE_ID, `${prefix}Provider`);
        const storageKey = this.configType === 'actionCache' 
            ? CombatAISettings.STORAGE_KEYS.ACTION_CACHE_API_KEY 
            : CombatAISettings.STORAGE_KEYS.COMBAT_API_KEY;
        
        return {
            configType: this.configType,
            provider: provider,
            apiKey: CombatAISettings.getSecureValue(storageKey),
            model: game.settings.get(MODULE_ID, `${prefix}Model`),
            maxTokens: game.settings.get(MODULE_ID, `${prefix}MaxTokens`),
            reasoningEffort: game.settings.get(MODULE_ID, `${prefix}ReasoningEffort`),
            temperature: game.settings.get(MODULE_ID, `${prefix}Temperature`),
            topP: game.settings.get(MODULE_ID, `${prefix}TopP`),
            localEndpoint: game.settings.get(MODULE_ID, `${prefix}LocalEndpoint`),
            isOpenAI: provider === 'openai',
            isAnthropic: provider === 'anthropic',
            isLocal: provider === 'local'
        };
    }

    _onRender(context, options) {
        super._onRender(context, options);

        const html = this.element;
        const providerSelect = html.querySelector('[name="provider"]');
        
        providerSelect?.addEventListener('change', event => {
            const provider = event.target.value;
            const isOpenAI = provider === 'openai';
            const isAnthropic = provider === 'anthropic';
            const isLocal = provider === 'local';
            
            // Show/hide sections based on provider
            const apiKeyGroup = html.querySelector('.api-key-group');
            const reasoningGroup = html.querySelector('.reasoning-group');
            const temperatureGroup = html.querySelector('.temperature-group');
            const toppGroup = html.querySelector('.topp-group');
            const localGroup = html.querySelector('.local-group');
            
            if (apiKeyGroup) apiKeyGroup.style.display = isLocal ? 'none' : '';
            if (reasoningGroup) reasoningGroup.style.display = isOpenAI ? '' : 'none';
            if (temperatureGroup) temperatureGroup.style.display = isOpenAI ? '' : 'none';
            if (toppGroup) toppGroup.style.display = isOpenAI ? '' : 'none';
            if (localGroup) localGroup.style.display = isLocal ? '' : 'none';
            
            // Update model placeholder and suggestions
            const modelInput = html.querySelector('[name="model"]');
            if (modelInput) {
                if (isOpenAI) {
                    modelInput.placeholder = 'gpt-4o-mini';
                } else if (isAnthropic) {
                    modelInput.placeholder = 'claude-3-5-haiku-20241022';
                } else {
                    modelInput.placeholder = 'llama3.2';
                }
            }
        });
    }

    async _onSave(event, target) {
        event.preventDefault();
        
        const prefix = this.configType === 'actionCache' ? 'actionCacheLLM' : 'combatLLM';
        const storageKey = this.configType === 'actionCache' 
            ? CombatAISettings.STORAGE_KEYS.ACTION_CACHE_API_KEY 
            : CombatAISettings.STORAGE_KEYS.COMBAT_API_KEY;
        
        // Manually gather form data from all inputs (including hidden ones)
        const formElement = this.element.querySelector('form');
        
        const data = {
            provider: formElement.querySelector('[name="provider"]')?.value || 'local',
            apiKey: formElement.querySelector('[name="apiKey"]')?.value || '',
            model: formElement.querySelector('[name="model"]')?.value || 'llama3.2',
            maxTokens: parseInt(formElement.querySelector('[name="maxTokens"]')?.value) || 1000,
            reasoningEffort: formElement.querySelector('[name="reasoningEffort"]')?.value || 'low',
            temperature: parseFloat(formElement.querySelector('[name="temperature"]')?.value) || 0.7,
            topP: parseFloat(formElement.querySelector('[name="topP"]')?.value) || 1.0,
            localEndpoint: formElement.querySelector('[name="localEndpoint"]')?.value || 'http://localhost:11434'
        };
        
        if (game.settings.get(MODULE_ID, 'debugMode')) {
            console.log(`${MODULE_ID} | Saving LLM config for ${this.configType}:`, data);
        }
        
        try {
            // Disable button while saving
            target.disabled = true;
            target.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            
            await game.settings.set(MODULE_ID, `${prefix}Provider`, data.provider);
            CombatAISettings.setSecureValue(storageKey, data.apiKey);
            await game.settings.set(MODULE_ID, `${prefix}Model`, data.model);
            await game.settings.set(MODULE_ID, `${prefix}MaxTokens`, data.maxTokens);
            await game.settings.set(MODULE_ID, `${prefix}ReasoningEffort`, data.reasoningEffort);
            await game.settings.set(MODULE_ID, `${prefix}Temperature`, data.temperature);
            await game.settings.set(MODULE_ID, `${prefix}TopP`, data.topP);
            await game.settings.set(MODULE_ID, `${prefix}LocalEndpoint`, data.localEndpoint);

            ui.notifications.info(`${this.title} saved successfully`);
            
            // Close the dialog
            await this.close();
        } catch (error) {
            console.error(`${MODULE_ID} | Error saving LLM config:`, error);
            ui.notifications.error(`Failed to save configuration: ${error.message}`);
            
            // Re-enable button
            target.disabled = false;
            target.innerHTML = '<i class="fas fa-save"></i> Save Configuration';
        }
    }

    async _onSubmitForm(event, form, formData) {
        // Prevent default form submission
        event?.preventDefault();
        return false;
    }
}

/**
 * Action Cache LLM Configuration Menu
 */
class ActionCacheLLMConfigMenu extends LLMConfigMenu {
    constructor(options) {
        super(options);
        this.configType = 'actionCache';
    }
}

/**
 * Combat Recommendation LLM Configuration Menu
 */
class CombatLLMConfigMenu extends LLMConfigMenu {
    constructor(options) {
        super(options);
        this.configType = 'combatRecommendation';
    }
}
