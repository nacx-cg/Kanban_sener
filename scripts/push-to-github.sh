#!/bin/bash
# Push to GitHub - run after creating repo at https://github.com/new
# Usage: ./scripts/push-to-github.sh https://github.com/YOUR_USERNAME/Kanban_sener.git

set -e
REPO_URL="${1:-}"

if [ -z "$REPO_URL" ]; then
  echo "Usage: ./scripts/push-to-github.sh https://github.com/YOUR_USERNAME/Kanban_sener.git"
  echo ""
  echo "1. Create a new repo at https://github.com/new"
  echo "2. Run this script with the repo URL"
  exit 1
fi

git remote add origin "$REPO_URL" 2>/dev/null || git remote set-url origin "$REPO_URL"
git branch -M main
git push -u origin main
echo "Pushed to $REPO_URL"
