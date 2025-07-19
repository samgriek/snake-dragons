/**
 * Snake Dragons - Main Game Entry Point
 * A fast-paced 2D dragon combat game with home row keyboard controls
 */

class SnakeDragonsGame {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.physicsEngine = null;
        this.renderer = null;
        this.stateManager = null;
        this.isRunning = false;
        
        // Game loop timing
        this.lastFrameTime = 0;
        this.deltaTime = 0;
        this.frameRate = 0;
        this.frameCount = 0;
        this.frameRateBuffer = [];
        this.frameRateBufferSize = 60; // Track last 60 frames for smooth FPS display
        
        // Performance monitoring
        this.targetFPS = 60;
        this.maxDeltaTime = 1/15; // Cap delta time to prevent large jumps (15 FPS minimum)
        this.accumulatedTime = 0;
        this.fixedTimeStep = 1/60; // Fixed physics timestep for consistency
        
        // Initialize game
        this.init();
    }
    
    /**
     * Initialize the game
     */
    init() {
        console.log('🐉 Initializing Snake Dragons...');
        
        // Get canvas and context
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        if (!this.canvas || !this.ctx) {
            console.error('❌ Failed to get canvas or context');
            return;
        }
        
        // Set up canvas properties
        this.canvas.width = 800;
        this.canvas.height = 600;
        
        // Initialize physics engine
        this.physicsEngine = new PhysicsEngine(this.canvas);
        if (!this.physicsEngine.engine) {
            console.error('❌ Failed to initialize physics engine');
            return;
        }
        
        // Initialize renderer
        this.renderer = new Renderer(this.canvas, {
            showDebugInfo: true // Enable debug info for development
        });
        
        // Initialize state manager
        this.stateManager = new GameStateManager(this);
        
        // Add state change listener for dragon creation
        this.stateManager.addEventListener('statechange', (event) => {
            this.onStateChange(event);
        });
        
        console.log('✅ Canvas initialized:', this.canvas.width + 'x' + this.canvas.height);
        console.log('✅ Physics engine ready');
        console.log('✅ Renderer ready');
        console.log('✅ State manager ready');
        
        // Hide loading text
        const loadingText = document.getElementById('loadingText');
        if (loadingText) {
            loadingText.style.display = 'none';
        }
        
        // Game entities
        this.dragons = [];
        this.playerDragon = null;
        
        // Transition to menu state
        this.stateManager.transitionTo(this.stateManager.STATES.MENU, 'initialization_complete');
        
        // Start the game loop
        this.start();
    }
    
    /**
     * Start the game loop
     */
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.lastFrameTime = performance.now();
        this.accumulatedTime = 0; // Reset accumulated time
        
        console.log('🚀 Game loop started with requestAnimationFrame');
        console.log(`🎯 Target FPS: ${this.targetFPS}, Fixed timestep: ${this.fixedTimeStep}s`);
        
        // Set up visibility change handling
        this.setupVisibilityHandling();
        
        // Start the main game loop
        this.gameLoop();
    }
    
    /**
     * Set up page visibility handling to pause game when tab is hidden
     */
    setupVisibilityHandling() {
        document.addEventListener('visibilitychange', () => {
            if (!this.stateManager) return;
            
            const currentState = this.stateManager.getCurrentState();
            
            if (document.hidden) {
                // Tab is hidden, pause the game if playing
                if (currentState === this.stateManager.STATES.PLAYING || 
                    currentState === this.stateManager.STATES.BOSS) {
                    this.lastVisibleState = currentState;
                    this.stateManager.pauseGame();
                    console.log('⏸️ Game auto-paused (tab hidden)');
                }
            } else {
                // Tab is visible again, resume if was auto-paused
                if (currentState === this.stateManager.STATES.PAUSED && this.lastVisibleState) {
                    this.stateManager.resumeGame();
                    this.lastVisibleState = null;
                    // Reset frame timing to prevent large delta
                    this.lastFrameTime = performance.now();
                    this.accumulatedTime = 0;
                    console.log('▶️ Game auto-resumed (tab visible)');
                }
            }
        });
    }
    
    /**
     * Stop the game loop
     */
    stop() {
        this.isRunning = false;
        
        // Clean up dragons
        this.cleanupDragons();
        
        // Clean up physics engine
        if (this.physicsEngine) {
            this.physicsEngine.destroy();
            this.physicsEngine = null;
        }
        
        // Clean up renderer
        if (this.renderer) {
            this.renderer.destroy();
            this.renderer = null;
        }
        
        // Clean up state manager
        if (this.stateManager) {
            this.stateManager.destroy();
            this.stateManager = null;
        }
        
        console.log('⏹️ Game loop stopped');
    }
    
    /**
     * Main game loop using requestAnimationFrame
     * Implements fixed timestep physics with variable rendering for smooth gameplay
     */
    gameLoop() {
        if (!this.isRunning) return;
        
        const currentTime = performance.now();
        this.deltaTime = Math.min((currentTime - this.lastFrameTime) / 1000, this.maxDeltaTime);
        this.lastFrameTime = currentTime;
        
        // Update frame rate calculation with smoothing buffer
        this.updateFrameRate();
        
        // Accumulate time for fixed timestep physics
        this.accumulatedTime += this.deltaTime;
        
        // Fixed timestep updates for consistent physics
        let updateSteps = 0;
        while (this.accumulatedTime >= this.fixedTimeStep && updateSteps < 5) {
            this.update(this.fixedTimeStep);
            this.accumulatedTime -= this.fixedTimeStep;
            updateSteps++;
        }
        
        // If we had too many steps, reset accumulated time to prevent spiral of death
        if (updateSteps >= 5) {
            this.accumulatedTime = 0;
            console.warn('⚠️ Game loop falling behind, resetting accumulated time');
        }
        
        // Always render at display refresh rate for smooth visuals
        this.render();
        
        // Continue the loop
        requestAnimationFrame(() => this.gameLoop());
    }
    
    /**
     * Update frame rate calculation with smoothing
     */
    updateFrameRate() {
        this.frameCount++;
        
        // Calculate instantaneous FPS
        const instantFPS = 1 / this.deltaTime;
        
        // Add to rolling buffer
        this.frameRateBuffer.push(instantFPS);
        if (this.frameRateBuffer.length > this.frameRateBufferSize) {
            this.frameRateBuffer.shift();
        }
        
        // Calculate smoothed frame rate every 30 frames
        if (this.frameCount % 30 === 0) {
            const sum = this.frameRateBuffer.reduce((a, b) => a + b, 0);
            this.frameRate = Math.round(sum / this.frameRateBuffer.length);
        }
    }
    
    /**
     * Update game logic with fixed timestep
     * @param {number} fixedDeltaTime - Fixed timestep in seconds (1/60)
     */
    update(fixedDeltaTime) {
        const currentState = this.stateManager.getCurrentState();
        
        // Update physics simulation (runs in all states except paused)
        if (currentState !== this.stateManager.STATES.PAUSED && this.physicsEngine) {
            this.physicsEngine.update(fixedDeltaTime);
        }
        
        // Update camera system (runs in all states except paused)
        if (currentState !== this.stateManager.STATES.PAUSED && this.renderer) {
            this.renderer.updateCamera(fixedDeltaTime);
        }
        
        // Update state manager (handles state-specific logic)
        if (this.stateManager) {
            this.stateManager.update(fixedDeltaTime);
        }
        
        // Legacy update methods for backward compatibility
        // TODO: Move this logic into GameStateManager
        switch (currentState) {
            case this.stateManager.STATES.MENU:
                this.updateMenu(fixedDeltaTime);
                break;
            case this.stateManager.STATES.PLAYING:
                this.updateGameplay(fixedDeltaTime);
                break;
            case this.stateManager.STATES.BOSS:
                this.updateBossMode(fixedDeltaTime);
                break;
            case this.stateManager.STATES.PAUSED:
                // No updates during pause
                break;
            case this.stateManager.STATES.GAMEOVER:
                this.updateGameOver(fixedDeltaTime);
                break;
        }
    }
    
    /**
     * Render the game using the Renderer system
     */
    render() {
        if (!this.renderer || !this.stateManager) return;
        
        const currentState = this.stateManager.getCurrentState();
        
        // Begin frame rendering
        this.renderer.beginFrame();
        
        switch (currentState) {
            case this.stateManager.STATES.MENU:
                this.renderMenu();
                break;
            case this.stateManager.STATES.PLAYING:
                this.renderGameplay();
                break;
            case this.stateManager.STATES.BOSS:
                this.renderBossMode();
                break;
            case this.stateManager.STATES.PAUSED:
                this.renderPaused();
                break;
            case this.stateManager.STATES.GAMEOVER:
                this.renderGameOver();
                break;
        }
        
        // End frame rendering (includes debug info if enabled)
        this.renderer.endFrame();
        
        // Render additional debug info
        this.renderDebugInfo();
    }
    
    /**
     * Update menu state
     */
    updateMenu(deltaTime) {
        // TODO: Implement menu logic
    }
    
    /**
     * Update gameplay state
     */
    updateGameplay(deltaTime) {
        // Update dragons
        this.updateDragons(deltaTime);
        
        // TODO: Implement other gameplay logic (projectiles, enemies, etc.)
    }
    
    /**
     * Update boss mode state
     */
    updateBossMode(deltaTime) {
        // Update dragons (including boss)
        this.updateDragons(deltaTime);
        
        // TODO: Implement boss mode logic
    }
    
    /**
     * Update game over state
     */
    updateGameOver(deltaTime) {
        // TODO: Implement game over logic
    }
    
    /**
     * Create test dragon for development
     */
    createTestDragon() {
        // Create player dragon
        this.playerDragon = new Dragon({
            type: 'player',
            x: 400,
            y: 300,
            maxHealth: 100,
            color: '#4a90e2',
            debug: true
        });
        
        // Initialize dragon with game systems
        this.playerDragon.init(this, this.physicsEngine, this.renderer);
        this.dragons.push(this.playerDragon);
        
        // Set camera to follow player
        if (this.renderer) {
            this.renderer.setCameraTarget(this.playerDragon.position);
        }
        
        console.log('🐉 Test dragon created');
    }
    
    /**
     * Update all dragons
     */
    updateDragons(deltaTime) {
        for (const dragon of this.dragons) {
            if (dragon.isAlive) {
                dragon.update(deltaTime);
            }
        }
        
        // Clean up dead dragons
        this.dragons = this.dragons.filter(dragon => dragon.isAlive);
    }
    
    /**
     * Render all dragons
     */
    renderDragons() {
        for (const dragon of this.dragons) {
            if (dragon.isAlive) {
                dragon.render(this.renderer);
            }
        }
    }
    
    /**
     * Handle dragon death
     */
    onDragonDeath(dragon) {
        console.log(`💀 Dragon died: ${dragon.id} (${dragon.type})`);
        
        if (dragon.isPlayer) {
            // Player died - trigger game over
            console.log('💀 Player dragon died - game over');
            this.stateManager.gameOver();
        } else {
            // Enemy died - update score
            const playingData = this.stateManager.getStateData();
            this.stateManager.updateStateData({
                kills: (playingData.kills || 0) + 1,
                score: (playingData.score || 0) + 100
            });
        }
    }
    
    /**
     * Handle state changes from GameStateManager
     */
    onStateChange(event) {
        const { fromState, toState, reason } = event;
        
        console.log(`🔄 Game handling state change: ${fromState} → ${toState} (${reason})`);
        
        // Handle transitions to playing state
        if (toState === this.stateManager.STATES.PLAYING) {
            // Create test dragon when starting gameplay
            if (!this.playerDragon || !this.playerDragon.isAlive) {
                this.createTestDragon();
            }
        }
        
        // Handle transitions away from playing state
        if (fromState === this.stateManager.STATES.PLAYING && toState === this.stateManager.STATES.MENU) {
            // Clean up dragons when returning to menu
            this.cleanupDragons();
        }
    }
    
    /**
     * Clean up all dragons
     */
    cleanupDragons() {
        for (const dragon of this.dragons) {
            dragon.destroy();
        }
        this.dragons = [];
        this.playerDragon = null;
        
        console.log('🧹 Dragons cleaned up');
    }
    
    /**
     * Render menu (in world space)
     */
    renderMenu() {
        // Center text in arena
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        this.renderer.renderText('SNAKE DRAGONS', centerX - 150, centerY - 50, 'white', '48px Arial');
        this.renderer.renderText('Press SPACE to Start', centerX - 120, centerY + 20, 'white', '24px Arial');
        this.renderer.renderText('Home Row Controls: I/K/J/L to move, A/S to rotate, F/D to shoot', 
                                centerX - 280, centerY + 60, 'lightblue', '16px Arial');
    }
    
    /**
     * Render gameplay (in world space)
     */
    renderGameplay() {
        // Render dragons
        this.renderDragons();
        
        // TODO: Render projectiles, obstacles, etc.
    }
    
    /**
     * Render boss mode (in world space)
     */
    renderBossMode() {
        // Render dragons (including boss)
        this.renderDragons();
        
        // TODO: Render boss-specific effects, enhanced UI, etc.
    }
    
    /**
     * Render paused state (in world space)
     */
    renderPaused() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        this.renderer.renderText('PAUSED', centerX - 60, centerY, 'yellow', '36px Arial');
        this.renderer.renderText('Press ESC to Resume', centerX - 100, centerY + 40, 'white', '16px Arial');
    }
    
    /**
     * Render game over (in world space)
     */
    renderGameOver() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        this.renderer.renderText('GAME OVER', centerX - 80, centerY, 'red', '36px Arial');
        this.renderer.renderText('Press SPACE to Restart', centerX - 120, centerY + 40, 'white', '16px Arial');
    }
    
    /**
     * Render debug information (in screen space)
     */
    renderDebugInfo() {
        this.ctx.fillStyle = 'lime';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'left';
        
        let debugY = this.canvas.height - 145;
        
        // Frame rate with color coding
        const fpsColor = this.frameRate >= 55 ? 'lime' : this.frameRate >= 25 ? 'yellow' : 'red';
        this.ctx.fillStyle = fpsColor;
        this.ctx.fillText(`FPS: ${this.frameRate} (Target: ${this.targetFPS})`, 10, debugY);
        
        this.ctx.fillStyle = 'lime';
        debugY += 15;
        
        // State manager debug info
        if (this.stateManager) {
            const currentState = this.stateManager.getCurrentState();
            const timeInState = this.stateManager.getTimeInCurrentState();
            this.ctx.fillText(`State: ${currentState} (${timeInState.toFixed(1)}s)`, 10, debugY);
            
            debugY += 15;
            const stateData = this.stateManager.getStateData();
            if (stateData.score !== undefined) {
                this.ctx.fillText(`Score: ${stateData.score}, Kills: ${stateData.kills || 0}`, 10, debugY);
                debugY += 15;
            }
        }
        
        this.ctx.fillText(`Frame Δt: ${this.deltaTime.toFixed(3)}s`, 10, debugY);
        
        debugY += 15;
        this.ctx.fillText(`Fixed Δt: ${this.fixedTimeStep.toFixed(3)}s`, 10, debugY);
        
        debugY += 15;
        this.ctx.fillText(`Accumulated: ${this.accumulatedTime.toFixed(3)}s`, 10, debugY);
        
        // Physics debug info
        if (this.physicsEngine) {
            const stats = this.physicsEngine.getStats();
            debugY += 15;
            this.ctx.fillText(`Physics Bodies: ${stats.bodies} (${stats.bodyUtilization})`, 10, debugY);
        }
        
        // Renderer debug info
        if (this.renderer) {
            const renderStats = this.renderer.getStats();
            debugY += 15;
            this.ctx.fillText(`Rendered: ${renderStats.objectsRendered}, Culled: ${renderStats.objectsCulled}`, 10, debugY);
        }
    }
}

// Input handling through GameStateManager
document.addEventListener('keydown', (event) => {
    if (window.game && window.game.stateManager) {
        // Convert event to format expected by GameStateManager
        const inputEvent = {
            key: event.code,
            type: 'keydown',
            originalEvent: event
        };
        
        window.game.stateManager.handleInput(inputEvent);
    }
});

// Also handle keyup events for completeness
document.addEventListener('keyup', (event) => {
    if (window.game && window.game.stateManager) {
        const inputEvent = {
            key: event.code,
            type: 'keyup',
            originalEvent: event
        };
        
        // State manager doesn't handle keyup yet, but structure is ready
        // window.game.stateManager.handleInput(inputEvent);
    }
});

// Initialize the game when the page loads
window.addEventListener('load', () => {
    console.log('🌟 Page loaded, creating Snake Dragons game...');
    window.game = new SnakeDragonsGame();
});

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (window.game) {
        window.game.stop();
    }
}); 