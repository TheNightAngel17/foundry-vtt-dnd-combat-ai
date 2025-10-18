/**
 * LLM Connector - Handles communication with external LLM APIs
 */

import { MODULE_ID, MODULE_TITLE } from './main.js';
import { CombatAISettings } from './settings.js';

export class LLMConnector {
    constructor() {
        this.apiKey = null;
        this.apiProvider = 'openai'; // default
        this.model = 'gpt-3.5-turbo'; // default
    }

    /**
     * Generate AI response using the configured LLM
     * @param {string} prompt - The prompt to send to the LLM
     * @param {string} configType - Either 'actionCache' or 'combatRecommendation' (default)
     */
    async generateResponse(prompt, configType = 'combatRecommendation') {
        // Get configuration for the specified type
        const prefix = configType === 'actionCache' ? 'actionCacheLLM' : 'combatLLM';
        const provider = game.settings.get(MODULE_ID, `${prefix}Provider`);
        
        // Get API key from localStorage using CombatAISettings utility
        const storageKey = configType === 'actionCache' 
            ? CombatAISettings.STORAGE_KEYS.ACTION_CACHE_API_KEY 
            : CombatAISettings.STORAGE_KEYS.COMBAT_API_KEY;
        const apiKey = CombatAISettings.getSecureValue(storageKey);

        if (!apiKey && provider !== 'local') {
            throw new Error(`No API key configured for ${configType}. Please configure your LLM API key in module settings.`);
        }

        switch (provider) {
            case 'openai':
                return this.callOpenAI(prompt, apiKey, prefix);
            case 'anthropic':
                return this.callAnthropic(prompt, apiKey, prefix);
            case 'local':
                return this.callLocalLLM(prompt, prefix);
            default:
                throw new Error(`Unsupported LLM provider: ${provider}`);
        }
    }

