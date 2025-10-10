/**
 * Combat AI Manager - Core logic for AI-powered NPC combat assistance
 */

import { MODULE_ID, MODULE_TITLE } from './main.js';
import { LLMConnector } from './llm-connector.js';
import { CombatAnalyzer } from './combat-analyzer.js';
import { ActionCache } from './action-cache.js';

export class CombatAIManager {
    constructor() {
        this.llmConnector = new LLMConnector();
        this.actionCache = new ActionCache();
        this.combatAnalyzer = new CombatAnalyzer(this.actionCache);
        this.currentCombat = null;
        this.combatHistory = [];
    }

    /**
     * Pre-cache all NPC actions when combat starts
     */
    async preCacheNPCActions(combat) {
        if (!combat || !combat.combatants) return;

        const npcCombatants = combat.combatants.filter(c => 
            c.actor && !c.actor.hasPlayerOwner
        );

        if (npcCombatants.length === 0) {
            if (game.settings.get(MODULE_ID, 'debugMode')) {
                console.debug(`${MODULE_TITLE} | No NPCs to pre-cache`);
            }
            return;
        }

        console.log(`${MODULE_TITLE} | Pre-caching actions for ${npcCombatants.length} NPCs...`);
        
        const promises = npcCombatants.map(async (combatant) => {
            try {
                await this.actionCache.getActorActions(combatant.actor, this.llmConnector);
                if (game.settings.get(MODULE_ID, 'debugMode')) {
                    console.debug(`${MODULE_TITLE} | Cached actions for ${combatant.actor.name}`);
                }
            } catch (error) {
                console.error(`${MODULE_TITLE} | Failed to cache actions for ${combatant.actor.name}:`, error);
            }
        });

        await Promise.all(promises);
        console.log(`${MODULE_TITLE} | Finished pre-caching NPC actions`);
    }

    /**
     * Handle NPC turn and provide AI assistance
     */
    async handleNPCTurn(combat, combatant) {
        try {
            console.log(`${MODULE_TITLE} | Processing AI turn for: ${combatant.actor.name}`);
            
            this.currentCombat = combat;
            
            // Analyze current combat situation (now async because it uses action cache)
            const combatSituation = await this.combatAnalyzer.analyzeCombatSituation(combat, combatant, this.llmConnector);
            
            // Get difficulty setting
            const difficulty = game.settings.get(MODULE_ID, 'aiDifficulty');
            
            // Generate AI recommendations
            const recommendations = await this.generateAIRecommendations(combatSituation, difficulty);
            
            // Display recommendations to GM
            this.displayRecommendations(combatant, recommendations);
            
        } catch (error) {
            console.error(`${MODULE_TITLE} | Error processing NPC turn:`, error);
            ui.notifications.error(`${MODULE_TITLE}: Failed to generate AI recommendations`);
        }
    }

    /**
     * Generate AI recommendations based on combat situation and difficulty
     */
    async generateAIRecommendations(situation, difficulty) {
        // Pre-group actions by type before building prompt
        const actionsByType = this.groupActionsByType(situation.availableActions);
        
        const prompt = this.buildPrompt(situation, difficulty, actionsByType);
        
        try {
            const response = await this.llmConnector.generateResponse(prompt, 'combatRecommendation');
            return this.parseAIResponse(response);
        } catch (error) {
            console.error(`${MODULE_TITLE} | LLM generation failed:`, error);
            return this.getFallbackRecommendations(situation, difficulty, actionsByType);
        }
    }

    /**
     * Group actions by activation type
     */
    groupActionsByType(actions) {
        const actionsByType = {
            action: [],
            bonus: [],
            reaction: [],
            legendary: [],
            lair: [],
            other: []
        };

        actions.forEach(action => {
            const type = action.activationTime || 'other';
            if (actionsByType[type]) {
                actionsByType[type].push(action);
            } else {
                actionsByType.other.push(action);
            }
        });

        // Return only types that have actions
        const result = {};
        for (const [type, typeActions] of Object.entries(actionsByType)) {
            if (typeActions.length > 0) {
                result[type] = typeActions;
            }
        }
        
        return result;
    }

