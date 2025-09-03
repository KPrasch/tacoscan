#!/bin/bash

# TACo green color
TACO_GREEN="rgb(160, 251, 37)"
TACO_GREEN_HEX="#a0fb25"
TACO_GREEN_RGBA="rgba(160, 251, 37"
TACO_GREEN_HOVER="#8fe01f"
TACO_GREEN_LIGHT="rgba(160, 251, 37, 0.04)"
TACO_GREEN_LIGHT2="rgba(160, 251, 37, 0.1)"

# Find and replace purple colors with TACo green
echo "Updating colors to TACo green..."

# Replace in all source files
find /Users/k/Git/tacoscan/src -type f \( -name "*.css" -o -name "*.jsx" -o -name "*.js" \) -exec sed -i '' \
  -e "s/#7850cd/${TACO_GREEN_HEX}/g" \
  -e "s/#7C47EE/${TACO_GREEN_HEX}/g" \
  -e "s/#6340b0/${TACO_GREEN_HOVER}/g" \
  -e "s/rgb(120, 80, 205)/${TACO_GREEN}/g" \
  -e "s/rgba(120, 80, 205, 0.04)/${TACO_GREEN_LIGHT}/g" \
  -e "s/rgba(120, 80, 205, 0.1)/${TACO_GREEN_LIGHT2}/g" \
  {} \;

echo "Color update complete!"