#!/bin/bash
set -e
npm run build
VERSION=$(node -p "require('./package.json').version")

CHANGELOG_CONTENT=$(awk "/## \[${VERSION}\]/{flag=1;next}/## \[/{flag=0}flag" docs/CHANGELOG.md | sed '/^$/d')

if [ -z "$CHANGELOG_CONTENT" ]; then
  echo "Changelog for version ${VERSION} not found. Please ensure the changelog is updated."
  exit 1
fi
if [ -n "$(git status --porcelain)" ]; then
  git add .
  git commit -m "chore: release version ${VERSION}"
  git tag -a "v${VERSION}" -m "Release ${VERSION}" -m "${CHANGELOG_CONTENT}"
  git push origin main --tags
else
  echo "No changes to commit."
fi
npm publish --access public
echo "Version ${VERSION} successfully published."
