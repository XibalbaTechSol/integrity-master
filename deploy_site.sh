#!/bin/bash
# ==============================================================================
# Script to deploy the personal-site frontend directly to GitHub Pages
# Since personal-site is now part of the INTEGRITY monorepo, this script
# creates a temporary Git instance to push the site to the live repository.
# ==============================================================================

set -e

echo "🚀 Deploying personal-site to GitHub Pages..."

# Navigate to the site directory
cd personal-site

# Initialize a temporary git repository
git init

# Add all files
git add .

# Commit changes
git commit -m "Deploy to GitHub Pages from INTEGRITY Monorepo"

# Force push to the XibalbaTechSol.github.io main branch
# Assuming SSH authentication is set up locally
git push -f git@github.com:XibalbaTechSol/XibalbaTechSol.github.io.git master:main

# Clean up the temporary git repository so it doesn't break the monorepo
rm -rf .git

echo "✅ Deployment complete! The live site has been updated."
