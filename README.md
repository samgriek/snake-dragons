# Snake Dragons

A browser-based dragon combat game. You control a dragon, fly around an arena, and shoot fireballs at waves of enemy dragons.

## How to Play (Linux - Ubuntu / Linux Mint)

1. **Download the launcher script:** [play-snake-dragons.sh](https://raw.githubusercontent.com/samgriek/snake-dragons/main/play-snake-dragons.sh)

2. **Make it executable:** Right-click the downloaded file, go to **Properties**, find the **Permissions** tab, and check **"Allow executing file as program"**.

3. **Double-click it.**

That's it. The script installs everything it needs (git, Node.js), downloads the game to `~/snake-dragons`, starts the server, and opens your browser. It will ask for your password to install system packages if needed.

### Stopping the Game

Close the terminal window, or press **Ctrl+C** in it.

### Running It Again

Just double-click the script again. It skips what's already installed, pulls any updates, and launches.

## Controls

Your hands stay on the home row:

| Key | Action |
|-----|--------|
| **I** | Fly up |
| **K** | Fly down |
| **J** | Fly left |
| **L** | Fly right |
| **A** | Rotate left |
| **S** | Rotate right |
| **F** | Shoot fireball |
| **D** | Shoot exploding fireball (area damage) |
| **Space** | Start / restart |
| **Esc** | Pause / unpause |

## Tips

- Rotate with **A**/**S** to aim, then fire with **F** or **D**.
- Exploding fireballs (**D**) are slower but hit multiple enemies.
- Keep moving -- enemy dragons get tougher each wave.

## License

MIT
