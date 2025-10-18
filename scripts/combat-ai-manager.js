/**
 * Combat AI Manager - Core logic for AI-powered NPC combat assistance
 */

import { MODULE_ID, MODULE_TITLE } from './main.js';
import { LLMConnector } from './llm-connector.js';
import { CombatAnalyzer } from './combat-analyzer.js';
import { ActorLlmActions } from './action-cache.js';

export class CombatAIManager {
    constructor() {
        this.llmConnector = new LLMConnector();
        this.actorLlmActions = new ActorLlmActions();
        this.combatAnalyzer = new CombatAnalyzer(this.actorLlmActions);
        this.currentCombat = null;
        this.combatHistory = [];
        this.turnTracker = null; // Will be set from main.js
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
                await this.actorLlmActions.getActorActions(combatant.actor, this.llmConnector);
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

        // Build action sections from pre-grouped actions with markdown formatting
        let actionSections = '';
        const availableTypes = Object.keys(actionsByType);
        
        for (const [type, actions] of Object.entries(actionsByType)) {
            const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);
            actionSections += `### ${typeLabel} Actions\n\n`;
            actionSections += actions.map(action => `- **${action.name}**: ${action.description}`).join('\n');
            actionSections += '\n\n';
        }

        // Build combat history section from turn tracker
        let combatHistory = '';
        const turnHistory = this.getTurnHistory();
        
        if (turnHistory.length > 0) {
            combatHistory = '# Combat History\n\n';
            combatHistory += '_What has happened so far in this combat_\n\n';
            
            turnHistory.forEach((entry, index) => {
                combatHistory += `## Round ${entry.round}, Turn ${entry.turn + 1} - ${entry.combatantName} (Initiative ${entry.initiative})\n\n`;
                combatHistory += `${entry.description}\n\n`;
                
                // Add separator between entries (but not after the last one)
                if (index < turnHistory.length - 1) {
                    combatHistory += '---\n\n';
                }
            });
        } else {
            combatHistory = '# Combat History\n\n_No previous turns recorded yet. This is the beginning of combat._';
        }

        // Build enemy analysis section
        let enemyAnalysis = '';
        if (situation.enemies.length > 0) {
            enemyAnalysis = situation.enemies.map(combatant => this.buildCombatantMarkdown(combatant)).join('\n\n');
        } else {
            enemyAnalysis = '_No enemies in range or visible._';
        }

        // Build ally analysis section
        let allyAnalysis = '';
        if (situation.allies.length > 0) {
            allyAnalysis = situation.allies.map(combatant => this.buildCombatantMarkdown(combatant)).join('\n\n');
        } else {
            allyAnalysis = '_No allies present._';
        }

        // Build example response format based on available action types
        const exampleResponse = {};
        
        // Check if we have both actions and bonus actions
        const hasActions = availableTypes.includes('action');
        const hasBonusActions = availableTypes.includes('bonus');
        const hasLegendaryActions = availableTypes.includes('legendary');
        const hasReactions = availableTypes.includes('reaction');
        const hasLairActions = availableTypes.includes('lair');
        
        // Build turnActionOption array if we have actions or bonus actions
        if (hasActions || hasBonusActions) {
            exampleResponse.turnActionOption = Array.from({ length: Math.min(numRecommendations, 3) }, (_, i) => {
                const option = {
                    reasoning: "Brief tactical reasoning for this combination (max 150 words)",
                    priorityScore: (1.0 - (i * 0.15)).toFixed(2) // Example: 1.00, 0.85, 0.70
                };
                
                if (hasActions) {
                    option.action = "Action Name";
                }
                if (hasBonusActions) {
                    option.bonusAction = "Bonus Action Name";
                }
                if (hasActions && hasBonusActions) {
                    option.first = "Action"; // or "BonusAction"
                }
                
                return option;
            });
        }
        
        // Add legendary actions if present
        if (hasLegendaryActions) {
            exampleResponse.legendaryActions = Array.from({ length: Math.min(numRecommendations, 3) }, (_, i) => ({
                action: "Legendary Action Name",
                reasoning: "Brief tactical reasoning (max 150 words)",
                priorityScore: (1.0 - (i * 0.15)).toFixed(2)
            }));
        }
        
