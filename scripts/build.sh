#!/bin/bash
# ============================================
# Sliplly Build Script
# ============================================
# Usage:
#   ./scripts/build.sh [platform] [profile]
#
# Examples:
#   ./scripts/build.sh android development
#   ./scripts/build.sh ios preview
#   ./scripts/build.sh android production
#   ./scripts/build.sh ios production

set -e

PLATFORM=${1:-android}
PROFILE=${2:-preview}

echo "=========================================="
echo "  Sliplly Build"
echo "=========================================="
echo "  Platform: $PLATFORM"
echo "  Profile:  $PROFILE"
echo "=========================================="

# Validate platform
if [[ "$PLATFORM" != "android" && "$PLATFORM" != "ios" && "$PLATFORM" != "all" ]]; then
  echo "Error: Platform must be 'android', 'ios', or 'all'"
  exit 1
fi

# Validate profile
if [[ "$PROFILE" != "development" && "$PROFILE" != "preview" && "$PROFILE" != "staging" && "$PROFILE" != "production" ]]; then
  echo "Error: Profile must be 'development', 'preview', 'staging', or 'production'"
  exit 1
fi

# Pre-build checks
echo ""
echo "→ Pre-build checks..."

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
  echo "Error: EAS CLI not found. Install with: npm install -g eas-cli"
  exit 1
fi

# Check if logged in to EAS
if ! eas whoami &> /dev/null; then
  echo "Error: Not logged in to EAS. Run: eas login"
  exit 1
fi

# Check if app.json or app.config.ts exists
if [[ ! -f "app.json" && ! -f "app.config.ts" ]]; then
  echo "Error: No app.json or app.config.ts found"
  exit 1
fi

echo "✓ Pre-build checks passed"

# Version bump for production
if [[ "$PROFILE" == "production" ]]; then
  echo ""
  echo "→ Production build — checking version..."
  CURRENT_VERSION=$(node -p "require('./app.json').expo.version")
  echo "  Current version: $CURRENT_VERSION"
  echo "  (Auto-increment is enabled in eas.json for production)"
fi

# Run TypeScript check
echo ""
echo "→ TypeScript check..."
if command -v npx &> /dev/null; then
  npx tsc --noEmit || echo "⚠ TypeScript warnings (non-blocking)"
fi

# Build
echo ""
echo "→ Starting EAS build..."
if [[ "$PLATFORM" == "all" ]]; then
  eas build --platform android --profile "$PROFILE" --non-interactive
  eas build --platform ios --profile "$PROFILE" --non-interactive
else
  eas build --platform "$PLATFORM" --profile "$PROFILE" --non-interactive
fi

echo ""
echo "=========================================="
echo "  ✓ Build submitted successfully!"
echo "=========================================="
echo "  Check build status: eas build:list"
echo "=========================================="
