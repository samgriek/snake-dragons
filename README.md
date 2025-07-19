# 🐉 Snake Dragons

A fast-paced browser-based 2D dragon combat game with home row keyboard controls. Battle through waves of enemy dragons using directional fireballs in strategic arena combat.

## 🎮 Game Features

- **Home Row Controls**: Play using only I/K/J/L movement keys with A/S rotation
- **Dragon Combat**: Directional shooting with regular and exploding projectiles  
- **Physics-Based**: Powered by Matter.js for realistic collision and movement
- **Progressive Difficulty**: Battle through enemy waves leading to boss encounters
- **Strategic Arena**: Use obstacles for cover and tactical gameplay
- **Power-Up System**: Collect weapon upgrades and health items

## 🚀 Quick Start

### Prerequisites

- Node.js 14.0.0 or higher
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd snake_dragons
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   - Navigate to: `http://localhost:3000`
   - The game will load automatically

## 🎯 Controls

### Movement
- **I** - Move Up
- **K** - Move Down  
- **J** - Move Left
- **L** - Move Right

### Combat
- **A** - Rotate Counterclockwise
- **S** - Rotate Clockwise
- **F** - Fire Regular Fireball
- **D** - Fire Exploding Projectile

### Game Navigation
- **SPACE** - Start Game (from menu)
- **ESC** - Pause/Unpause

## 🏗️ Development

### Project Structure

```
snake_dragons/
├── src/                    # Source code
│   ├── entities/          # Game entities (Dragon, Projectile, etc.)
│   ├── systems/           # Game systems (Physics, Input, etc.)
│   ├── arena/             # Arena and environment
│   ├── config/            # Game configuration
│   └── utils/             # Utility functions
├── assets/                # Game assets
│   └── sprites/           # Sprite images
├── tasks/                 # Project documentation
├── index.html             # Main HTML file
└── package.json           # Dependencies and scripts
```

### Available Scripts

- `npm run start` - Start production server
- `npm run dev` - Start development server with live reload
- `npm test` - Run tests (when implemented)

### Development Workflow

1. **Run the development server**: `npm run dev`
2. **Open browser**: Navigate to `http://localhost:3000`
3. **Make changes**: Edit files in `src/` directory
4. **Refresh browser**: Changes require manual refresh
5. **Check console**: Monitor browser console for debug info

### Current Implementation Status

✅ **Completed:**
- Project setup and structure
- Basic game loop with requestAnimationFrame
- State management system (menu, playing, boss, paused, gameover)
- Canvas rendering foundation
- Matter.js physics integration
- Basic input handling
- Development environment

🚧 **In Progress:**
- Dragon entity system
- Combat mechanics
- Physics implementation
- Asset loading system

📋 **Planned:**
- AI enemy behavior
- Power-up system
- Boss battle mechanics
- Visual effects and polish

## 🛠️ Technical Stack

- **Frontend**: HTML5 Canvas, Vanilla JavaScript
- **Physics**: Matter.js 0.19.0
- **Development**: Node.js, serve static server
- **Assets**: 2D sprites with 3D appearance

## 🎨 Asset Requirements

### Dragon Sprites
- 4-6 frames for smooth flying animation
- 2D images with 3D depth and shadows
- Facing direction variants for rotation

### Projectile Sprites  
- 2-3 frames for fire effects
- Regular fireball and exploding variants
- Impact/explosion effects

### Arena Sprites
- Obstacle sprites for tactical cover
- Background environment textures
- Power-up and health item sprites

## 🐛 Debug Features

The game includes debug information displayed in the bottom-left corner:

- **FPS**: Current frame rate
- **State**: Current game state
- **Delta**: Frame time in seconds

## 🔧 Configuration

Game settings can be modified in `src/config/GameConfig.js`:

- Control key mappings
- Physics parameters  
- Spawn rates and timing
- Arena dimensions
- Difficulty scaling

## 📖 Game Design Document

For detailed game requirements and implementation plans, see:

- `tasks/prd-snake-dragons.md` - Product Requirements Document
- `tasks/tasks-prd-snake-dragons.md` - Development Task List

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes following the existing code style
4. Test your changes locally
5. Commit with descriptive messages
6. Push and create a Pull Request

## 📝 License

MIT License - see LICENSE file for details

## 🏆 Game Objective

Battle through waves of AI-controlled dragons in fast-paced aerial combat. Use strategic movement, precise aiming, and tactical use of arena obstacles to survive increasingly difficult encounters. Master the home row controls to achieve maximum mobility and combat effectiveness.

---

**Happy Dragon Hunting! 🐉🔥** 