# Pull Request

## Description
<!-- Provide a brief description of the changes in this PR -->

## Type of Change
<!-- Mark the relevant option with an 'x' -->

- [ ] 🐛 Bug fix (non-breaking change which fixes an issue)
- [ ] ✨ New feature (non-breaking change which adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] 📝 Documentation update
- [ ] 🎨 Code style update (formatting, renaming)
- [ ] ♻️ Refactoring (no functional changes, no API changes)
- [ ] 🔧 Configuration change
- [ ] ⚡ Performance improvement
- [ ] ✅ Test update

## Related Issues
<!-- Link to related issues using #issue_number -->

Fixes #
Relates to #

## Changes Made
<!-- Provide a detailed list of changes -->

- 
- 
- 

## LLM Provider Testing
<!-- If applicable, indicate which LLM providers were tested -->

- [ ] OpenAI (GPT-4o-mini)
- [ ] OpenAI (GPT-4o)
- [ ] OpenAI (O1 models)
- [ ] Anthropic (Claude 3.5 Haiku)
- [ ] Anthropic (Claude 3.5 Sonnet)
- [ ] Anthropic (Claude Opus 4)
- [ ] Local LLM (Ollama)
- [ ] Local LLM (LM Studio)
- [ ] N/A - No LLM changes

## Testing Checklist
<!-- Mark completed items with an 'x' -->

### Core Functionality
- [ ] Module loads without errors in FoundryVTT
- [ ] Settings can be opened and modified
- [ ] Changes persist after saving
- [ ] No console errors during normal operation

### Combat AI Features (if applicable)
- [ ] AI recommendations generate correctly
- [ ] Action cache system works as expected
- [ ] Difficulty levels produce appropriate responses
- [ ] Manual "Get AI Advice" button works
- [ ] Automatic turn detection works

### Integration Testing (if applicable)
- [ ] Compatible with FoundryVTT v11+
- [ ] Compatible with D&D 5e system v3.0+
- [ ] DDB Importer integration works (if changed)
- [ ] No conflicts with other common modules

### Code Quality
- [ ] Code follows existing style conventions
- [ ] No unnecessary console.log statements
- [ ] Error handling is appropriate
- [ ] Comments added for complex logic

## Screenshots/Examples
<!-- If applicable, add screenshots or example output -->

## Additional Notes
<!-- Any additional information that reviewers should know -->

## Checklist
<!-- Final checks before submitting -->

- [ ] I have tested these changes in a live FoundryVTT environment
- [ ] I have updated the documentation (README.md) if needed
- [ ] I have added appropriate comments to my code
- [ ] My changes generate no new warnings or errors
- [ ] I have checked my code for any hardcoded values that should be configurable
- [ ] I have considered the impact on API costs (if LLM changes)
- [ ] I have updated CHANGELOG.md following Keep a Changelog format

## For Maintainers
<!-- For use by project maintainers during review -->

- [ ] Code review completed
- [ ] Tests pass
- [ ] Documentation is adequate
- [ ] Ready to merge
