#!/bin/bash
set -e

# Compile TypeScript
echo "Compiling..."
npx tsc

# Create artifacts directory if it doesn't exist
mkdir -p dist

# Install production dependencies only in a temp folder to strip devDeps
echo "Installing production dependencies..."
mkdir -p .build
cp package.json package-lock.json .build/
cd .build
npm ci --only=production
cd ..

# Copy dependencies to dist
cp -r .build/node_modules dist/

# Zip handler (assuming one zip for now containing all, or individual zips)
# The CloudFormation code property expects a key. If we share code, one zip is fine.
# 03-application.yaml uses `LambdaZipKey` for all functions, implying a single shared artifact.

echo "Zipping artifact..."
cd dist
zip -r ../backend.zip .
cd ..

echo "Build complete: backend.zip"
