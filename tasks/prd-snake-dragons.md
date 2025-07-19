# Product Requirements Document: Snake Dragons

## Introduction/Overview

Snake Dragons is a fast-paced, browser-based 2D action game where players control a dragon in aerial combat against AI-controlled enemy dragons. The game features directional shooting mechanics, progressive difficulty, and a climactic boss battle. Built specifically for keyboard home row controls, the game emphasizes quick reflexes and strategic movement through obstacle-filled arenas.

The core problem this game solves is providing an accessible, skill-based action game that can be played entirely with home row keys, making it perfect for quick gaming sessions while maintaining engaging combat mechanics and progression.

## Goals

1. **Primary Goal:** Create a playable MVP of Snake Dragons that delivers 2-3 minutes of engaging dragon combat gameplay
2. **Accessibility Goal:** Ensure the game is fully playable using only home row keyboard keys
3. **Technical Goal:** Build a browser-based game using HTML5 and JavaScript that runs smoothly across modern browsers
4. **Engagement Goal:** Design progressive difficulty that keeps players engaged through multiple enemy encounters leading to a boss fight
5. **Visual Goal:** Create a 2D game with 3D-looking elements using depth, shadows, and animated sprites

## User Stories

**As a player, I want to:**
- Control my dragon using only home row keys so I can play comfortably without moving my hands
- Battle through increasingly difficult AI dragons so I feel a sense of progression and challenge
- Shoot directional fireballs and exploding projectiles so I have tactical options in combat
- Rotate my dragon 360 degrees so I can aim in any direction and create strategic positioning
- Collect power-ups and upgrades so my dragon becomes stronger over time
- Use arena obstacles as cover so battles feel tactical and dynamic
- Face a challenging boss with special abilities so there's a satisfying climax to each session
- See my dragon and enemies with 3D-looking graphics so the game feels visually appealing
- Experience smooth physics-based movement and projectiles so combat feels responsive and realistic

**As a developer, I want to:**
- Build the game with web technologies so it's easily accessible and deployable
- Create a modular system so new dragon types and abilities can be added post-MVP
- Implement clear game states so the experience flows smoothly from combat to combat

## Functional Requirements

### Core Controls
1. **Movement Controls:** Dragon moves using I (up), K (down), J (left), L (right) keys
2. **Rotation Controls:** Dragon rotates counterclockwise with A key, clockwise with S key (360-degree rotation)
3. **Combat Controls:** F key fires regular fireballs, D key fires exploding projectiles
4. **All controls must be responsive and allow for simultaneous key presses** (e.g., moving while rotating and shooting)

### Combat System
5. **Directional Shooting:** Projectiles fire from dragon's mouth in the direction the dragon is facing
6. **Health System:** Dragons have hit points - basic dragons take 3 hits from regular fireballs to defeat
7. **Damage Types:** Regular fireballs do standard damage, exploding projectiles do enhanced damage
8. **Player Feedback:** Health bars visible for both player and enemy dragons
9. **Hit Detection:** Accurate collision detection between projectiles and dragons

### Game Progression
10. **Enemy Waves:** Player battles through multiple AI dragons of increasing difficulty
11. **Progressive Difficulty:** Each subsequent dragon is stronger/faster/smarter than the previous
12. **Boss Battle:** After approximately 2 minutes of combat, player faces a boss with special abilities
13. **Boss Mechanics:** Boss has unique attack patterns and abilities that player must learn to counter
14. **Session Length:** Total gameplay session of 2-3 minutes (2 min to boss + 30+ seconds boss fight)

### Power-up System
15. **Collectible Items:** Power-ups spawn in arena after enemy defeats (occasional drops)
16. **Weapon Upgrades:** Some power-ups enhance fireball damage/speed/effect
17. **Health Items:** Med-kit style power-ups restore player hit points
18. **Visual Indicators:** Power-ups must be clearly distinguishable and attractive to collect

### Arena Design
19. **Obstacle Placement:** Arena contains strategic obstacles for cover and tactical gameplay
20. **Free Movement:** Dragons can move anywhere within arena boundaries
21. **Line of Sight:** Obstacles block projectiles but not movement
22. **Chase Scenarios:** Arena layout enables interesting pursuit and evasion gameplay

### Visual Requirements
23. **2D with 3D Appearance:** Game uses 2D sprites with depth, shadows, and 3D-looking design
24. **Animation System:** Multiple sprites per character for animation effects
25. **Browser Compatibility:** Game runs in modern web browsers using HTML5 Canvas
26. **Responsive Graphics:** Smooth rendering at 60fps target

