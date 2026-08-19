#!/bin/bash

set -e

if [[ -n $(git status --porcelain) ]]; then
  echo "There are uncommitted changes. Please commit or stash them before deploying."
  exit 1
fi

ORIGINAL_BRANCH=$(git branch --show-current)

if [[ -z $ORIGINAL_BRANCH ]]; then
  echo "Deploying from a detached HEAD is not supported."
  exit 1
fi

npm run build

if [[ -n $(git status --porcelain) ]]; then
  echo "The build changed tracked files. Please commit the generated dist/ content before deploying."
  exit 1
fi

TEMP_DIR=$(mktemp --directory)
cp --recursive dist/. "$TEMP_DIR"

if git ls-remote --exit-code --heads origin gh-pages > /dev/null 2>&1; then
  git fetch origin gh-pages
  git switch --force-create gh-pages origin/gh-pages
elif git show-ref --verify --quiet refs/heads/gh-pages; then
  git switch gh-pages
else
  git switch --orphan gh-pages
fi

git rm --recursive --force .
cp --recursive "$TEMP_DIR"/. .
git add --all

if git diff --cached --quiet; then
  echo "No changes to deploy."
else
  git -c commit.gpgSign=false commit --no-verify --message="Deploy website"
  git push --set-upstream origin gh-pages
fi

git switch "$ORIGINAL_BRANCH"
rm --recursive --force "$TEMP_DIR"