        // Add reactions if present
        if (hasReactions) {
            exampleResponse.reactions = Array.from({ length: Math.min(numRecommendations, 3) }, (_, i) => ({
                action: "Reaction Name",
                reasoning: "Brief tactical reasoning (max 150 words)",
                priorityScore: (1.0 - (i * 0.15)).toFixed(2)
            }));
        }
        
        // Add lair actions if present
        if (hasLairActions) {
            exampleResponse.lairActions = Array.from({ length: Math.min(numRecommendations, 3) }, (_, i) => ({
                action: "Lair Action Name",
                reasoning: "Brief tactical reasoning (max 150 words)",
                priorityScore: (1.0 - (i * 0.15)).toFixed(2)
            }));
        }

        // Build task description based on available actions
        let taskDescription = '';
        if (hasActions && hasBonusActions) {
            taskDescription = `Please analyze the available **Actions** and **Bonus Actions** together and recommend the **top ${numRecommendations} combinations** of action and bonus action that can be taken on this turn. For each combination, specify which should be performed first, and provide a **priorityScore** (0.0 to 1.0) indicating how optimal this combination is.`;
        } else if (hasActions) {
            taskDescription = `Please recommend the **top ${numRecommendations} action(s)** available to this NPC, with a **priorityScore** (0.0 to 1.0) for each.`;
        } else if (hasBonusActions) {
            taskDescription = `Please recommend the **top ${numRecommendations} bonus action(s)** available to this NPC, with a **priorityScore** (0.0 to 1.0) for each.`;
        }
        
        if (hasLegendaryActions) {
            taskDescription += `\n\nAdditionally, recommend the **top ${numRecommendations} legendary action(s)** with priorityScore values.`;
        }
        if (hasReactions) {
            taskDescription += `\n\nAlso recommend the **top ${numRecommendations} reaction(s)** with priorityScore values.`;
        }
        if (hasLairActions) {
            taskDescription += `\n\nAlso recommend the **top ${numRecommendations} lair action(s)** with priorityScore values.`;
        }

