# DDB Importer Integration

This document describes the D&D Beyond Importer integration feature that allows the Combat AI module to fetch monster data directly from D&D Beyond via a proxy service.

## Overview

The module now supports two methods for extracting NPC action data:

1. **Local Parsing** (Default): Parses action data from Foundry VTT actor items
2. **DDB Importer Proxy** (Optional): Fetches rich HTML descriptions directly from D&D Beyond

## Configuration

### Settings Menu

Navigate to the module settings and click "Configure DDB Importer" to access:

- **Use DDB Importer**: Enable/disable DDB proxy integration
- **DDB Importer URL**: The proxy service endpoint (e.g., `https://proxy.ddb.mrprimate.co.uk`)
- **Cobalt Session**: Your D&D Beyond authentication token

### How to Get Your Cobalt Session Token

1. Log in to D&D Beyond in your browser
2. Open browser Developer Tools (F12)
3. Go to Application/Storage → Cookies
4. Find the cookie named `CobaltSession`
5. Copy its value into the settings

## How It Works

### Automatic Detection

When generating action descriptions, the module automatically:

1. Checks if "Use DDB Importer" setting is enabled
2. Looks for the `actor.flags.ddbimporter.id` flag on the actor
3. If both conditions are met, fetches data from DDB proxy
4. Otherwise, falls back to local parsing

### DDB Proxy Request

The module sends a POST request to:
```
{ddbImporterUrl}/proxy/monsters/ids
```

With body:
```json
{
    "cobalt": "your-cobalt-session-token",
    "ids": ["2059690"]
}
```

### Data Extraction

From the DDB response, the following fields are extracted and sent to the LLM:

- `specialTraitsDescription` - Special traits and passive abilities
- `actionsDescription` - Standard actions
- `bonusActionsDescription` - Bonus actions
- `reactionsDescription` - Reactions
- `legendaryActionsDescription` - Legendary actions
- `mythicActionsDescription` - Mythic actions (if applicable)
- `lairActionsDescription` - Lair actions (if applicable)

### LLM Processing

The DDB data uses a specialized prompt that:
- Parses HTML content and extracts tactical information
- Identifies dice notation from `data-dicenotation` attributes
- Creates separate entries for each distinct ability
- Maintains the same output format as local parsing

## Example Actor

See `examples/actor-amythist.json` for an example of a DDB-imported actor with the required flags:

```json
{
    "flags": {
        "ddbimporter": {
            "id": 2059690,
            "entityTypeId": 779871897,
            ...
        }
    }
}
```

## Example Response

See `examples/ddb-response.json` for the structure of the DDB proxy response.

## Error Handling

If any errors occur during DDB fetching:
- Errors are logged to console
- Module automatically falls back to local parsing
- User receives the same action descriptions (may be less detailed)

## Debug Mode

Enable "Debug Mode" in module settings to see:
- Which data source is being used (DDB vs Local)
- DDB proxy request details
- Generated action descriptions
- Cache hits and misses

## Benefits of DDB Integration

1. **Richer Descriptions**: Access to official D&D Beyond HTML formatting
2. **More Accurate**: Uses official source data
3. **Less Parsing**: No need to interpret complex Foundry item structures
4. **Consistent**: Same format across all DDB-imported monsters

## Limitations

- Requires valid D&D Beyond subscription and cobalt token
- Only works with actors imported via DDB Importer module
- Requires internet connection to DDB proxy service
- Token may expire and need refreshing
