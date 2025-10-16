# Testing Guide for Round Tracking Feature

## Prerequisites

To test the Round Tracking feature, you need:
1. A running Foundry VTT instance (v11 or higher)
2. The D&D 5e system installed and activated
3. The D&D Combat AI module installed (from this branch)
4. At least one combat encounter set up with tokens

## Setup for Testing

### 1. Module Installation
1. Copy the module files to your Foundry data folder:
   ```
   [Foundry Data]/modules/dnd-combat-ai/
   ```
2. Restart Foundry VTT
3. Enable the module in your world settings

### 2. Configure Settings
1. Go to **Game Settings → Module Settings → D&D Combat AI**
2. Verify these settings:
   - **Enable AI Assistance**: Checked
   - **Enable Round Tracking**: Checked
   - **Round History Context**: 3 (or your preference)
3. Configure your LLM provider (OpenAI, Anthropic, or Local)

### 3. Prepare a Combat Encounter
1. Create a scene with a battle map
2. Place at least 2-3 PC tokens
3. Place at least 2-3 NPC tokens
4. Ensure NPCs have proper actor data (HP, abilities, etc.)

## Test Scenarios

### Test 1: Basic Round Tracking

**Objective**: Verify that snapshots are created and the dialog appears

**Steps**:
1. Start a combat encounter (click Begin Combat in the combat tracker)
2. Advance to Round 1
3. **Expected**: Console log shows "Round 1 snapshot created"
4. Advance to Round 2
5. **Expected**: 
   - Dialog appears titled "Round 2 Description"
   - Dialog shows "Auto-detected changes" section (may be empty if nothing changed)
   - Text area is pre-filled with round summary

**Verification**:
- [ ] Combat starts successfully
- [ ] Round 1 begins without errors
- [ ] Round 2 dialog appears
- [ ] Dialog has correct title and structure
- [ ] No console errors

### Test 2: Auto-Detection - Damage

**Objective**: Verify damage detection between rounds

**Steps**:
1. Start combat, advance to Round 1
2. Deal damage to an NPC (reduce their HP)
3. Advance to Round 2
4. **Expected**: Dialog shows "NPC Name took X damage (Y → Z HP)"

**Verification**:
- [ ] Damage is correctly detected
- [ ] HP values are accurate
- [ ] Change description is clear

### Test 3: Auto-Detection - Healing

**Objective**: Verify healing detection

**Steps**:
1. During a round, heal a combatant (increase their HP)
2. Advance to next round
3. **Expected**: Dialog shows "Character Name healed X HP (Y → Z HP)"

**Verification**:
- [ ] Healing is correctly detected
- [ ] HP values are accurate
- [ ] Change description is clear

### Test 4: Auto-Detection - Movement

**Objective**: Verify movement detection

**Steps**:
1. During a round, move a token significantly (at least 2 grid squares)
2. Advance to next round
3. **Expected**: Dialog shows "Character Name moved approximately X ft"

**Verification**:
- [ ] Movement is detected
- [ ] Distance estimate is reasonable
- [ ] Small movements (<1 square) are ignored

### Test 5: Auto-Detection - Conditions

**Objective**: Verify condition tracking

**Steps**:
1. Apply a condition/effect to a combatant (e.g., Stunned, Blessed)
2. Advance to next round
3. **Expected**: Dialog shows "Character Name gained condition: ConditionName"
4. Remove the condition
5. Advance to next round
6. **Expected**: Dialog shows "Character Name lost condition: ConditionName"

**Verification**:
- [ ] Conditions gained are detected
- [ ] Conditions lost are detected
- [ ] Condition names are correct

### Test 6: GM Description Input

**Objective**: Verify GM can add custom descriptions

**Steps**:
1. When round dialog appears, add custom text after auto-detected changes
2. Click "Save Description"
3. **Expected**: 
   - Notification appears: "Round X description saved"
   - Dialog closes
   - No errors in console

**Verification**:
- [ ] Custom text can be entered
- [ ] Save button works
- [ ] Notification appears
- [ ] No errors

### Test 7: Skip Description

**Objective**: Verify skip functionality

**Steps**:
1. When round dialog appears, click "Skip"
2. **Expected**: 
   - Dialog closes
   - No description saved
   - Combat continues normally

**Verification**:
- [ ] Skip button works
- [ ] Dialog closes
- [ ] No errors

### Test 8: AI Context Integration

**Objective**: Verify round history is included in AI prompts

**Steps**:
1. Enable Debug Mode in settings
2. Save descriptions for Rounds 1, 2, and 3
3. On an NPC turn in Round 4, check the console
4. Look for the AI prompt in debug logs
5. **Expected**: Prompt includes section "Combat History:" with previous round descriptions