    /**
     * Build the prompt for the LLM
     */
    buildPrompt(situation, difficulty, actionsByType) {
        const numRecommendations = game.settings.get(MODULE_ID, 'numRecommendations') || 3;
        
        const difficultyDescriptions = {
            'easy': 'Play defensively and make suboptimal choices. Focus on simple attacks and avoid complex tactics.',
            'normal': 'Play tactically but not optimally. Make reasonable choices with occasional mistakes.',
            'hard': 'Play optimally using all available abilities and tactics. Focus on efficiency.',
            'deadly': 'Play with ruthless efficiency. Use every advantage and tactical option available.',
            'tpk': 'Play to win at all costs. Use meta-knowledge and perfect tactics to maximize lethality.'
        };

        // Build action sections from pre-grouped actions
        let actionSections = '';
        const availableTypes = Object.keys(actionsByType);
        
        for (const [type, actions] of Object.entries(actionsByType)) {
            actionSections += `\n${type.toUpperCase()} Actions:\n`;
            actionSections += actions.map(action => `- ${action.name}: ${action.description}`).join('\n');
            actionSections += '\n';
        }

        // Build example response format showing ONLY the action types present
        const exampleResponse = {};
        availableTypes.forEach(type => {
            exampleResponse[type] = Array.from({ length: Math.min(numRecommendations, 3) }, (_, i) => ({
                action: "Action Name",
                reasoning: "Brief tactical reasoning (max 150 words)",
                priority: i + 1
            }));
        });

        return `You are controlling an NPC in a D&D 5e combat encounter. Your goal is to play at a "${difficulty}" difficulty level.

Difficulty Guidelines: ${difficultyDescriptions[difficulty]}

Combat Situation:
- Current NPC: ${situation.currentNPC.name} (${situation.currentNPC.type})
- HP: ${situation.currentNPC.hp.current}/${situation.currentNPC.hp.max}
- AC: ${situation.currentNPC.ac}
- Position: ${situation.currentNPC.position}

Available Actions by Type:
${actionSections}

Combat State:
- Round: ${situation.round}
- Initiative Order: ${situation.initiativeOrder.map(c => `${c.name} (${c.hp})`).join(', ')}

Recent Actions:
${situation.recentActions.map(action => `- ${action.actor}: ${action.action}`).join('\n')}

Enemy Analysis:
${situation.enemies.map(enemy => `- ${enemy.name}: ${enemy.hp} HP, AC ${enemy.ac}, Distance: ${enemy.distance}`).join('\n')}

Ally Analysis:
${situation.allies.map(ally => `- ${ally.name}: ${ally.hp} HP, AC ${ally.ac}, Distance: ${ally.distance}`).join('\n')}

Please recommend the top ${numRecommendations} action(s) for EACH action type available to this NPC, considering:
1. The difficulty level specified
2. Current tactical situation
3. Available resources and abilities
4. Positioning and battlefield control

IMPORTANT: Keep each reasoning under 150 words.

Respond with a JSON object organized by action type (${availableTypes.join(', ')}):
${JSON.stringify(exampleResponse, null, 2)}

Respond ONLY with the JSON object, no additional text.`;
    }

