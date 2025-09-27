/**
 * Combat AI Manager - Core logic for AI-powered NPC combat assistance
 */

import { MODULE_ID, MODULE_TITLE } from './main.js';
import { LLMConnector } from './llm-connector.js';
import { CombatAnalyzer } from './combat-analyzer.js';

export class CombatAIManager {
    constructor() {
        this.llmConnector = new LLMConnector();
        this.combatAnalyzer = new CombatAnalyzer();
        this.currentCombat = null;
        this.combatHistory = [];
    }

    /**
     * Handle NPC turn and provide AI assistance
     */
    async handleNPCTurn(combat, combatant) {
        try {
            console.log(`${MODULE_TITLE} | Processing AI turn for: ${combatant.actor.name}`);
            
            this.currentCombat = combat;
            
            // Analyze current combat situation
            const combatSituation = this.combatAnalyzer.analyzeCombatSituation(combat, combatant);
            
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
        const prompt = this.buildPrompt(situation, difficulty);
        
        try {
            const response = await this.llmConnector.generateResponse(prompt);
            return this.parseAIResponse(response);
        } catch (error) {
            console.error(`${MODULE_TITLE} | LLM generation failed:`, error);
            return this.getFallbackRecommendations(situation, difficulty);
        }
    }

    /**
     * Build the prompt for the LLM
     */
    buildPrompt(situation, difficulty) {
        const difficultyDescriptions = {
            'easy': 'Play defensively and make suboptimal choices. Focus on simple attacks and avoid complex tactics.',
            'normal': 'Play tactically but not optimally. Make reasonable choices with occasional mistakes.',
            'hard': 'Play optimally using all available abilities and tactics. Focus on efficiency.',
            'deadly': 'Play with ruthless efficiency. Use every advantage and tactical option available.',
            'tpk': 'Play to win at all costs. Use meta-knowledge and perfect tactics to maximize lethality.'
        };

        return `You are controlling an NPC in a D&D 5e combat encounter. Your goal is to play at a "${difficulty}" difficulty level.

Difficulty Guidelines: ${difficultyDescriptions[difficulty]}

Combat Situation:
- Current NPC: ${situation.currentNPC.name} (${situation.currentNPC.type})
- HP: ${situation.currentNPC.hp.current}/${situation.currentNPC.hp.max}
- AC: ${situation.currentNPC.ac}
- Position: ${situation.currentNPC.position}

Available Actions:
${situation.availableActions.map(action => `- ${action.name}: ${action.description}`).join('\n')}

Combat State:
- Round: ${situation.round}
- Initiative Order: ${situation.initiativeOrder.map(c => `${c.name} (${c.hp})`).join(', ')}

Recent Actions:
${situation.recentActions.map(action => `- ${action.actor}: ${action.action}`).join('\n')}

Enemy Analysis:
${situation.enemies.map(enemy => `- ${enemy.name}: ${enemy.hp} HP, AC ${enemy.ac}, Distance: ${enemy.distance}`).join('\n')}

Ally Analysis:
${situation.allies.map(ally => `- ${ally.name}: ${ally.hp} HP, AC ${ally.ac}, Distance: ${ally.distance}`).join('\n')}

Please recommend the top 3 actions for this NPC to take, considering:
1. The difficulty level specified
2. Current tactical situation
3. Available resources and abilities
4. Positioning and battlefield control

Format your response as:
1. [Action Name] - [Brief reasoning]
2. [Action Name] - [Brief reasoning]
3. [Action Name] - [Brief reasoning]`;
    }

    /**
     * Parse the AI response into structured recommendations
     */
    parseAIResponse(response) {
        // Simple parsing - could be enhanced with more sophisticated NLP
        const lines = response.split('\n').filter(line => line.match(/^\d+\./));
        return lines.map(line => {
            const match = line.match(/^\d+\.\s*\[?([^\]]+)\]?\s*-\s*(.+)$/);
            if (match) {
                return {
                    action: match[1].trim(),
                    reasoning: match[2].trim()
                };
            }
            return {
                action: line.replace(/^\d+\.\s*/, ''),
                reasoning: 'AI recommendation'
            };
        }).slice(0, 3); // Only take top 3
    }

    /**
     * Provide fallback recommendations if LLM fails
     */
    getFallbackRecommendations(situation, difficulty) {
        const fallbacks = {
            'easy': [
                { action: 'Move and Attack', reasoning: 'Simple melee attack' },
                { action: 'Dodge', reasoning: 'Defensive action' },
                { action: 'Dash', reasoning: 'Reposition safely' }
            ],
            'normal': [
                { action: 'Attack strongest enemy', reasoning: 'Focus fire on threats' },
                { action: 'Use class feature', reasoning: 'Utilize special abilities' },
                { action: 'Tactical movement', reasoning: 'Improve positioning' }
            ],
            'hard': [
                { action: 'Multi-attack on weakest', reasoning: 'Eliminate low HP targets' },
                { action: 'Use powerful ability', reasoning: 'Maximize damage potential' },
                { action: 'Control battlefield', reasoning: 'Use terrain and positioning' }
            ],
            'deadly': [
                { action: 'Focus fire spellcaster', reasoning: 'Eliminate primary threats' },
                { action: 'Use legendary action', reasoning: 'Maximize action economy' },
                { action: 'Coordinate with allies', reasoning: 'Tactical team play' }
            ],
            'tpk': [
                { action: 'Target unconscious PCs', reasoning: 'Force death saves' },
                { action: 'Use environment', reasoning: 'Maximize all advantages' },
                { action: 'Perfect positioning', reasoning: 'Optimal tactical placement' }
            ]
        };
        
        return fallbacks[difficulty] || fallbacks['normal'];
    }

    /**
     * Display recommendations to the GM
     */
    displayRecommendations(combatant, recommendations) {
        const content = `
            <div class="combat-ai-recommendations">
                <h3>AI Recommendations for ${combatant.actor.name}</h3>
                <div class="difficulty-level">
                    Difficulty: ${game.settings.get(MODULE_ID, 'aiDifficulty').toUpperCase()}
                </div>
                <ol class="recommendations-list">
                    ${recommendations.map(rec => `
                        <li>
                            <strong>${rec.action}</strong>
                            <p>${rec.reasoning}</p>
                        </li>
                    `).join('')}
                </ol>
            </div>
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
        console.log(`${MODULE_TITLE} | Combat tracking ended`);
    }
}