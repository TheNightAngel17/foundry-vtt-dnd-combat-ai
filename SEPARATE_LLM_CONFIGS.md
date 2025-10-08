# Separate LLM Configurations

This module now supports separate LLM configurations for different purposes, allowing you to optimize performance and cost.

## Two Configuration Types

### 1. Action Cache LLM Configuration
**Purpose**: Generate concise action descriptions for NPC abilities

- **Typical Usage**: Processes all abilities for an NPC once, then caches for 1 hour
- **Frequency**: Infrequent - only when cache is empty or expired
- **Recommended Model**: Fast, cheap local model (e.g., llama3.2 on Ollama)
- **Default**: Local (Ollama) with llama3.2
- **Icon**: Database (fa-database)

### 2. Combat Recommendation LLM Configuration
**Purpose**: Generate tactical recommendations during combat

- **Typical Usage**: Called every NPC turn to analyze the current combat situation
- **Frequency**: Frequent - multiple times per combat
- **Recommended Model**: Powerful cloud model for best tactical advice (e.g., GPT-4o-mini, Claude 3.5 Haiku)
- **Default**: OpenAI with gpt-4o-mini
- **Icon**: Brain (fa-brain)

## Configuration Settings

Each configuration type has its own complete set of settings:

### Provider Selection
- OpenAI
- Anthropic (Claude)
- Local (Ollama / LM Studio)

### OpenAI Settings
- **Model**: gpt-4o-mini, gpt-4o, o1-mini, o1
- **Reasoning Effort** (O1 models): low, medium, high
- **Max Tokens**: Response length limit
- **API Key**: Your OpenAI API key

### Anthropic Settings
- **Model**: Claude 3.5 Haiku, Claude 3.5 Sonnet, Claude Opus 4
- **API Key**: Your Anthropic API key

### Local Settings
- **Endpoint**: URL for your local LLM server (default: http://localhost:11434)
- **Model Name**: Model to use (e.g., llama3.2, mistral)

## Accessing the Configurations

In the module settings, you'll find two separate configuration buttons:

1. **Action Cache LLM Configuration** - Configure the model used for generating action descriptions
2. **Combat Recommendation LLM Configuration** - Configure the model used for tactical recommendations

## Example Configurations

### Cost-Optimized Setup
```
Action Cache: Local (llama3.2 on Ollama)
Combat Recommendations: OpenAI (gpt-4o-mini)
```
- Action caching is free (local)
- Combat recommendations use affordable GPT-4o-mini (~$0.15 per 1M input tokens)

### Performance-Optimized Setup
```
Action Cache: OpenAI (gpt-4o-mini)
Combat Recommendations: OpenAI (o1 with high reasoning effort)
```
- Fast action cache generation
- Maximum tactical intelligence for combat

### Fully Local Setup
```
Action Cache: Local (llama3.2)
Combat Recommendations: Local (llama3.2 or larger model)
```
- Completely free
- No API costs
- Requires local LLM server (Ollama, LM Studio, etc.)

### Fully Cloud Setup
```
Action Cache: Anthropic (Claude 3.5 Haiku)
Combat Recommendations: Anthropic (Claude 3.5 Sonnet)
```
- No local infrastructure needed
- Fast haiku model for caching
- Powerful sonnet model for tactical decisions

## Implementation Details

### How It Works

1. **Settings Structure**: Each config type has a prefix in settings:
   - Action Cache: `actionCacheLLM*` (e.g., `actionCacheLLMProvider`)
   - Combat Recommendations: `combatLLM*` (e.g., `combatLLMProvider`)

2. **LLMConnector**: The `generateResponse` method now accepts a `configType` parameter:
   ```javascript
   await llmConnector.generateResponse(prompt, 'actionCache');
   await llmConnector.generateResponse(prompt, 'combatRecommendation');
   ```

3. **Automatic Routing**: Based on the config type, the connector loads the appropriate settings and uses the correct provider/model.

### Files Modified

- `scripts/settings.js`: Added separate menu registrations and hidden settings
- `scripts/llm-connector.js`: Updated to accept and use configType parameter
- `scripts/action-cache.js`: Passes 'actionCache' when generating descriptions
- `scripts/combat-ai-manager.js`: Passes 'combatRecommendation' when generating tactics
- `templates/llm-config.hbs`: NEW - Configuration dialog UI

### Configuration Menu (LLMConfigMenu)

The `LLMConfigMenu` class is a FormApplication that:
- Opens when clicking a configuration button in settings
- Shows provider-specific fields dynamically
- Saves settings with the appropriate prefix
- Provides clear labels and help text

## Benefits

### Cost Savings
- Use free local models for bulk action caching
- Reserve paid API calls for high-value tactical decisions
- Optimize token usage per task type

### Performance
- Fast local models can process action descriptions quickly
- Powerful cloud models provide better tactical reasoning
- Each task uses the most appropriate model

### Flexibility
- Mix and match providers (local + cloud)
- Use different OpenAI models for different purposes
- Scale up/down based on needs and budget

## Troubleshooting

### "No API key configured for actionCache"
- Open **Action Cache LLM Configuration**
- Either enter an API key for OpenAI/Anthropic, or switch provider to "Local"

### "No API key configured for combatRecommendation"
- Open **Combat Recommendation LLM Configuration**
- Either enter an API key for OpenAI/Anthropic, or switch provider to "Local"

### Configuration dialog doesn't save
- Make sure you click the "Save Configuration" button
- Check browser console for errors
- Ensure API keys don't have extra spaces

### Actions not caching
- Check that Action Cache LLM is configured correctly
- Enable Debug Mode to see cache status
- Verify local LLM is running (if using local provider)

## Future Enhancements

Potential improvements to this system:
- Model-specific defaults (auto-configure recommended settings)
- Usage tracking and cost estimation
- A/B testing different models
- Temperature and other advanced parameters per config
