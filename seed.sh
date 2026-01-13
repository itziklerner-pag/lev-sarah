#!/bin/bash

# Seed script for initial admin invite
# This script creates the first admin user for the system

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

# Run the seed action via Convex
bunx convex run admin:seedAndInviteAdmin \
  --args "{\"phone\": \"$PHONE\", \"name\": \"$NAME\", \"relationship\": \"$RELATIONSHIP\"}"

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Seed admin invite created and sent!"
  echo ""
  echo "Next steps:"
  echo "  1. Check WhatsApp on $PHONE for the invite message"
  echo "  2. Click the link to join the system"
  echo "  3. After logging in, you'll be able to set yourself as admin"
  echo ""
else
  echo ""
  echo "❌ Failed to seed admin. Make sure Convex is running."
  echo ""
  exit 1
fi
