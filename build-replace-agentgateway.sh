#!/usr/bin/env bash
set -euo pipefail

# Prompt for sudo password immediately
sudo -v

# Build the UI.
yarn --cwd=ui build

# Make sure that the schemas are up to date.
make generate-schema

# Build and install binary
make build
sudo install -m 755 ./target/release/agentgateway /usr/local/bin/agentgateway

# Print installed version
agentgateway --version