# Template File Issue - Troubleshooting

## The Error
```
Error: ENOENT: no such file or directory, open '/data/Data/modules/dnd-combat-ai/templates/llm-config.hbs'
```

## Root Cause
Foundry VTT is looking for the template file in its data directory, but the file hasn't been copied there yet.

## Solutions

### Solution 1: Copy Module to Foundry (Recommended for Development)
If you're developing, you need to ensure your module files are accessible to Foundry:

**Option A: Symbolic Link (Best for development)**
```powershell
# From PowerShell (Run as Administrator)
cd "C:\Users\YourUsername\AppData\Local\FoundryVTT\Data\modules"
New-Item -ItemType SymbolicLink -Name "dnd-combat-ai" -Target "d:\source\gh_thenightangel17\foundry-vtt-dnd-combat-ai"
```

**Option B: Manual Copy**
```powershell
# Copy the entire module folder to Foundry's modules directory
Copy-Item -Path "d:\source\gh_thenightangel17\foundry-vtt-dnd-combat-ai" -Destination "C:\Users\YourUsername\AppData\Local\FoundryVTT\Data\modules\dnd-combat-ai" -Recurse -Force
```

### Solution 2: Reload Foundry
After making changes to template files, you need to:
1. **Refresh the browser** (F5) - Sometimes this is enough
2. **Restart Foundry** - If refresh doesn't work
3. **Return to Setup** - Go back to setup and relaunch the world

### Solution 3: Verify Template File Exists
Check that the file is in the correct location:

**In Development:**
```
d:\source\gh_thenightangel17\foundry-vtt-dnd-combat-ai\templates\llm-config.hbs
```

**In Foundry:**
```
C:\Users\YourUsername\AppData\Local\FoundryVTT\Data\modules\dnd-combat-ai\templates\llm-config.hbs
```

### Solution 4: Check module.json
The module.json doesn't need to explicitly list templates, but verify it's correctly structured:

```json
{
  "id": "dnd-combat-ai",
  "esmodules": [
    "scripts/main.js"
  ],
  "styles": [
    "styles/combat-ai.css"
  ]
}
```

## What We Changed

### Fixed Handlebars Helper Issue
We removed the `(eq configType 'actionCache')` helper since it's not registered:

**Before:**
```handlebars
<p class="notes">Choose which LLM provider to use for {{#if (eq configType 'actionCache')}}generating cached action descriptions{{else}}combat recommendations{{/if}}</p>
```

**After:**
```handlebars
<p class="notes">Choose which LLM provider to use for this configuration</p>
```

## Development Workflow

For active development, the recommended workflow is:

1. **Use Symbolic Link**: Create a symlink so Foundry reads directly from your dev folder
2. **Edit Files**: Make changes in your source folder
3. **Reload**: Refresh browser (F5) to see changes
4. **For Template Changes**: Sometimes need full Foundry restart

## Verification Steps

After applying a solution:

1. Open Foundry VTT
2. Go to your world
3. Open Module Settings
4. Find "D&D Combat AI"
5. Click "Configure Settings"
6. Look for the two configuration buttons:
   - 🗄️ Configure Action Cache LLM
   - 🧠 Configure Combat LLM
7. Click one - the dialog should open without errors

## Common Issues

### Issue: "Module not found"
**Fix**: Ensure the module folder name matches the `id` in module.json (`dnd-combat-ai`)

### Issue: "Changes don't appear"
**Fix**: Hard refresh browser (Ctrl+F5) or restart Foundry

### Issue: "Template still not found after copy"
**Fix**: 
1. Return to Setup
2. Reload Modules
3. Relaunch world

### Issue: "Permission denied creating symlink"
**Fix**: Run PowerShell as Administrator

## Files Changed in This Fix

- `templates/llm-config.hbs` - Removed unsupported Handlebars helper
- `scripts/settings.js` - Already correct, no changes needed

## Next Steps

Once the template loads correctly:
1. Test both configuration menus
2. Verify provider switching works
3. Test saving settings
4. Confirm settings persist after reload
