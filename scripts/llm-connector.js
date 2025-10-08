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
     */
    async generateResponse(prompt) {
        const provider = game.settings.get(MODULE_ID, 'llmProvider');
        const apiKey = game.settings.get(MODULE_ID, 'apiKey');

        if (!apiKey) {
            throw new Error('No API key configured. Please configure your LLM API key in module settings.');
        }

        switch (provider) {
            case 'openai':
                return this.callOpenAI(prompt, apiKey);
            case 'anthropic':
                return this.callAnthropic(prompt, apiKey);
            case 'local':
                return this.callLocalLLM(prompt);
            default:
                throw new Error(`Unsupported LLM provider: ${provider}`);
        }
    }

    /**
     * Call OpenAI API
     */
    async callOpenAI(prompt, apiKey) {
        const model = game.settings.get(MODULE_ID, 'openaiModel');
        const temperature = game.settings.get(MODULE_ID, 'openaiTemperature') ?? 0.6;
        const reasoningEffort = game.settings.get(MODULE_ID, 'openaiReasoningEffort') ?? 'medium';
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
            max_tokens: 500,
            temperature: Number.isFinite(temperature) ? temperature : 0.6
        };

        if (reasoningEffort) {
            payload.reasoning_effort = reasoningEffort;
        }

        if (game.settings.get(MODULE_ID, 'debugMode')) {
            console.debug(`${MODULE_TITLE} | OpenAI request payload`, payload);
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
        return data.choices[0].message.content;
    }

    /**
     * Call Anthropic Claude API
     */
    async callAnthropic(prompt, apiKey) {
        const model = game.settings.get(MODULE_ID, 'anthropicModel');
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
                max_tokens: 500,
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
     */
    async callLocalLLM(prompt) {
        const endpoint = game.settings.get(MODULE_ID, 'localLLMEndpoint');
        const model = game.settings.get(MODULE_ID, 'localLLMModel');

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
                    max_tokens: 500,
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