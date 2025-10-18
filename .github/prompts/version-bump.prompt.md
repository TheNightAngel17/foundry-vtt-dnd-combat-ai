# Version Bump Prompt

This prompt helps you bump the version of the Foundry VTT D&D Combat AI module.

## Usage

Use this prompt to update the version number across all relevant files in the project.

## Prompt

```
Bump the version of this module from [CURRENT_VERSION] to [NEW_VERSION].

Please update the version in:
1. module.json - the "version" field
2. package.json - the "version" field

After updating, verify that both files have been updated correctly.
```

## Examples

### Patch version bump (bug fixes)
```
Bump the version from 0.1.0 to 0.1.1
```

### Minor version bump (new features, backward compatible)
```
Bump the version from 0.1.0 to 0.2.0
```

### Major version bump (breaking changes)
```
Bump the version from 0.1.0 to 1.0.0
```

## Version Guidelines

Follow semantic versioning (semver):
- **MAJOR** version (X.0.0): Breaking changes or major rewrites
- **MINOR** version (0.X.0): New features, backward compatible
- **PATCH** version (0.0.X): Bug fixes, backward compatible

## Files that contain version information

- `module.json` - Primary version field for Foundry VTT module
  - ensure that the values for `version`, `manifest`, and `download` are updated
- `package.json` - Node package version (should match module.json)

## Notes

- Always keep both version fields in sync
- Consider updating CHANGELOG.md after version bump
- Tag the release in git after bumping version
