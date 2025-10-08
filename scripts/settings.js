/**
 * Combat AI Settings - Module configuration and settings
 */

import { MODULE_ID } from './main.js';

export class CombatAISettings {
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

        game.settings.register(MODULE_ID, 'actionCacheLLMApiKey', {
            scope: 'world',
            config: false,
            type: String,
            default: ''
        });

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
                'low': 'Low',
                'medium': 'Medium',
                'high': 'High'
            }
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

        game.settings.register(MODULE_ID, 'combatLLMApiKey', {
            scope: 'world',
            config: false,
            type: String,
            default: ''
        });

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
                'low': 'Low',
                'medium': 'Medium',
                'high': 'High'
            }
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
        
        return {
            provider: game.settings.get(MODULE_ID, `${prefix}Provider`),
            apiKey: game.settings.get(MODULE_ID, `${prefix}ApiKey`),
            model: game.settings.get(MODULE_ID, `${prefix}Model`),
            maxTokens: game.settings.get(MODULE_ID, `${prefix}MaxTokens`),
            reasoningEffort: game.settings.get(MODULE_ID, `${prefix}ReasoningEffort`),
            localEndpoint: game.settings.get(MODULE_ID, `${prefix}LocalEndpoint`)
        };
    }
}

/**
 * Base LLM Configuration Menu
 */
class LLMConfigMenu extends FormApplication {
    constructor(object, options = {}) {
        super(object, options);
        // Subclasses will set this.configType
    }

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ['dnd-combat-ai', 'llm-config'],
            width: 600,
            height: 'auto',
            closeOnSubmit: true,
            submitOnChange: false,
            tabs: []
        });
    }

    get title() {
        return this.configType === 'actionCache' 
            ? 'Action Cache LLM Configuration' 
            : 'Combat Recommendation LLM Configuration';
    }

    getData() {
        const prefix = this.configType === 'actionCache' ? 'actionCacheLLM' : 'combatLLM';
        const provider = game.settings.get(MODULE_ID, `${prefix}Provider`);
        
        return {
            configType: this.configType,
            provider: provider,
            apiKey: game.settings.get(MODULE_ID, `${prefix}ApiKey`),
            model: game.settings.get(MODULE_ID, `${prefix}Model`),
            maxTokens: game.settings.get(MODULE_ID, `${prefix}MaxTokens`),
            reasoningEffort: game.settings.get(MODULE_ID, `${prefix}ReasoningEffort`),
            localEndpoint: game.settings.get(MODULE_ID, `${prefix}LocalEndpoint`),
            isOpenAI: provider === 'openai',
            isAnthropic: provider === 'anthropic',
            isLocal: provider === 'local'
        };
    }

    get template() {
        return `modules/dnd-combat-ai/templates/llm-config.hbs`;
    }

    activateListeners(html) {
        super.activateListeners(html);

        html.find('[name="provider"]').on('change', event => {
            const provider = event.target.value;
            const isOpenAI = provider === 'openai';
            const isAnthropic = provider === 'anthropic';
            const isLocal = provider === 'local';
            
            // Show/hide sections based on provider
            html.find('.api-key-group').toggle(!isLocal);
            html.find('.reasoning-group').toggle(isOpenAI);
            html.find('.local-group').toggle(isLocal);
            
            // Update model placeholder and suggestions
            const modelInput = html.find('[name="model"]');
            if (isOpenAI) {
                modelInput.attr('placeholder', 'gpt-4o-mini');
            } else if (isAnthropic) {
                modelInput.attr('placeholder', 'claude-3-5-haiku-20241022');
            } else {
                modelInput.attr('placeholder', 'llama3.2');
            }
        });
    }

    async _updateObject(event, formData) {
        const prefix = this.configType === 'actionCache' ? 'actionCacheLLM' : 'combatLLM';
        
        await game.settings.set(MODULE_ID, `${prefix}Provider`, formData.provider);
        await game.settings.set(MODULE_ID, `${prefix}ApiKey`, formData.apiKey || '');
        await game.settings.set(MODULE_ID, `${prefix}Model`, formData.model || 'llama3.2');
        await game.settings.set(MODULE_ID, `${prefix}MaxTokens`, formData.maxTokens || 1000);
        await game.settings.set(MODULE_ID, `${prefix}ReasoningEffort`, formData.reasoningEffort || 'low');
        await game.settings.set(MODULE_ID, `${prefix}LocalEndpoint`, formData.localEndpoint || 'http://localhost:11434');

        ui.notifications.info(`${this.title} saved successfully`);
    }
}

/**
 * Action Cache LLM Configuration Menu
 */
class ActionCacheLLMConfigMenu extends LLMConfigMenu {
    constructor(object, options) {
        super(object, options);
        this.configType = 'actionCache';
    }
}

/**
 * Combat Recommendation LLM Configuration Menu
 */
class CombatLLMConfigMenu extends LLMConfigMenu {
    constructor(object, options) {
        super(object, options);
        this.configType = 'combatRecommendation';
    }
}