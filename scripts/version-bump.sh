#!/bin/bash
# ============================================
# Sliplly Version Bump Script
# ============================================
# Bumps app version in app.json and syncs with native configs.
#
# Usage:
#   ./scripts/version-bump.sh [major|minor|patch]
#
# Examples:
#   ./scripts/version-bump.sh patch   # 1.0.0 → 1.0.1
#   ./scripts/version-bump.sh minor   # 1.0.0 → 1.1.0
#   ./scripts/version-bump.sh major   # 1.0.0 → 2.0.0

set -e

BUMP_TYPE=${1:-patch}

echo "=========================================="
echo "  Sliplly Version Bump ($BUMP_TYPE)"
echo "=========================================="

# Read current version
CURRENT=$(node -p "require('./app.json').expo.version")
echo "  Current version: $CURRENT"

# Parse version parts
IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT"

# Bump
case "$BUMP_TYPE" in
  major)
    MAJOR=$((MAJOR + 1))
    MINOR=0
    PATCH=0
    ;;
  minor)
    MINOR=$((MINOR + 1))
    PATCH=0
    ;;
  patch)
    PATCH=$((PATCH + 1))
    ;;
  *)
    echo "Error: Bump type must be 'major', 'minor', or 'patch'"
    exit 1
    ;;
esac

NEW_VERSION="$MAJOR.$MINOR.$PATCH"
echo "  New version: $NEW_VERSION"

# Update app.json
node -e "
const fs = require('fs');
const config = JSON.parse(fs.readFileSync('app.json', 'utf8'));
config.expo.version = '$NEW_VERSION';
// Also bump Android versionCode
const currentCode = config.expo.android?.versionCode || 1;
config.expo.android = config.expo.android || {};
config.expo.android.versionCode = currentCode + 1;
// Also bump iOS buildNumber
const currentBuild = parseInt(config.expo.ios?.buildNumber || '1', 10);
config.expo.ios = config.expo.ios || {};
config.expo.ios.buildNumber = String(currentBuild + 1);
fs.writeFileSync('app.json', JSON.stringify(config, null, 2) + '\n');
console.log('  Android versionCode:', config.expo.android.versionCode);
console.log('  iOS buildNumber:', config.expo.ios.buildNumber);
"

echo ""
echo "=========================================="
echo "  ✓ Version bumped to $NEW_VERSION"
echo "=========================================="
echo "  Don't forget to commit and tag:"
echo "    git add app.json"
echo "    git commit -m 'chore: bump version to $NEW_VERSION'"
echo "    git tag v$NEW_VERSION"
echo "=========================================="