### Technical Requirements
27. **HTML5 Canvas:** Primary rendering technology for game graphics
28. **JavaScript Physics:** Basic physics system for projectile trajectories and collision
29. **Game Loop:** Consistent frame rate with proper game state management
30. **Asset Loading:** Efficient loading and management of sprite images and animations

## Non-Goals (Out of Scope for MVP)

- **Multiplayer functionality** (local or online)
- **Multiple arena environments** (single arena for MVP)
- **Multiple dragon types for player** (single player dragon design)
- **Sound effects or music** (visual-focused MVP)
- **Persistent progression between sessions** (each session is independent)
- **Complex game engines** (Unity, Godot, etc.)
- **Mobile touch controls** (keyboard-only for MVP)
- **Save/load functionality** (session-based gameplay)
- **Multiple weapon types beyond the two specified** (regular and exploding fireballs only)

## Design Considerations

### Visual Style
- **2D sprites with 3D appearance:** Use depth, shadows, and perspective to create dimensional look
- **AI-generated assets:** Sprites will be created using AI image generation tools
- **Animation approach:** Multiple sprite frames for smooth animation sequences
- **Color scheme:** Dragon-appropriate colors with clear contrast for gameplay elements

### User Interface
- **Minimal HUD:** Health bars, current power-up indicators
- **Arena boundaries:** Clear visual indicators of playable area
- **Power-up highlighting:** Visual cues to make collectibles obvious
- **Damage feedback:** Visual indicators when dragons take damage

### Control Scheme Rationale
- **Home row focus:** All controls accessible without hand movement
- **Logical mapping:** Movement keys (I/K/J/L) form intuitive directional pattern
- **Rotation keys:** A/S placed for easy access while maintaining movement
- **Combat keys:** F/D positioned for rapid firing while maneuvering

## Technical Considerations

### Technology Stack
- **Frontend:** HTML5 Canvas for rendering
- **Logic:** Vanilla JavaScript for game mechanics
- **Physics:** Custom JavaScript physics for projectile trajectories and basic collision
- **Animation:** Sprite-based animation system
- **Performance:** Target 60fps on modern browsers

### Architecture Approach
- **Game Loop:** RequestAnimationFrame-based game loop
- **Entity System:** Simple object-oriented approach for dragons, projectiles, power-ups
- **State Management:** Clear game states (menu, gameplay, boss fight, game over)
- **Collision Detection:** AABB (Axis-Aligned Bounding Box) collision for performance

### Browser Compatibility
- **Target:** Modern browsers with HTML5 Canvas support
- **Fallbacks:** Graceful degradation for older browsers
- **Performance:** Optimized for desktop browser gaming

## Success Metrics

### Engagement Metrics
- **Session Completion Rate:** 80%+ of players complete at least one full session (reach boss)
- **Replay Rate:** 60%+ of players start a second session immediately after completion
- **Average Session Time:** 2-3 minutes as designed

### Technical Metrics
- **Performance:** Maintain 60fps on target browsers
- **Load Time:** Game loads and becomes playable within 3 seconds
- **Crash Rate:** Less than 1% of sessions experience technical failures

### Gameplay Metrics
- **Control Responsiveness:** Input lag under 16ms for smooth control feel
- **Boss Reach Rate:** 70%+ of players reach the boss battle
- **Power-up Collection:** Average of 2-3 power-ups collected per session

## Open Questions

1. **Boss Abilities:** What specific special abilities should the boss have? (e.g., rapid fire, shield, teleportation, area attacks).  All of this eventually but for now, let's just do shield and rapid fire or laser fire.
2. **Arena Size:** What are the optimal arena dimensions for 2-3 minute gameplay sessions?  this shoudl be considered relative to the dragon size but roughly 200 dragons wide and 200 dragons high.  I suppose you can assume a standard size for the dragon so the visiblity will be good by default but a zoom feature should be a future feature.
3. **Power-up Spawn Rate:** How frequently should power-ups appear to maintain engagement without making the game too easy? every 5 kills.
4. **AI Difficulty Scaling:** What specific parameters should increase with each enemy dragon? (speed, health, accuracy, fire rate)  For now, let's keep one level of dragon enemy and one boss implementation.
5. **Visual Polish Priority:** Which visual elements are most critical for the MVP vs. nice-to-have improvements? physics should be amazing and fun. The other elements are to be improved later.
6. **Performance Targets:** What is the minimum acceptable frame rate for different browser/device combinations? 25fps
7. **Asset Requirements:** How many sprite frames are needed for smooth dragon animation?  search the web @web because this game has a lot staked on it and it needs to work and look really good.

---

**Document Version:** 1.0  
**Last Updated:** Initial Creation  
**Next Review:** After clarification of open questions 