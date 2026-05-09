#!/bin/bash
# Tplayer v2 — Run locally (test version)

set -e

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}"
echo "  ████████╗██████╗ ██╗      █████╗ ██╗   ██╗███████╗██████╗ "
echo "  ╚══██╔══╝██╔══██╗██║     ██╔══██╗╚██╗ ██╔╝██╔════╝██╔══██╗"
echo "     ██║   ██████╔╝██║     ███████║ ╚████╔╝ █████╗  ██████╔╝"
echo "     ██║   ██╔═══╝ ██║     ██╔══██║  ╚██╔╝  ██╔══╝  ██╔══██╗"
echo "     ██║   ██║     ███████╗██║  ██║   ██║   ███████╗██║  ██║"
echo "     ╚═╝   ╚═╝     ╚══════╝╚═╝  ╚═╝   ╚═╝   ╚══════╝╚═╝  ╚═╝"
echo -e "${NC}"
echo -e "  ${YELLOW}A beautiful Spotify-like music player for Linux${NC}"
echo -e "  ${YELLOW}LOCAL TEST VERSION (v2)${NC}"
echo ""

# Check prerequisites
check() {
  if ! command -v $1 &> /dev/null; then
    # Also check common alternate locations
    local found=""
    for loc in "$HOME/.local/bin/$1" "/usr/local/bin/$1" "/usr/bin/$1"; do
      if [ -f "$loc" ]; then
        found="$loc"
        break
      fi
    done
    if [ -n "$found" ]; then
      echo -e "  ${GREEN}✓${NC}  $2 (at $found)"
      return 0
    fi
    echo -e "  ${RED}✗${NC}  $2 not found — $3"
    return 1
  fi
  echo -e "  ${GREEN}✓${NC}  $2"
  return 0
}

echo -e "  ${YELLOW}Checking prerequisites...${NC}"
MISSING=0

check "node"   "Node.js"  "install from nodejs.org"  || MISSING=1
check "npm"    "npm"      "included with Node.js"    || MISSING=1
check "ffmpeg" "FFmpeg"   "sudo apt install ffmpeg"  || MISSING=1
check "yt-dlp" "yt-dlp"   "pip install yt-dlp"       || MISSING=1

if [ $MISSING -eq 1 ]; then
  echo ""
  echo -e "  ${RED}Missing dependencies — install the items above first.${NC}"
  exit 1
fi

echo ""

# Node version check
NODE_VER=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VER" -lt 18 ]; then
  echo -e "  ${RED}✗${NC}  Node.js 18+ required (you have $(node -v))"
  exit 1
fi
echo -e "  ${GREEN}✓${NC}  Node.js $(node -v)"

# Install deps if needed
if [ ! -d "node_modules" ]; then
  echo ""
  echo -e "  ${YELLOW}Installing dependencies...${NC}"
  npm install
fi

echo ""

# Build
echo -e "  ${YELLOW}Building v2...${NC}"
npm run build

# Check build output
if [ ! -f "out/main/index.js" ] || [ ! -f "out/renderer/index.html" ]; then
  echo -e "  ${RED}✗${NC}  Build failed — output files missing"
  exit 1
fi
echo -e "  ${GREEN}✓${NC}  Build successful"
echo ""

# Launch
echo -e "  ${GREEN}Starting Tplayer v2 (local test)...${NC}"
echo ""
echo -e "  ${YELLOW}Press Ctrl+C to quit${NC}"
echo ""
npm run dev
