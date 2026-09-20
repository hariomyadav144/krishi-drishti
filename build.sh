#!/usr/bin/env bash
set -e
echo "Executing Fasal Drishti Build Script..."
npm install --production=false
if [ -d "backend" ]; then
  cd backend && npm install --production=false && cd ..
fi
echo "Build script completed successfully!"
