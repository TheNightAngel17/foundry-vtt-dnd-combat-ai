# Testing DDB Importer Integration

## Prerequisites

1. DDB Importer module installed in Foundry VTT
2. Valid D&D Beyond subscription
3. Access to DDB Importer proxy service
4. At least one monster imported via DDB Importer

## Setup Steps

### 1. Configure DDB Importer Settings

1. Open Foundry VTT module settings
2. Find "D&D Combat AI" module
3. Click "Configure DDB Importer"
4. Set the following:
   - ✅ Check "Use DDB Importer"
   - URL: `https://proxy.ddb.mrprimate.co.uk` (or your proxy URL)
   - Cobalt Session: Your session token from D&D Beyond
5. Click "Save Configuration"

### 2. Get Your Cobalt Session Token

1. Open https://www.dndbeyond.com in your browser
2. Log in to your account
3. Press F12 to open Developer Tools
4. Navigate to: Application → Cookies → https://www.dndbeyond.com
5. Find cookie named `CobaltSession`
6. Copy the entire value
7. Paste into the module settings

## Test Cases

### Test 1: DDB-Imported Monster

**Expected Behavior**: Should use DDB proxy to fetch data

1. Import a monster using DDB Importer (e.g., Ancient Amethyst Dragon)
2. Start combat with that monster
3. When it's the monster's turn, check console for:
   ```
   Combat AI | Using DDB Importer data for [Monster Name]
   ```

### Test 2: Non-DDB Monster

**Expected Behavior**: Should fall back to local parsing

1. Create or use a manually-created monster (no DDB flags)
2. Start combat with that monster
3. Should NOT see "Using DDB Importer data" message
4. Should see normal action cache messages

### Test 3: DDB Setting Disabled

**Expected Behavior**: Should use local parsing even for DDB monsters

1. Disable "Use DDB Importer" in settings
2. Start combat with a DDB-imported monster
3. Should use local parsing method

### Test 4: Missing Cobalt Token

**Expected Behavior**: Should fail gracefully and fall back to local parsing

1. Clear the cobalt session in settings
2. Start combat with a DDB-imported monster
3. Should see error in console
4. Should still generate actions using local method

### Test 5: Invalid Proxy URL

**Expected Behavior**: Should fail gracefully and fall back

1. Set an invalid proxy URL
2. Start combat with a DDB-imported monster
3. Should see error in console
4. Should fall back to local parsing

## Debug Mode

Enable debug mode to see detailed logging:

1. Module Settings → Debug Mode → ✅ Enable
2. Check browser console for detailed logs:
   - Which data source is being used
   - DDB proxy requests
   - Generated action descriptions
   - Cache operations

## Verification Checklist

- [ ] Settings menu opens correctly
- [ ] Settings save successfully
- [ ] DDB-imported monsters use DDB data
- [ ] Non-DDB monsters use local parsing
- [ ] Errors are caught and logged
- [ ] Fallback to local parsing works
- [ ] Action descriptions are generated correctly from both sources
- [ ] Cache works for both data sources

## Expected Console Output

### Successful DDB Fetch
```
Combat AI | Generating action descriptions for Ancient Amethyst Dragon
Combat AI | Using DDB Importer data for Ancient Amethyst Dragon
Combat AI | Fetching DDB data from https://proxy.ddb.mrprimate.co.uk/proxy/monsters/ids for ID 2059690
Combat AI | Generated 15 action descriptions from DDB for Ancient Amethyst Dragon
```

### Fallback to Local
```
Combat AI | Generating action descriptions for Ancient Amethyst Dragon
Combat AI | Using DDB Importer data for Ancient Amethyst Dragon
Combat AI | Error generating actions from DDB: [error details]
Combat AI | Generated 12 action descriptions for Ancient Amethyst Dragon
```

## Common Issues

### Issue: "No DDB Importer ID found"
**Solution**: The actor was not imported via DDB Importer. Use local parsing or re-import.

### Issue: "DDB Importer URL not configured"
**Solution**: Set the proxy URL in module settings.

### Issue: "Cobalt session not configured"
**Solution**: Add your D&D Beyond cobalt session token.

### Issue: "DDB proxy request failed: 401"
**Solution**: Your cobalt session token has expired. Get a new one from D&D Beyond.

### Issue: "DDB proxy request failed: 403"
**Solution**: You may not have access to this content on D&D Beyond.

## Success Criteria

✅ DDB-imported monsters generate action descriptions using DDB data
✅ Non-DDB monsters continue to work with local parsing
✅ Errors are handled gracefully with fallbacks
✅ Action descriptions are accurate and tactical
✅ Performance is acceptable (cached after first use)
