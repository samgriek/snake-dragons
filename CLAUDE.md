# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Snake Dragons is a browser-based 2D dragon combat game using HTML5 Canvas and vanilla JavaScript with Matter.js physics. Players use home row keyboard controls (I/K/J/L movement, A/S rotation, F/D shooting) to battle through waves of AI enemy dragons.

## Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server (npx serve . --single) at http://localhost:3000
npm run start        # Start production server (npx serve .)
```

No build step, test framework, or linter is configured. The game runs directly in the browser via script tags in index.html.

## Architecture

`index.html` loads all `src/` modules via `<script>` tags (no bundler) and bootstraps the game with `new SnakeDragonsGame()`. Script load order matters - systems load before entities, entities before game.js.

### System Architecture (src/)

**Entry point**: `src/game.js` - `SnakeDragonsGame` class orchestrates everything. Uses fixed-timestep physics (1/60s) with variable-rate rendering. Exposed as `window.game`.

**Entities** (`src/entities/`):
- `Dragon.js` - Base class for player and enemy dragons. Handles position, rotation, health, physics body integration, combat (shooting), and rendering. Types: `player`, `enemy`, `boss`.
- `Projectile.js` - Fireball/exploding projectile with physics body, lifetime, trail rendering, and collision handling. Types: `normal`, `exploding`.

**Systems** (`src/systems/`):
- `PhysicsEngine.js` - Matter.js wrapper. Zero-gravity world, arena boundaries, body registry with collision categories (dragon, projectile, obstacle, boundary, powerup).
- `Renderer.js` - Canvas rendering with viewport/camera system, coordinate transforms (world/screen space), frustum culling, high-DPI support, layer-based rendering.
- `GameStateManager.js` - State machine with validated transitions. States: `loading`, `menu`, `playing`, `boss`, `paused`, `gameover`. Event system for state change listeners.
- `AIManager.js` - Enemy dragon AI with behavior patterns (aggressive, defensive, evasive). Handles targeting, movement, shooting, and wave spawning.
- `InputManager.js` - Maps keyboard codes to game actions. Home row controls.

### Key Patterns

- All classes are attached to `window` (e.g., `window.Dragon = Dragon`) since there's no module bundler - scripts are loaded via `<script>` tags in index.html.
- Physics uses Matter.js collision categories as bitmasks for filtering (e.g., `0x0001` for dragons, `0x0002` for projectiles).
- Game loop: fixed timestep accumulator pattern - physics runs at 1/60s, rendering runs at display refresh rate.
- Entities are initialized in two steps: constructor, then `init(game, physicsEngine, renderer)` to wire up game systems.
- Custom events dispatched on `window` for physics collisions (`physicsCollisionStart`).

## Game Controls

- Movement: I (up), K (down), J (left), L (right)
- Rotation: A (counterclockwise), S (clockwise)
- Combat: F (regular fireball), D (exploding projectile)
- Navigation: SPACE (start/restart), ESC (pause/unpause)

## Task Tracking

Development tasks are tracked in `tasks/tasks-prd-snake-dragons.md`. The PRD is at `tasks/prd-snake-dragons.md`. Update the task list when completing work.

## Guidelines from Cursor Rules

- Prefer simple solutions; avoid duplication by checking for existing similar code.
- Keep files under 200-300 lines; refactor if they exceed this.
- Do not touch code unrelated to the current task.
- Do not change working architecture/patterns unless specifically instructed.
- Consider broader codebase impact before implementing changes.
- Never overwrite .env files without asking first.
- Never mock data outside of tests.
