# Combat Recommendations Dialog Refactor

## Summary
Refactored the combat recommendations display from an inline HTML Dialog to a proper ApplicationV2 with a Handlebars template.

## Changes Made

### 1. New Template File
**File:** `templates/combat-recommendations.hbs`
- Created a Handlebars template for the recommendations dialog
- Supports all action types: Turn Actions (regular + bonus), Legendary Actions, Reactions, and Lair Actions
- Uses conditional sections to only display available action types
- Includes proper styling structure with semantic HTML

### 2. New ApplicationV2 Class
**File:** `scripts/combat-ai-manager.js` (added class at end)
- `CombatRecommendationsDialog` extends ApplicationV2 with HandlebarsApplicationMixin
- Properly processes recommendations data in `_prepareContext()`:
  - Calculates score percentages and colors
  - Builds combined action text for turn actions (handles action/bonus action ordering)
  - Processes all action type arrays consistently
- Configurable window options (resizable, minimizable)
- Custom title based on actor name

### 3. Simplified Display Method
**File:** `scripts/combat-ai-manager.js` (modified method)
- `displayRecommendations()` now simply instantiates and renders the ApplicationV2 class
- No more inline HTML string building
- Much cleaner and more maintainable

### 4. Updated CSS
**File:** `styles/combat-ai.css` (appended)
- Added styles specific to `.combat-recommendations` ApplicationV2 dialog
- Maintains the same visual appearance as before
- Uses semantic class names and proper CSS specificity

## Benefits

1. **Separation of Concerns**: HTML template separate from JavaScript logic
2. **Maintainability**: Much easier to modify the UI layout in `.hbs` file
3. **Consistency**: Uses the same ApplicationV2 pattern as the LLM config dialogs
4. **Type Safety**: Proper Foundry VTT v12 API usage
5. **Reusability**: Template and class can be easily extended or modified
6. **Modern Pattern**: Follows Foundry VTT best practices for v12+

## Testing Recommendations

1. Start a combat encounter with NPCs
2. Click on an NPC's turn
3. Verify the recommendations dialog appears
4. Check that all sections render correctly:
   - Turn Action Options (with proper action/bonus action ordering)
   - Legendary Actions (if applicable)
   - Reactions (if applicable)
   - Lair Actions (if applicable)
5. Verify priority scores display with correct colors
6. Test window resizing and minimizing
7. Verify the dialog can be closed properly

## Compatibility

- Foundry VTT v12+
- Uses ApplicationV2 API (v12+ feature)
- Backward compatible with existing recommendation data structures