        return `You are controlling an NPC in a D&D 5e combat encounter. Your goal is to play at a **"${difficulty}"** difficulty level.

# Difficulty Guidelines

${difficultyDescriptions[difficulty]}

---

${combatHistory}

---

# Current NPC

**Name**: ${situation.currentNPC.name} (${situation.currentNPC.type})
- **HP**: ${situation.currentNPC.hp.current}/${situation.currentNPC.hp.max}
- **AC**: ${situation.currentNPC.ac}
- **Position**: ${situation.currentNPC.position}

---

# Available Actions

${actionSections}---

# Current Combat State

- **Round**: ${situation.round}
- **Initiative Order**: ${situation.initiativeOrder.map(c => `${c.name} (${c.hp})`).join(' → ')}

---

# Battlefield Analysis

## Enemies

${enemyAnalysis}

## Allies

${allyAnalysis}

---

# Your Task

${taskDescription}

Consider:
1. The difficulty level specified above
2. The combat history and current tactical situation
3. Available resources and abilities
4. Positioning and battlefield control
5. **Synergies between actions and bonus actions** (if both are available)
6. The optimal order of execution for combined actions

**IMPORTANT**: 
- Keep each reasoning under 150 words
- Use **priorityScore** (0.0 to 1.0 decimal) to indicate optimality, where 1.0 is most optimal
- Similar options can have close scores (e.g., 0.86 vs 0.84)

---

# Response Format

Respond with a JSON object in this structure:

\`\`\`json
${JSON.stringify(exampleResponse, null, 2)}
\`\`\`

**Respond ONLY with the JSON object, no additional text.**`;
    }

    /**
     * Build markdown representation of a combatant for the prompt
     */
    buildCombatantMarkdown(combatant) {
        const distanceInfo = combatant.distance !== null && combatant.direction !== null 
            ? `${combatant.distance} ft @ ${combatant.direction}°`
            : (combatant.distance !== null ? `${combatant.distance} ft` : 'Unknown');
        
        const conditionsList = combatant.conditions.length > 0 
            ? combatant.conditions.map(c => c.name).join(', ')
            : 'None';
        
        const statusFlags = combatant.unconscious ? ' **[UNCONSCIOUS]**' : '';
        
        // Build defenses line with markdown formatting
        let defensesLine = `AC ${combatant.ac}`;
        if (combatant.damageResistances && combatant.damageResistances.length > 0) {
            defensesLine += `, _Resist_: ${combatant.damageResistances.join(', ')}`;
        }
        if (combatant.damageImmunities && combatant.damageImmunities.length > 0) {
            defensesLine += `, _Immune_: ${combatant.damageImmunities.join(', ')}`;
        }
        if (combatant.damageVulnerabilities && combatant.damageVulnerabilities.length > 0) {
            defensesLine += `, _Vulnerable_: ${combatant.damageVulnerabilities.join(', ')}`;
        }
        if (combatant.conditionImmunities && combatant.conditionImmunities.length > 0) {
            defensesLine += `, _Condition Immune_: ${combatant.conditionImmunities.join(', ')}`;
        }
        
        return `### ${combatant.name} (${combatant.hp})${statusFlags}
- **Location**: ${distanceInfo}
- **Defenses**: ${defensesLine}
- **Conditions**: ${conditionsList}`;
    }

    /**
     * Parse the AI response into structured recommendations
     */
    parseAIResponse(response) {
        try {
            // Try to extract JSON from response
            const jsonMatch = response.match(/[\[{][\s\S]*[\]}]/);
            if (!jsonMatch) {
                throw new Error('No JSON found in response');
            }

            const parsed = JSON.parse(jsonMatch[0]);
            
            // Validate the new format structure
            if (typeof parsed === 'object' && !Array.isArray(parsed)) {
                // Check if it has the new format keys
                if (parsed.turnActionOption || parsed.legendaryActions || parsed.reactions || parsed.lairActions) {
                    // Validate priorityScore values
                    const validateOptions = (options) => {
                        if (!Array.isArray(options)) return;
                        options.forEach(option => {
                            if (typeof option.priorityScore === 'string') {
                                option.priorityScore = parseFloat(option.priorityScore);
                            }
                            if (typeof option.priorityScore !== 'number' || isNaN(option.priorityScore)) {
                                option.priorityScore = 0.5; // Default fallback
                            }
                        });
                    };
                    
                    validateOptions(parsed.turnActionOption);
                    validateOptions(parsed.legendaryActions);
                    validateOptions(parsed.reactions);
                    validateOptions(parsed.lairActions);
                    
                    return parsed;
                }
                
                // Handle legacy object format (organized by action type) - convert to new format
                const hasActionOrBonus = parsed.action || parsed.bonus;
                if (hasActionOrBonus) {
                    const newFormat = {};
                    
                    // Convert action/bonus to turnActionOption
                    if (parsed.action || parsed.bonus) {
                        const maxLength = Math.max(
                            parsed.action?.length || 0,
                            parsed.bonus?.length || 0
                        );
                        
                        newFormat.turnActionOption = [];
                        for (let i = 0; i < maxLength; i++) {
                            const option = {
                                reasoning: parsed.action?.[i]?.reasoning || parsed.bonus?.[i]?.reasoning || 'No reasoning provided',
                                priorityScore: 1.0 - (i * 0.15)
                            };
                            
                            if (parsed.action?.[i]) {
                                option.action = parsed.action[i].action || 'Unknown Action';
                            }
                            if (parsed.bonus?.[i]) {
                                option.bonusAction = parsed.bonus[i].action || 'Unknown Bonus Action';
                            }
                            if (option.action && option.bonusAction) {
                                option.first = 'Action'; // Default assumption
                            }
                            
                            newFormat.turnActionOption.push(option);
                        }
                    }
                    
                    // Convert other action types
                    if (parsed.legendary) {
                        newFormat.legendaryActions = parsed.legendary.map((item, i) => ({
                            action: item.action || 'Unknown Action',
                            reasoning: item.reasoning || 'No reasoning provided',
                            priorityScore: 1.0 - (i * 0.15)
                        }));
                    }
                    if (parsed.reaction) {
                        newFormat.reactions = parsed.reaction.map((item, i) => ({
                            action: item.action || 'Unknown Action',
                            reasoning: item.reasoning || 'No reasoning provided',
                            priorityScore: 1.0 - (i * 0.15)
                        }));
                    }
                    if (parsed.lair) {
                        newFormat.lairActions = parsed.lair.map((item, i) => ({
                            action: item.action || 'Unknown Action',
                            reasoning: item.reasoning || 'No reasoning provided',
                            priorityScore: 1.0 - (i * 0.15)
                        }));
                    }
                    
                    return newFormat;
                }
            }
            
            // Handle legacy array format - convert to turnActionOption
            if (Array.isArray(parsed)) {
                return {
                    turnActionOption: parsed.map((item, i) => ({
                        action: item.action || 'Unknown Action',
                        reasoning: item.reasoning || 'No reasoning provided',
                        priorityScore: 1.0 - (i * 0.15)
                    }))
                };
            }
            
            throw new Error('Response format not recognized');
        } catch (error) {
            console.error(`${MODULE_TITLE} | Failed to parse JSON response:`, error);
            console.log(`${MODULE_TITLE} | Raw response:`, response);
            
            // Fallback: try to parse old text format
            const lines = response.split('\n').filter(line => line.match(/^\d+\./));
            if (lines.length > 0) {
                return {
                    turnActionOption: lines.map((line, index) => {
                        const match = line.match(/^\d+\.\s*\[?([^\]]+)\]?\s*-\s*(.+)$/);
                        if (match) {
                            return {
                                action: match[1].trim(),
                                reasoning: match[2].trim(),
                                priorityScore: 1.0 - (index * 0.15)
                            };
                        }
                        return {
                            action: line.replace(/^\d+\.\s*/, ''),
                            reasoning: 'AI recommendation',
                            priorityScore: 1.0 - (index * 0.15)
                        };
                    })
                };
            }
            
            // Ultimate fallback
            return {
                turnActionOption: [
                    { action: 'Parse Error', reasoning: 'Could not parse AI response. Check console for details.', priorityScore: 0.0 }
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
        
        // Generic fallbacks by difficulty with priorityScore
        const difficultyScoreMultiplier = {
            'easy': 0.6,
            'normal': 0.7,
            'hard': 0.85,
            'deadly': 0.95,
            'tpk': 1.0
        };
        
        const baseMultiplier = difficultyScoreMultiplier[difficulty] || 0.7;
        
        const hasActions = availableTypes.includes('action');
        const hasBonusActions = availableTypes.includes('bonus');
        const hasLegendaryActions = availableTypes.includes('legendary');
        const hasReactions = availableTypes.includes('reaction');
        const hasLairActions = availableTypes.includes('lair');
        
        // Build turnActionOption if we have actions or bonus actions
        if (hasActions || hasBonusActions) {
            const turnOptions = [];
            
            if (hasActions && hasBonusActions) {
                // Provide combination fallbacks
                turnOptions.push({
                    action: actionsByType.action[0]?.name || 'Primary Attack',
                    bonusAction: actionsByType.bonus[0]?.name || 'Secondary Action',
                    first: 'Action',
                    reasoning: `Use primary attack followed by bonus action for maximum impact. Difficulty: ${difficulty}`,
                    priorityScore: baseMultiplier
                });
                
                if (actionsByType.action.length > 1 || actionsByType.bonus.length > 1) {
                    turnOptions.push({
                        action: actionsByType.action[1]?.name || actionsByType.action[0]?.name || 'Attack',
                        bonusAction: actionsByType.bonus[1]?.name || actionsByType.bonus[0]?.name || 'Defensive move',
                        first: 'BonusAction',
                        reasoning: `Alternative combination starting with bonus action for tactical positioning.`,
                        priorityScore: baseMultiplier - 0.15
                    });
                }
            } else if (hasActions) {
                // Only actions available
                actionsByType.action.slice(0, 2).forEach((action, i) => {
                    turnOptions.push({
                        action: action.name,
                        reasoning: `${i === 0 ? 'Primary' : 'Alternative'} action choice based on ${difficulty} difficulty`,
                        priorityScore: baseMultiplier - (i * 0.15)
                    });
                });
            } else if (hasBonusActions) {
                // Only bonus actions available
                actionsByType.bonus.slice(0, 2).forEach((action, i) => {
                    turnOptions.push({
                        bonusAction: action.name,
                        reasoning: `${i === 0 ? 'Primary' : 'Alternative'} bonus action choice`,
                        priorityScore: baseMultiplier - (i * 0.15)
                    });
                });
            }
            
            result.turnActionOption = turnOptions;
        }
        
        // Add legendary actions if present
        if (hasLegendaryActions) {
            result.legendaryActions = actionsByType.legendary.slice(0, 2).map((action, i) => ({
                action: action.name,
                reasoning: `${i === 0 ? 'Optimal' : 'Alternative'} legendary action for ${difficulty} difficulty`,
                priorityScore: baseMultiplier - (i * 0.15)
            }));
        }
        
        // Add reactions if present
        if (hasReactions) {
            result.reactions = actionsByType.reaction.slice(0, 2).map((action, i) => ({
                action: action.name,
                reasoning: `${i === 0 ? 'Primary' : 'Secondary'} reaction option`,
                priorityScore: baseMultiplier - (i * 0.15)
            }));
        }
        
        // Add lair actions if present
        if (hasLairActions) {
            result.lairActions = actionsByType.lair.slice(0, 2).map((action, i) => ({
                action: action.name,
                reasoning: `${i === 0 ? 'Primary' : 'Secondary'} lair action`,
                priorityScore: baseMultiplier - (i * 0.15)
            }));
        }
        
        return result;
    }

    /**
     * Display recommendations to the GM
     */
    displayRecommendations(combatant, recommendations) {
        // Debug logging
        if (game.settings.get(MODULE_ID, 'debugMode')) {
            console.log(`${MODULE_TITLE} | Recommendations for ${combatant.actor.name}:`, recommendations);
        }
        
        let sectionsHtml = '';
        
        // Display Turn Action Options (combinations of actions and bonus actions)
        if (recommendations.turnActionOption && recommendations.turnActionOption.length > 0) {
            sectionsHtml += `
                <div class="action-type-section">
                    <h4>Turn Action Options</h4>
                    <ol class="recommendations-list">
                        ${recommendations.turnActionOption.map(option => {
                            let actionText = '';
                            
                            if (option.action && option.bonusAction) {
                                // Both action and bonus action - determine order based on 'first' field
                                let firstAction, secondAction, firstLabel, secondLabel;
                                
                                if (option.first === 'BonusAction' || option.first === 'Bonus Action') {
                                    // Bonus Action comes first
                                    firstAction = option.bonusAction;
                                    secondAction = option.action;
                                    firstLabel = 'Bonus Action';
                                    secondLabel = 'Action';
                                } else {
                                    // Action comes first (default)
                                    firstAction = option.action;
                                    secondAction = option.bonusAction;
                                    firstLabel = 'Action';
                                    secondLabel = 'Bonus Action';
                                }
                                
                                actionText = `<strong>${firstAction}</strong> <span class="action-label">(${firstLabel} first)</span> → <strong>${secondAction}</strong> <span class="action-label">(${secondLabel})</span>`;
                            } else if (option.action) {
                                // Only action
                                actionText = `<strong>${option.action}</strong> <span class="action-label">(Action)</span>`;
                            } else if (option.bonusAction) {
                                // Only bonus action
                                actionText = `<strong>${option.bonusAction}</strong> <span class="action-label">(Bonus Action)</span>`;
                            }
                            
                            const scorePercent = (option.priorityScore * 100).toFixed(0);
                            const scoreColor = option.priorityScore >= 0.8 ? '#2d7a2d' : 
                                             option.priorityScore >= 0.6 ? '#7a6d2d' : '#7a2d2d';
                            
                            return `
                                <li>
                                    <div class="option-header">
                                        ${actionText}
                                        <span class="priority-score" style="background-color: ${scoreColor}">${scorePercent}%</span>
                                    </div>
                                    <p>${option.reasoning}</p>
                                </li>
                            `;
                        }).join('')}
                    </ol>
                </div>
            `;
        }
        
        // Display Legendary Actions
        if (recommendations.legendaryActions && recommendations.legendaryActions.length > 0) {
            sectionsHtml += `
                <div class="action-type-section">
                    <h4>Legendary Actions</h4>
                    <ol class="recommendations-list">
                        ${recommendations.legendaryActions.map(option => {
                            const scorePercent = (option.priorityScore * 100).toFixed(0);
                            const scoreColor = option.priorityScore >= 0.8 ? '#2d7a2d' : 
                                             option.priorityScore >= 0.6 ? '#7a6d2d' : '#7a2d2d';
                            
                            return `
                                <li>
                                    <div class="option-header">
                                        <strong>${option.action}</strong>
                                        <span class="priority-score" style="background-color: ${scoreColor}">${scorePercent}%</span>
                                    </div>
                                    <p>${option.reasoning}</p>
                                </li>
                            `;
                        }).join('')}
                    </ol>
                </div>
            `;
        }
        
        // Display Reactions
        if (recommendations.reactions && recommendations.reactions.length > 0) {
            sectionsHtml += `
                <div class="action-type-section">
                    <h4>Reactions</h4>
                    <ol class="recommendations-list">
                        ${recommendations.reactions.map(option => {
                            const scorePercent = (option.priorityScore * 100).toFixed(0);
                            const scoreColor = option.priorityScore >= 0.8 ? '#2d7a2d' : 
                                             option.priorityScore >= 0.6 ? '#7a6d2d' : '#7a2d2d';
                            
                            return `
                                <li>
                                    <div class="option-header">
                                        <strong>${option.action}</strong>
                                        <span class="priority-score" style="background-color: ${scoreColor}">${scorePercent}%</span>
                                    </div>
                                    <p>${option.reasoning}</p>
                                </li>
                            `;
                        }).join('')}
                    </ol>
                </div>
            `;
        }
        
        // Display Lair Actions
        if (recommendations.lairActions && recommendations.lairActions.length > 0) {
            sectionsHtml += `
                <div class="action-type-section">
                    <h4>Lair Actions</h4>
                    <ol class="recommendations-list">
                        ${recommendations.lairActions.map(option => {
                            const scorePercent = (option.priorityScore * 100).toFixed(0);
                            const scoreColor = option.priorityScore >= 0.8 ? '#2d7a2d' : 
                                             option.priorityScore >= 0.6 ? '#7a6d2d' : '#7a2d2d';
                            
                            return `
                                <li>
                                    <div class="option-header">
                                        <strong>${option.action}</strong>
                                        <span class="priority-score" style="background-color: ${scoreColor}">${scorePercent}%</span>
                                    </div>
                                    <p>${option.reasoning}</p>
                                </li>
                            `;
                        }).join('')}
                    </ol>
                </div>
            `;
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
                    margin-bottom: 12px;
                }
                .option-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 4px;
                }
                .option-header strong {
                    color: #191813;
                }
                .action-label {
                    font-size: 0.85em;
                    color: #666;
                    font-style: italic;
                }
                .priority-score {
                    display: inline-block;
                    padding: 2px 8px;
                    border-radius: 3px;
                    color: white;
                    font-weight: bold;
                    font-size: 0.85em;
                    margin-left: 8px;
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
        console.log(`${MODULE_TITLE} | Combat tracking ended`);
    }

    /**
     * Get turn history from turn tracker
     * @returns {Array} The turn history array
     */
    getTurnHistory() {
        if (this.turnTracker) {
            return this.turnTracker.getHistory();
        }
        return [];
    }

    /**
     * Set turn tracker reference
     * @param {TurnTracker} tracker - The turn tracker instance
     */
    setTurnTracker(tracker) {
        this.turnTracker = tracker;
    }
}