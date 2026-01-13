#!/bin/bash

# Seed script for initial admin invite
# This script creates the first admin user and outputs the invite link

echo "🌱 Seeding initial admin for לב שרה..."

# Seed admin details
PHONE="+16502294226"
NAME="איציק לרנר"
RELATIONSHIP="בן"

echo ""
echo "Admin details:"
echo "  Name: $NAME"
echo "  Phone: $PHONE"
echo "  Relationship: $RELATIONSHIP"
echo ""

# Run the seed mutation via Convex
RESULT=$(bunx convex run admin:seedAdmin \
  "{\"phone\": \"$PHONE\", \"name\": \"$NAME\", \"relationship\": \"$RELATIONSHIP\"}" 2>&1)

if [ $? -eq 0 ]; then
  # Extract invite code from JSON result using sed
  INVITE_CODE=$(echo "$RESULT" | sed -n 's/.*"inviteCode"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p')
  IS_EXISTING=$(echo "$RESULT" | grep -q 'isExisting.*true' && echo "true")

  if [ -n "$INVITE_CODE" ]; then
    # Construct the invite URL
    BASE_URL="${SITE_URL:-https://levsarah.org}"
    INVITE_URL="${BASE_URL}/invite/${INVITE_CODE}"

    echo ""
    if [ -n "$IS_EXISTING" ]; then
      echo "ℹ️  Admin invite already exists"
    else
      echo "✅ Admin invite created!"
    fi
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "📋 Invite Link:"
    echo ""
    echo "   $INVITE_URL"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "Next steps:"
    echo "  1. Copy the link above"
    echo "  2. Open it in a browser to complete registration"
    echo "  3. After signing in, you'll be set as admin"
    echo ""

    # Try to copy to clipboard (works on macOS)
    if command -v pbcopy &> /dev/null; then
      echo -n "$INVITE_URL" | pbcopy
      echo "✅ Link copied to clipboard!"
    fi
  else
    echo "❌ Failed to extract invite code from result:"
    echo "$RESULT"
    exit 1
  fi
else
  echo ""
  echo "❌ Failed to seed admin. Make sure Convex is running."
  echo ""
  echo "Error: $RESULT"
  exit 1
fi
