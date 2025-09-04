#!/bin/bash

echo "🚀 GitHub Repository Setup Script"
echo "=================================="
echo ""

echo "1️⃣ First, login to GitHub CLI:"
echo "   gh auth login"
echo ""

echo "2️⃣ Create repository:"
echo "   gh repo create lfa-legacy-go --public --description 'LFA Legacy GO - Football Gaming Platform with Friend Requests'"
echo ""

echo "3️⃣ Push to GitHub:"
echo "   git remote add origin https://github.com/YOUR_USERNAME/lfa-legacy-go.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""

echo "✅ After GitHub setup, return to Claude Code for cloud deployment!"