#!/bin/bash
# ============================================
# Sliplly Submit Script
# ============================================
# Submits the latest production build to app stores.
#
# Usage:
#   ./scripts/submit.sh [platform]
#
# Examples:
#   ./scripts/submit.sh android
#   ./scripts/submit.sh ios
#   ./scripts/submit.sh all

set -e

PLATFORM=${1:-all}

echo "=========================================="
echo "  Sliplly App Store Submission"
echo "=========================================="
echo "  Platform: $PLATFORM"
echo "=========================================="

# Check EAS CLI
if ! command -v eas &> /dev/null; then
  echo "Error: EAS CLI not found"
  exit 1
fi

# Submit
echo ""
echo "→ Submitting to app store..."
if [[ "$PLATFORM" == "all" ]]; then
  eas submit --platform android --latest --non-interactive
  eas submit --platform ios --latest --non-interactive
else
  eas submit --platform "$PLATFORM" --latest --non-interactive
fi

echo ""
echo "=========================================="
echo "  ✓ Submitted successfully!"
echo "=========================================="
echo "  Android: https://play.google.com/console"
echo "  iOS: https://appstoreconnect.apple.com"
echo "=========================================="
