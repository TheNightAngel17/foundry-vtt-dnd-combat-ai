/**
 * LLM Connector - Handles communication with external LLM APIs
 */

import { MODULE_ID, MODULE_TITLE } from './main.js';

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
        const apiKey = game.settings.get(MODULE_ID, `${prefix}ApiKey`);

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

        if (reasoningEffort) {
            payload.reasoning_effort = reasoningEffort;
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

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: model,
                max_tokens: maxTokens,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ]
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Anthropic API error: ${response.status} - ${error}`);
        }

        const data = await response.json();
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
            const response = await fetch(`${endpoint}/v1/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
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
                })
            });

            if (response.ok) {
                const data = await response.json();
                return data.choices[0].message.content;
            }
        } catch (error) {
            console.warn(`${MODULE_TITLE} | OpenAI-compatible API failed, trying Ollama format`);
        }

        // Try Ollama format
        try {
            const response = await fetch(`${endpoint}/api/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: model || 'llama2',
                    prompt: prompt,
                    stream: false
                })
            });

            if (response.ok) {
                const data = await response.json();
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