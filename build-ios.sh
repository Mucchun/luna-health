#!/bin/bash
# Luna Health — App Store build script
# Usage: VITE_API_URL=https://your-backend.fly.dev ./build-ios.sh

set -e
cd "$(dirname "$0")"

if [ -z "$VITE_API_URL" ]; then
  echo "⚠️  VITE_API_URL not set. The app will use localhost (dev only)."
  echo "   For App Store: VITE_API_URL=https://luna-health-api.fly.dev ./build-ios.sh"
fi

echo "→ Building frontend..."
cd frontend
VITE_API_URL="$VITE_API_URL" npm run build

echo "→ Syncing to iOS..."
npx cap sync ios

echo "→ Opening Xcode..."
npx cap open ios

echo ""
echo "✓ Ready! In Xcode:"
echo "  1. Select your Team under Signing & Capabilities"
echo "  2. Set version + build number"
echo "  3. Product → Archive → Distribute App → App Store Connect"
