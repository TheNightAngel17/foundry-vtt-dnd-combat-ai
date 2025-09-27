# Installation Guide

This guide walks you through installing and setting up the D&D Combat AI module for FoundryVTT.

## Prerequisites

- FoundryVTT v11 or higher (tested on v13)
- D&D 5e game system v3.0 or higher (tested on v5.0.4)
- Game Master permissions
- LLM provider account (OpenAI, Anthropic) or local LLM setup

## Step 1: Install the Module

### Option A: From Foundry VTT (Recommended)
1. Open FoundryVTT and navigate to your world
2. Click **Settings** → **Manage Modules**
3. Click **Install Module**
4. Search for "D&D Combat AI"
5. Click **Install**

### Option B: Manual Installation
1. Copy this manifest URL:
   ```
   https://github.com/TheNightAngel17/foundry-vtt-dnd-combat-ai/releases/latest/download/module.json
   ```
2. In FoundryVTT, go to **Settings** → **Manage Modules**
3. Click **Install Module**
4. Paste the manifest URL in the **Manifest URL** field
5. Click **Install**

## Step 2: Enable the Module

1. In **Manage Modules**, find "D&D Combat AI"
2. Check the box to enable it
3. Click **Save Module Settings**
4. **Restart** your world when prompted

## Step 3: Configure Your LLM Provider

### Option A: OpenAI (ChatGPT)

1. **Get API Key**:
   - Visit [OpenAI Platform](https://platform.openai.com/)
   - Create an account or sign in
   - Go to API Keys section
   - Click "Create new secret key"
   - Copy the key (starts with `sk-`)

2. **Configure in Foundry**:
   - Go to **Settings** → **Configure Settings** → **Module Settings**
   - Find "D&D Combat AI" section
   - Set **LLM Provider** to "OpenAI (ChatGPT)"
   - Enter your **API Key**
   - Choose your preferred **OpenAI Model** (GPT-3.5 Turbo recommended)
   - Click **Test Connection** to verify

### Option B: Anthropic (Claude)

1. **Get API Key**:
   - Visit [Anthropic Console](https://console.anthropic.com/)
   - Create an account or sign in
   - Go to API Keys section
   - Create a new key
   - Copy the key

2. **Configure in Foundry**:
   - Set **LLM Provider** to "Anthropic (Claude)"
   - Enter your **API Key**
   - Choose your preferred **Anthropic Model**
   - Click **Test Connection** to verify

### Option C: Local LLM

1. **Install Local LLM Server**:
   
   **Ollama** (Recommended):
   ```bash
   # Install Ollama
   curl -fsSL https://ollama.ai/install.sh | sh
   
   # Pull a model
   ollama pull llama2
   
   # Start the server (runs on http://localhost:11434)
   ollama serve
   ```
   
   **LM Studio**:
   - Download from [lmstudio.ai](https://lmstudio.ai/)
   - Install and download a model
   - Start the local server

2. **Configure in Foundry**:
   - Set **LLM Provider** to "Local LLM"
   - Set **Local LLM Endpoint** to your server URL (e.g., `http://localhost:11434`)
   - Set **Local LLM Model** to your model name (e.g., `llama2`)
   - Click **Test Connection** to verify

## Step 4: Basic Configuration

1. **AI Difficulty**: Choose your preferred difficulty level:
   - **Easy**: For new players or relaxed games
   - **Normal**: Standard tactical play (recommended)
   - **Hard**: Challenging but fair encounters
   - **Deadly**: High-stakes tactical combat
   - **TPK**: Maximum difficulty warning!

2. **Auto-display Recommendations**: ✅ Enable to automatically show AI advice

3. **Additional Settings**:
   - **Context Memory**: How many turns to remember (3 recommended)
   - **Request Timeout**: How long to wait for AI (30 seconds recommended)

## Step 5: Test the Setup

1. **Start a Combat**:
   - Create or open a scene with NPCs
   - Start combat initiative
   - Roll initiative for all participants

2. **Verify AI Activation**:
   - When an NPC's turn begins, you should see AI recommendations
   - Or click the "Get AI Advice" button manually
   - Check the console (F12) for any error messages

3. **Test Manual Controls**:
   - Look for the difficulty dropdown in the combat tracker
   - Try the brain icon in scene controls for quick settings

## Common Setup Issues

### "No API key configured"
- Double-check you entered the API key correctly
- Make sure you saved the settings
- Verify the key is active and has billing set up (for cloud providers)

### "Connection failed"
- Check your internet connection
- Verify API key permissions and billing status
- For local LLMs, ensure the server is running and accessible

### "Module not loading"
- Ensure you have the correct FoundryVTT version (v11+)
- Check that D&D 5e system is active and updated
- Try disabling other modules to check for conflicts
- Check browser console (F12) for error messages

### No recommendations appearing
- Verify the module is enabled and configured
- Check that "Enable AI Assistance" is turned on
- Make sure you're testing with NPCs (not player characters)
- Try manual mode first with the "Get AI Advice" button

## Cost Considerations

### Cloud Providers (Estimated per request):
- **OpenAI GPT-3.5 Turbo**: $0.001 - $0.002
- **OpenAI GPT-4**: $0.01 - $0.02  
- **Anthropic Claude Haiku**: $0.001 - $0.002
- **Anthropic Claude Sonnet**: $0.005 - $0.01

**Typical usage**: 10-20 requests per 3-hour session = $0.02 - $0.40 per session

### Free Options:
- **Local LLMs**: Free after initial setup
- **API Free Tiers**: Most providers offer free credits for testing

## Next Steps

Once installed and configured:
1. Read the [README](README.md) for detailed feature descriptions
2. Check [EXAMPLES](EXAMPLES.md) for usage scenarios
3. Join our [Discord/Forum] for community support
4. Report issues on [GitHub](https://github.com/TheNightAngel17/foundry-vtt-dnd-combat-ai/issues)

## Updating the Module

FoundryVTT will automatically notify you of updates. To manually update:
1. Go to **Settings** → **Manage Modules**
2. Find "D&D Combat AI" and click **Update**
3. Restart your world after updating

---

**Need help?** Join our community or create an issue on GitHub with:
- Your FoundryVTT version
- Your D&D 5e system version  
- Error messages from console (F12)
- Steps to reproduce the issue