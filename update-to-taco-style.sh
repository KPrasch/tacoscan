#!/bin/bash

# TACo Style Guide Colors
LIME_GREEN="#96FF5E"
LIME_GREEN_RGB="rgb(150, 255, 94)"
LIME_GREEN_RGBA="rgba(150, 255, 94"
BLACK="#000000"
WHITE="#FFFFFF"
LIGHT_GRAY="#F4F4F4"
MEDIUM_GRAY="#909090"

# Old colors to replace
OLD_GREEN="#a0fb25"
OLD_GREEN_RGB="rgb(160, 251, 37)"
OLD_GREEN_RGBA="rgba(160, 251, 37"
OLD_GREEN_HOVER="#8fe01f"

echo "Updating colors to match TACo style guide..."

# Find and replace in all source files
find /Users/k/Git/tacoscan/src -type f \( -name "*.css" -o -name "*.jsx" -o -name "*.js" \) -exec sed -i '' \
  -e "s/${OLD_GREEN}/${LIME_GREEN}/g" \
  -e "s/${OLD_GREEN_RGB}/${LIME_GREEN_RGB}/g" \
  -e "s/${OLD_GREEN_RGBA}/${LIME_GREEN_RGBA}/g" \
  -e "s/${OLD_GREEN_HOVER}/${LIME_GREEN}/g" \
  {} \;

echo "Color update complete!"