**Verification**:
- [ ] Debug logs show AI prompt
- [ ] Combat History section is present
- [ ] Previous round descriptions are included
- [ ] Number of rounds matches setting (default: 3)

### Test 9: Setting - Disable Round Tracking

**Objective**: Verify feature can be disabled

**Steps**:
1. In settings, uncheck "Enable Round Tracking"
2. Start a new combat
3. Advance through rounds
4. **Expected**: No dialogs appear, no snapshots created

**Verification**:
- [ ] No dialogs when disabled
- [ ] Combat continues normally
- [ ] No errors

### Test 10: Setting - Round History Context

**Objective**: Verify context window size setting

**Steps**:
1. Set "Round History Context" to 2
2. Save descriptions for Rounds 1, 2, 3, 4
3. On Round 5, check AI prompt
4. **Expected**: Only Rounds 3 and 4 are included in prompt

**Verification**:
- [ ] Setting affects number of rounds in prompt
- [ ] Only recent rounds are included
- [ ] Count matches setting

### Test 11: Combat End Cleanup

**Objective**: Verify history is cleared when combat ends

**Steps**:
1. Complete a combat with round descriptions saved
2. End the combat
3. Start a new combat
4. **Expected**: 
   - New combat has no history
   - Round 1 of new combat has empty history
   - Console shows "Round history cleared"

**Verification**:
- [ ] History cleared on combat end
- [ ] New combat starts fresh
- [ ] No residual data from previous combat

### Test 12: Multiple Combatants

**Objective**: Verify tracking works with many combatants

**Steps**:
1. Create combat with 6+ combatants (mix of PCs and NPCs)
2. Make changes to multiple combatants in a round
3. Advance to next round
4. **Expected**: All changes are detected and listed

**Verification**:
- [ ] Multiple changes detected
- [ ] All combatants tracked correctly
- [ ] Dialog not overwhelming with many changes

## Console Checks

### Expected Console Messages (with Debug Mode enabled)

**On Combat Start**:
```
D&D Combat AI | Combat tracking started
```

**On Round Start**:
```
D&D Combat AI | Round X snapshot created
```

**On Combat End**:
```
D&D Combat AI | Round history cleared
D&D Combat AI | Combat tracking ended
```

### Error Scenarios to Watch For

1. **Missing Token**: Combatant without token should not crash
2. **Missing Actor**: Combatant without actor should be skipped
3. **No Canvas**: Testing without active scene should not crash
4. **Rapid Round Changes**: Quick round advancement should not cause issues

## Performance Checks

1. **Snapshot Creation**: Should be fast (<100ms) even with many combatants
2. **Dialog Display**: Should appear within 500ms of round change
3. **Memory Usage**: Should not accumulate over long combats (history is cleared on end)

## Known Limitations

1. **Position Tracking**: Requires tokens on canvas (won't work for theater-of-mind)
2. **Movement Threshold**: Small movements (<50 pixels) may not be detected
3. **Grid Size**: Distance calculations assume standard grid (5ft per square)
4. **Condition Names**: Limited to what's stored in effect.name or effect.label

## Troubleshooting

### Dialog Not Appearing
- Check "Enable Round Tracking" setting is enabled
- Verify you're the GM (dialogs only show to GM)
- Check browser console for errors

### Auto-Detection Not Working
- Ensure tokens are on the canvas
- Verify actor data is accessible
- Check that changes are significant enough (e.g., >50 pixels for movement)

### AI Not Using History
- Enable Debug Mode to see prompts
- Verify "Enable Round Tracking" is on
- Check that descriptions were saved (look for notifications)

## Test Completion Checklist

- [ ] All 12 test scenarios completed
- [ ] All verifications passed
- [ ] No console errors observed
- [ ] Performance is acceptable
- [ ] Settings work as expected
- [ ] Feature can be disabled
- [ ] Documentation is clear and accurate

## Reporting Issues

If you find issues during testing:

1. **Note the exact steps to reproduce**
2. **Capture console errors** (if any)
3. **Note your environment**:
   - Foundry VTT version
   - D&D 5e system version
   - Browser and version
   - Module version
4. **Take screenshots** if relevant
5. **Report on GitHub Issues** with all details

## Success Criteria

The feature is working correctly if:

✅ Snapshots are created each round without errors
✅ Changes are detected accurately
✅ Dialog appears and is usable
✅ Descriptions can be saved or skipped
✅ History is included in AI prompts
✅ Settings control feature behavior
✅ Combat end clears history
✅ No performance degradation
✅ No console errors during normal operation
