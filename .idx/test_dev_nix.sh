#!/bin/bash

set -e

DEV_NIX_FILE=".idx/dev.nix"

# Test for channel
if ! grep -q 'channel = "stable-24.05";' "$DEV_NIX_FILE"; then
  echo "Test failed: channel is not set to stable-24.05"
  exit 1
fi

# Test for packages
if ! grep -q 'pkgs.nodejs_20' "$DEV_NIX_FILE"; then
  echo "Test failed: pkgs.nodejs_20 is not in packages"
  exit 1
fi

if ! grep -q 'pkgs.nodePackages.npm' "$DEV_NIX_FILE"; then
    echo "Test failed: pkgs.nodePackages.npm is not in packages"
    exit 1
fi

# Test for extensions
if ! grep -q '"dbaeumer.vscode-eslint"' "$DEV_NIX_FILE"; then
  echo "Test failed: dbaeumer.vscode-eslint extension is missing"
  exit 1
fi

if ! grep -q '"esbenp.prettier-vscode"' "$DEV_NIX_FILE"; then
    echo "Test failed: esbenp.prettier-vscode extension is missing"
    exit 1
fi

if ! grep -q '"csstools.postcss"' "$DEV_NIX_FILE"; then
    echo "Test failed: csstools.postcss extension is missing"
    exit 1
fi

# Test for workspace commands
if ! grep -q 'npm-install = "npm install";' "$DEV_NIX_FILE"; then
  echo "Test failed: npm-install command is missing from onCreate"
  exit 1
fi

if ! grep -q 'dev-server = "npm run dev";' "$DEV_NIX_FILE"; then
    echo "Test failed: dev-server command is missing from onStart"
    exit 1
fi

# Test for previews command
if ! grep -q 'command = \["npm", "run", "dev", "--", "--port", "\$PORT"\];' "$DEV_NIX_FILE"; then
  echo "Test failed: preview command is incorrect"
  exit 1
fi

echo "All tests passed!"
