#!/bin/bash
set -e

# Run the build script
npm run build

# Get the version from package.json
VERSION=$(node -p "require('./package.json').version")

# Get the changelog content
CHANGELOG_CONTENT=$(cat docs/CHANGELOG.md)

# Check for changes in the working directory
if [ -n "$(git status --porcelain)" ]; then
  # There are changes to commit
  git add .
  git commit -m "chore: release version ${VERSION}"
  
  # Tag the commit with the new version
  git tag -a "v${VERSION}" -m "Release ${VERSION}: ${CHANGELOG_CONTENT}"
  
  # Push the commit and the tag
  git push origin main --tags
else
  echo "No changes to commit."
fi

# Publish the package
npm publish --access public
