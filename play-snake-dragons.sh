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
PORT=20031

echo "========================================="
echo "  Snake Dragons - Setup & Launch"
echo "========================================="
echo ""

# ---- Load nvm if available (not loaded by default in non-login shells) ----

if [ -s "$HOME/.nvm/nvm.sh" ]; then
    echo "Loading nvm..."
    source "$HOME/.nvm/nvm.sh"
fi

# ---- Install missing system packages ----

PACKAGES_NEEDED=""

if ! command -v git &>/dev/null; then
    PACKAGES_NEEDED="git"
fi

if ! command -v curl &>/dev/null; then
    PACKAGES_NEEDED="$PACKAGES_NEEDED curl"
fi

if [ -n "$PACKAGES_NEEDED" ]; then
    echo "The following packages need to be installed: $PACKAGES_NEEDED"
    echo "You may be prompted for your password."
    echo ""
    echo "[1/2] Updating package lists..."
    sudo apt-get update -y
    echo ""
    echo "[2/2] Installing $PACKAGES_NEEDED..."
    sudo apt-get install -y $PACKAGES_NEEDED

    if [ $? -ne 0 ]; then
        echo ""
        echo "Package installation failed. Please check the errors above."
        read -rp "Press Enter to close."
        exit 1
    fi
    echo ""
    echo "Packages installed successfully."
    echo ""
fi

# ---- Ensure Node.js 18+ is available ----

NODE_MAJOR=$(node -v 2>/dev/null | sed 's/v\([0-9]*\).*/\1/')

if [ -z "$NODE_MAJOR" ] || [ "$NODE_MAJOR" -lt 18 ]; then
    if [ -z "$NODE_MAJOR" ]; then
        echo "Node.js is not installed."
    else
        echo "Node.js version is too old ($(node -v)). Need v18 or higher."
    fi

    if command -v nvm &>/dev/null; then
        echo "Installing Node.js 20 via nvm..."
        nvm install 20
        nvm use 20
    else
        echo "Setting up Node.js 20 repository..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        echo "Installing Node.js 20..."
        sudo apt-get install -y nodejs
    fi

    echo "Node.js now at $(node -v)."
    echo ""
fi

# ---- Clone or update the game ----

if [ -d "$INSTALL_DIR/.git" ]; then
    echo "Game folder found at $INSTALL_DIR"
    echo "Checking for updates..."
    cd "$INSTALL_DIR"
    git pull --ff-only || echo "Could not pull updates, using existing files."
else
    if [ -d "$INSTALL_DIR" ]; then
        echo "Removing incomplete install at $INSTALL_DIR..."
        rm -rf "$INSTALL_DIR"
    fi
    echo "Downloading the game to $INSTALL_DIR..."
    git clone "$REPO_URL" "$INSTALL_DIR"
    cd "$INSTALL_DIR"
    echo "Download complete."
fi

echo ""

# ---- Install Node dependencies ----

if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
    echo "Installing game dependencies (this may take a minute)..."
    npm install --no-fund --no-audit
    echo ""
    echo "Dependencies installed."
    echo ""
fi

# ---- Check port is free ----

while command -v lsof &>/dev/null && lsof -i :"$PORT" &>/dev/null 2>&1; do
    PORT=$((PORT + 1))
done

# ---- Start server in background, open browser, then bring server to foreground ----

echo "Starting game on http://localhost:$PORT"
echo ""

npx serve . --listen "$PORT" &
SERVER_PID=$!

# Wait for server to be ready
echo "Waiting for server..."
for i in $(seq 1 15); do
    if curl -s -o /dev/null "http://localhost:$PORT" 2>/dev/null; then
        break
    fi
    sleep 1
done

echo "Opening browser..."
xdg-open "http://localhost:$PORT"
echo ""
echo "Game is running. To stop, close this window or press Ctrl+C."
echo ""

# Bring server to foreground so Ctrl+C stops it
wait $SERVER_PID