    /**
     * Parse the AI response into structured recommendations
     */
    parseAIResponse(response) {
        try {
            // Try to extract JSON from response (both array and object formats)
            const jsonMatch = response.match(/[\[{][\s\S]*[\]}]/);
            if (!jsonMatch) {
                throw new Error('No JSON found in response');
            }

            const parsed = JSON.parse(jsonMatch[0]);
            
            // Handle new object format (organized by action type)
            if (typeof parsed === 'object' && !Array.isArray(parsed)) {
                return parsed;
            }
            
            // Handle legacy array format - convert to object with 'action' key
            if (Array.isArray(parsed)) {
                return {
                    action: parsed.map(item => ({
                        action: item.action || 'Unknown Action',
                        reasoning: item.reasoning || 'No reasoning provided',
                        priority: item.priority || 1
                    }))
                };
            }
            
            throw new Error('Response is neither an array nor an object');
        } catch (error) {
            console.error(`${MODULE_TITLE} | Failed to parse JSON response:`, error);
            console.log(`${MODULE_TITLE} | Raw response:`, response);
            
            // Fallback: try to parse old text format
            const lines = response.split('\n').filter(line => line.match(/^\d+\./));
            if (lines.length > 0) {
                return {
                    action: lines.map((line, index) => {
                        const match = line.match(/^\d+\.\s*\[?([^\]]+)\]?\s*-\s*(.+)$/);
                        if (match) {
                            return {
                                action: match[1].trim(),
                                reasoning: match[2].trim(),
                                priority: index + 1
                            };
                        }
                        return {
                            action: line.replace(/^\d+\.\s*/, ''),
                            reasoning: 'AI recommendation',
                            priority: index + 1
                        };
                    })
                };
            }
            
            // Ultimate fallback
            return {
                action: [
                    { action: 'Parse Error', reasoning: 'Could not parse AI response. Check console for details.', priority: 1 }
                ]
            };
        }
    }

    /**
     * Provide fallback recommendations if LLM fails
     */
    getFallbackRecommendations(situation, difficulty, actionsByType) {
        const availableTypes = Object.keys(actionsByType);
        
        // Build fallback based on what action types are actually available
        const result = {};
        
        // Generic fallbacks by difficulty
        const genericFallbacks = {
            'easy': [
                { action: 'Basic attack', reasoning: 'Simple offensive action', priority: 1 },
                { action: 'Defensive maneuver', reasoning: 'Protect yourself', priority: 2 }
            ],
            'normal': [
                { action: 'Tactical strike', reasoning: 'Balanced offense', priority: 1 },
                { action: 'Positioning', reasoning: 'Improve tactical position', priority: 2 }
            ],
            'hard': [
                { action: 'Optimal attack', reasoning: 'Maximum damage efficiency', priority: 1 },
                { action: 'Control battlefield', reasoning: 'Tactical advantage', priority: 2 }
            ],
            'deadly': [
                { action: 'Focus fire', reasoning: 'Eliminate priority targets', priority: 1 },
                { action: 'Exploit weakness', reasoning: 'Maximize effectiveness', priority: 2 }
            ],
            'tpk': [
                { action: 'Ruthless assault', reasoning: 'Maximum lethality', priority: 1 },
                { action: 'No mercy', reasoning: 'Finish weakened foes', priority: 2 }
            ]
        };
        
        const baseFallbacks = genericFallbacks[difficulty] || genericFallbacks['normal'];
        
        // Assign fallbacks to each available action type
        availableTypes.forEach(type => {
            result[type] = baseFallbacks;
        });
        
        return result;
    }

    /**
     * Display recommendations to the GM
     */
    displayRecommendations(combatant, recommendations) {
        // Build sections for each action type
        let sectionsHtml = '';
        
        const typeLabels = {
            action: 'Standard Actions',
            bonus: 'Bonus Actions',
            reaction: 'Reactions',
            legendary: 'Legendary Actions',
            lair: 'Lair Actions',
            other: 'Other Actions'
        };
        
        for (const [type, actions] of Object.entries(recommendations)) {
            if (actions && actions.length > 0) {
                const label = typeLabels[type] || type.charAt(0).toUpperCase() + type.slice(1);
                sectionsHtml += `
                    <div class="action-type-section">
                        <h4>${label}</h4>
                        <ol class="recommendations-list">
                            ${actions.map(rec => `
                                <li>
                                    <strong>${rec.action}</strong>
                                    <p>${rec.reasoning}</p>
                                </li>
                            `).join('')}
                        </ol>
                    </div>
                `;
            }
        }
        
        const content = `
            <div class="combat-ai-recommendations">
                <h3>AI Recommendations for ${combatant.actor.name}</h3>
                <div class="difficulty-level">
                    Difficulty: ${game.settings.get(MODULE_ID, 'aiDifficulty').toUpperCase()}
                </div>
                ${sectionsHtml}
            </div>
            <style>
                .combat-ai-recommendations {
                    font-family: "Signika", sans-serif;
                }
                .difficulty-level {
                    font-weight: bold;
                    margin-bottom: 10px;
                    color: #4b4a44;
                }
                .action-type-section {
                    margin-bottom: 15px;
                    border-left: 3px solid #782e22;
                    padding-left: 10px;
                }
                .action-type-section h4 {
                    margin: 5px 0;
                    color: #782e22;
                    font-size: 1.1em;
                }
                .recommendations-list {
                    margin: 5px 0;
                    padding-left: 20px;
                }
                .recommendations-list li {
                    margin-bottom: 10px;
                }
                .recommendations-list strong {
                    color: #191813;
                }
                .recommendations-list p {
                    margin: 3px 0 0 0;
                    color: #4b4a44;
                    font-size: 0.9em;
                }
            </style>
        `;

        new Dialog({
            title: `Combat AI - ${combatant.actor.name}`,
            content: content,
            buttons: {
                ok: {
                    label: "Acknowledged",
                    callback: () => {}
                }
            },
            default: "ok"
        }).render(true);
    }

    /**
     * Handle combat start
     */
    onCombatStart(combat) {
        this.currentCombat = combat;
        this.combatHistory = [];
        console.log(`${MODULE_TITLE} | Combat tracking started`);
    }

    /**
     * Handle combat end
     */
    onCombatEnd(combat) {
        this.currentCombat = null;
        // Clear expired cache entries when combat ends
        this.actionCache.clearExpiredCache();
        console.log(`${MODULE_TITLE} | Combat tracking ended`);
    }
}