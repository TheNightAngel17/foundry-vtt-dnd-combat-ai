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

        // LLM Provider
        game.settings.register(MODULE_ID, 'llmProvider', {
            name: 'LLM Provider',
            hint: 'Choose your preferred Large Language Model provider',
            scope: 'world',
            config: true,
            type: String,
            choices: {
                'openai': 'OpenAI (ChatGPT)',
                'anthropic': 'Anthropic (Claude)',
                'local': 'Local LLM (Ollama, LM Studio, etc.)'
            },
            default: 'openai',
            onChange: value => {
                this.onProviderChange(value);
            }
        });

        // API Key (sensitive)
        game.settings.register(MODULE_ID, 'apiKey', {
            name: 'API Key',
            hint: 'Your API key for the selected LLM provider (stored securely)',
            scope: 'world',
            config: true,
            type: String,
            default: ''
        });

        // OpenAI specific settings
        game.settings.register(MODULE_ID, 'openaiModel', {
            name: 'OpenAI Model',
            hint: 'Which OpenAI model to use for combat AI',
            scope: 'world',
            config: true,
            type: String,
            choices: {
                'gpt-5-nano': 'GPT-5 Nano (Fast, economical)',
                'gpt-5-mini': 'GPT-5 Mini (Balanced)',
                'gpt-5': 'GPT-5 (Most capable)'
            },
            default: 'gpt-5-mini'
        });

        game.settings.register(MODULE_ID, 'openaiTemperature', {
            name: 'OpenAI Temperature',
            hint: 'Controls randomness of OpenAI responses (0 = deterministic, 2 = very creative)',
            scope: 'world',
            config: true,
            type: Number,
            default: 0.6,
            range: {
                min: 0,
                max: 2,
                step: 0.1
            }
        });

        game.settings.register(MODULE_ID, 'openaiReasoningEffort', {
            name: 'OpenAI Reasoning Effort',
            hint: 'How much reasoning time the model should spend (higher = more thorough, slower)',
            scope: 'world',
            config: true,
            type: String,
            choices: {
                'minimal': 'Minimal (Fastest, minimal reasoning)',
                'low': 'Low (Balanced speed and depth)',
                'medium': 'Medium (Thorough planning)',
                'high': 'High (Maximum reasoning time)'
            },
            default: 'medium'
        });

        // Anthropic specific settings
        game.settings.register(MODULE_ID, 'anthropicModel', {
            name: 'Anthropic Model',
            hint: 'Which Claude model to use for combat AI',
            scope: 'world',
            config: true,
            type: String,
            choices: {
                'claude-3-haiku-20240307': 'Claude 3 Haiku (Fast, economical)',
                'claude-3-sonnet-20240229': 'Claude 3 Sonnet (Balanced)',
                'claude-3-opus-20240229': 'Claude 3 Opus (Most capable)'
            },
            default: 'claude-3-haiku-20240307'
        });

        // Local LLM settings
        game.settings.register(MODULE_ID, 'localLLMEndpoint', {
            name: 'Local LLM Endpoint',
            hint: 'URL for your local LLM server (e.g., http://localhost:11434 for Ollama)',
            scope: 'world',
            config: true,
            type: String,
            default: 'http://localhost:11434'
        });

        game.settings.register(MODULE_ID, 'localLLMModel', {
            name: 'Local LLM Model',
            hint: 'Model name to use with your local LLM server',
            scope: 'world',
            config: true,
            type: String,
            default: 'llama2'
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
    }

    /**
     * Handle provider change - show/hide relevant settings
     */
    static onProviderChange(provider) {
        // This could be used to dynamically show/hide settings based on provider
        // For now, just log the change
        console.log('LLM provider changed to:', provider);
    }

    /**
     * Get all current settings as an object
     */
    static getAllSettings() {
        return {
            enableAI: game.settings.get(MODULE_ID, 'enableAI'),
            aiDifficulty: game.settings.get(MODULE_ID, 'aiDifficulty'),
            llmProvider: game.settings.get(MODULE_ID, 'llmProvider'),
            apiKey: game.settings.get(MODULE_ID, 'apiKey'),
            openaiModel: game.settings.get(MODULE_ID, 'openaiModel'),
            openaiTemperature: game.settings.get(MODULE_ID, 'openaiTemperature'),
            openaiReasoningEffort: game.settings.get(MODULE_ID, 'openaiReasoningEffort'),
            anthropicModel: game.settings.get(MODULE_ID, 'anthropicModel'),
            localLLMEndpoint: game.settings.get(MODULE_ID, 'localLLMEndpoint'),
            localLLMModel: game.settings.get(MODULE_ID, 'localLLMModel'),
            autoDisplay: game.settings.get(MODULE_ID, 'autoDisplay'),
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

        if (!settings.apiKey && settings.llmProvider !== 'local') {
            issues.push('API key is required for cloud providers');
        }

        if (settings.llmProvider === 'local' && !settings.localLLMEndpoint) {
            issues.push('Local LLM endpoint URL is required');
        }

        return {
            valid: issues.length === 0,
            issues: issues
        };
    }
}