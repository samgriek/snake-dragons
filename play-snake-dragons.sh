#!/bin/bash
#
# Snake Dragons - One-click launcher
# Download this file, right-click > Properties > mark as executable, then double-click to play.
#

# If not running in a terminal, relaunch in one
if [ ! -t 0 ]; then
    for term in x-terminal-emulator gnome-terminal konsole xfce4-terminal mate-terminal xterm; do
        if command -v "$term" &>/dev/null; then
            if [ "$term" = "gnome-terminal" ]; then
                exec "$term" -- bash "$0"
            else
                exec "$term" -e bash "$0"
            fi
        fi
    done
    notify-send "Snake Dragons" "No terminal emulator found." 2>/dev/null
    exit 1
fi

REPO_URL="https://github.com/samgriek/snake-dragons.git"
INSTALL_DIR="$HOME/snake-dragons"
PORT=3000

echo "========================================="
echo "  Snake Dragons - Setup & Launch"
echo "========================================="
echo ""

# ---- Install missing system packages ----

PACKAGES_NEEDED=""

if ! command -v git &>/dev/null; then
    PACKAGES_NEEDED="git"
fi

if ! command -v node &>/dev/null || ! command -v npm &>/dev/null; then
    PACKAGES_NEEDED="$PACKAGES_NEEDED nodejs npm"
fi

if ! command -v curl &>/dev/null; then
    PACKAGES_NEEDED="$PACKAGES_NEEDED curl"
fi

if [ -n "$PACKAGES_NEEDED" ]; then
    echo "Installing required packages: $PACKAGES_NEEDED"
    echo "You may be prompted for your password."
    echo ""
    sudo apt-get update -qq
    sudo apt-get install -y -qq $PACKAGES_NEEDED

    if [ $? -ne 0 ]; then
        echo ""
        echo "Package installation failed. Please check the errors above."
        read -rp "Press Enter to close."
        exit 1
    fi
    echo ""
fi

# ---- Check Node.js version is recent enough (need 14+) ----

NODE_MAJOR=$(node -v 2>/dev/null | sed 's/v\([0-9]*\).*/\1/')
if [ -n "$NODE_MAJOR" ] && [ "$NODE_MAJOR" -lt 14 ]; then
    echo "Node.js version is too old ($(node -v)). Need v14 or higher."
    echo "Installing a newer version..."
    echo ""
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y -qq nodejs
    echo ""
fi

# ---- Clone or update the game ----

if [ -d "$INSTALL_DIR/.git" ]; then
    echo "Game folder found at $INSTALL_DIR"
    echo "Checking for updates..."
    cd "$INSTALL_DIR"
    git pull --ff-only 2>/dev/null || echo "Could not pull updates, using existing files."
else
    if [ -d "$INSTALL_DIR" ]; then
        echo "Removing incomplete install at $INSTALL_DIR..."
        rm -rf "$INSTALL_DIR"
    fi
    echo "Downloading the game..."
    git clone "$REPO_URL" "$INSTALL_DIR"
    cd "$INSTALL_DIR"
fi

echo ""

# ---- Install Node dependencies ----

if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
    echo "Installing game dependencies..."
    npm install --no-fund --no-audit 2>&1 | tail -1
    echo ""
fi

# ---- Find an open port ----

while command -v lsof &>/dev/null && lsof -i :"$PORT" &>/dev/null 2>&1; do
    PORT=$((PORT + 1))
done

# ---- Open browser after server starts ----

(sleep 2 && xdg-open "http://localhost:$PORT" 2>/dev/null) &

echo "Starting game on http://localhost:$PORT"
echo "Your browser will open automatically."
echo ""
echo "To stop the game, close this window or press Ctrl+C."
echo ""

npx serve . --listen "$PORT"