    /**
     * Call OpenAI API
     * @param {string} prefix - Settings prefix ('actionCacheLLM' or 'combatLLM')
     */
    async callOpenAI(prompt, apiKey, prefix) {
        const model = game.settings.get(MODULE_ID, `${prefix}Model`);
        const reasoningEffort = game.settings.get(MODULE_ID, `${prefix}ReasoningEffort`) ?? 'medium';
        const temperature = game.settings.get(MODULE_ID, `${prefix}Temperature`) ?? 0.7;
        const topP = game.settings.get(MODULE_ID, `${prefix}TopP`) ?? 1.0;
        const maxCompletionTokens = game.settings.get(MODULE_ID, `${prefix}MaxTokens`) ?? 500;
        const url = 'https://api.openai.com/v1/chat/completions';

        const payload = {
            model: model,
            messages: [
                {
                    role: 'system',
                    content: 'You are a helpful D&D 5e Dungeon Master assistant that provides tactical combat advice for NPCs.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            max_completion_tokens: maxCompletionTokens,
        };

        // Only use reasoning_effort for GPT-5 models
        if (model.startsWith('gpt-5')) {
            if (reasoningEffort) {
                payload.reasoning_effort = reasoningEffort;
            }
        } else {
            // Use temperature and top_p for GPT-4.x and other models
            payload.temperature = temperature;
            payload.top_p = topP;
        }

        if (game.settings.get(MODULE_ID, 'debugMode')) {
            console.log(`${MODULE_TITLE} | OpenAI request payload:`, payload);
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`OpenAI API error: ${response.status} - ${error}`);
        }

        const data = await response.json();
        
        if (game.settings.get(MODULE_ID, 'debugMode')) {
            console.log(`${MODULE_TITLE} | OpenAI response data:`, data);
        }
        
        return data.choices[0].message.content;
    }

    /**
     * Call Anthropic Claude API
     * @param {string} prefix - Settings prefix ('actionCacheLLM' or 'combatLLM')
     */
    async callAnthropic(prompt, apiKey, prefix) {
        const model = game.settings.get(MODULE_ID, `${prefix}Model`);
        const maxTokens = game.settings.get(MODULE_ID, `${prefix}MaxTokens`) ?? 500;
        const url = 'https://api.anthropic.com/v1/messages';

        const payload = {
            model: model,
            max_tokens: maxTokens,
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ]
        };

        if (game.settings.get(MODULE_ID, 'debugMode')) {
            console.log(`${MODULE_TITLE} | Anthropic request payload:`, payload);
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'anthropic-dangerous-direct-browser-access': 'true'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Anthropic API error: ${response.status} - ${error}`);
        }

        const data = await response.json();
        
        if (game.settings.get(MODULE_ID, 'debugMode')) {
            console.log(`${MODULE_TITLE} | Anthropic response data:`, data);
        }
        
        return data.content[0].text;
    }

    /**
     * Call local LLM endpoint (e.g., Ollama, LM Studio)
     * @param {string} prefix - Settings prefix ('actionCacheLLM' or 'combatLLM')
     */
    async callLocalLLM(prompt, prefix) {
        const endpoint = game.settings.get(MODULE_ID, `${prefix}LocalEndpoint`);
        const model = game.settings.get(MODULE_ID, `${prefix}Model`);
        const maxTokens = game.settings.get(MODULE_ID, `${prefix}MaxTokens`) ?? 500;

        if (!endpoint) {
            throw new Error('Local LLM endpoint not configured');
        }

        // Try OpenAI-compatible API format first
        try {
            const payload = {
                model: model || 'default',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful D&D 5e Dungeon Master assistant that provides tactical combat advice for NPCs.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: maxTokens,
                temperature: 0.7
            };

            if (game.settings.get(MODULE_ID, 'debugMode')) {
                console.log(`${MODULE_TITLE} | Local LLM (OpenAI-compatible) request payload:`, payload);
            }

            const response = await fetch(`${endpoint}/v1/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const data = await response.json();
                
                if (game.settings.get(MODULE_ID, 'debugMode')) {
                    console.log(`${MODULE_TITLE} | Local LLM (OpenAI-compatible) response data:`, data);
                }
                
                return data.choices[0].message.content;
            }
        } catch (error) {
            console.warn(`${MODULE_TITLE} | OpenAI-compatible API failed, trying Ollama format`);
        }

        // Try Ollama format
        try {
            const payload = {
                model: model || 'llama2',
                prompt: prompt,
                stream: false
            };

            if (game.settings.get(MODULE_ID, 'debugMode')) {
                console.log(`${MODULE_TITLE} | Local LLM (Ollama) request payload:`, payload);
            }

            const response = await fetch(`${endpoint}/api/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const data = await response.json();
                
                if (game.settings.get(MODULE_ID, 'debugMode')) {
                    console.log(`${MODULE_TITLE} | Local LLM (Ollama) response data:`, data);
                }
                
                return data.response;
            }
        } catch (error) {
            console.warn(`${MODULE_TITLE} | Ollama API failed`);
        }

        throw new Error('Failed to connect to local LLM endpoint');
    }

    /**
     * Test the LLM connection
     */
    async testConnection() {
        const testPrompt = 'Respond with "Connection successful" if you can read this.';
        
        try {
            const response = await this.generateResponse(testPrompt);
            return {
                success: true,
                response: response
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get available models for the current provider
     */
    getAvailableModels(provider) {
        const models = {
            'openai': [
                'gpt-3.5-turbo',
                'gpt-3.5-turbo-16k',
                'gpt-4',
                'gpt-4-32k',
                'gpt-4-turbo-preview'
            ],
            'anthropic': [
                'claude-3-haiku-20240307',
                'claude-3-sonnet-20240229',
                'claude-3-opus-20240229'
            ],
            'local': [
                'llama2',
                'llama2:13b',
                'codellama',
                'mistral',
                'custom'
            ]
        };

        return models[provider] || [];
    }
}