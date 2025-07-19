/**
 * Snake Dragons - Main Game Entry Point
 * A fast-paced 2D dragon combat game with home row keyboard controls
 */

class SnakeDragonsGame {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.physicsEngine = null;
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
        
        // Game state
        this.currentState = 'loading'; // loading, menu, playing, boss, paused, gameover
        
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
        
        console.log('✅ Canvas initialized:', this.canvas.width + 'x' + this.canvas.height);
        console.log('✅ Physics engine ready');
        
        // Hide loading text
        const loadingText = document.getElementById('loadingText');
        if (loadingText) {
            loadingText.style.display = 'none';
        }
        
        // Set initial game state
        this.currentState = 'menu';
        
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
            if (document.hidden) {
                // Tab is hidden, pause the game if playing
                if (this.currentState === 'playing' || this.currentState === 'boss') {
                    this.lastVisibleState = this.currentState;
                    this.currentState = 'paused';
                    console.log('⏸️ Game auto-paused (tab hidden)');
                }
            } else {
                // Tab is visible again, resume if was auto-paused
                if (this.currentState === 'paused' && this.lastVisibleState) {
                    this.currentState = this.lastVisibleState;
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
        
        // Clean up physics engine
        if (this.physicsEngine) {
            this.physicsEngine.destroy();
            this.physicsEngine = null;
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
        // Update physics simulation (runs in all states except paused)
        if (this.currentState !== 'paused' && this.physicsEngine) {
            this.physicsEngine.update(fixedDeltaTime);
        }
        
        switch (this.currentState) {
            case 'menu':
                this.updateMenu(fixedDeltaTime);
                break;
            case 'playing':
                this.updateGameplay(fixedDeltaTime);
                break;
            case 'boss':
                this.updateBossMode(fixedDeltaTime);
                break;
            case 'paused':
                // No updates during pause
                break;
            case 'gameover':
                this.updateGameOver(fixedDeltaTime);
                break;
        }
    }
    
    /**
     * Render the game
     */
    render() {
        // Clear the canvas
        this.ctx.fillStyle = '#1e3a5f';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        switch (this.currentState) {
            case 'menu':
                this.renderMenu();
                break;
            case 'playing':
                this.renderGameplay();
                break;
            case 'boss':
                this.renderBossMode();
                break;
            case 'paused':
                this.renderPaused();
                break;
            case 'gameover':
                this.renderGameOver();
                break;
        }
        
        // Render debug info
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
        // TODO: Implement gameplay logic
    }
    
    /**
     * Update boss mode state
     */
    updateBossMode(deltaTime) {
        // TODO: Implement boss mode logic
    }
    
    /**
     * Update game over state
     */
    updateGameOver(deltaTime) {
        // TODO: Implement game over logic
    }
    
    /**
     * Render menu
     */
    renderMenu() {
        this.ctx.fillStyle = 'white';
        this.ctx.font = '48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('SNAKE DRAGONS', this.canvas.width / 2, this.canvas.height / 2 - 50);
        
        this.ctx.font = '24px Arial';
        this.ctx.fillText('Press SPACE to Start', this.canvas.width / 2, this.canvas.height / 2 + 20);
        
        this.ctx.font = '16px Arial';
        this.ctx.fillText('Home Row Controls: I/K/J/L to move, A/S to rotate, F/D to shoot', 
                         this.canvas.width / 2, this.canvas.height / 2 + 60);
    }
    
    /**
     * Render gameplay
     */
    renderGameplay() {
        // TODO: Implement gameplay rendering
        this.ctx.fillStyle = 'white';
        this.ctx.font = '24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAMEPLAY MODE', this.canvas.width / 2, this.canvas.height / 2);
    }
    
    /**
     * Render boss mode
     */
    renderBossMode() {
        // TODO: Implement boss mode rendering
        this.ctx.fillStyle = 'red';
        this.ctx.font = '24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('BOSS BATTLE!', this.canvas.width / 2, this.canvas.height / 2);
    }
    
    /**
     * Render paused state
     */
    renderPaused() {
        this.ctx.fillStyle = 'yellow';
        this.ctx.font = '36px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
    }
    
    /**
     * Render game over
     */
    renderGameOver() {
        this.ctx.fillStyle = 'red';
        this.ctx.font = '36px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2);
    }
    
    /**
     * Render debug information
     */
    renderDebugInfo() {
        this.ctx.fillStyle = 'lime';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'left';
        
        let debugY = this.canvas.height - 85;
        
        // Frame rate with color coding
        const fpsColor = this.frameRate >= 55 ? 'lime' : this.frameRate >= 25 ? 'yellow' : 'red';
        this.ctx.fillStyle = fpsColor;
        this.ctx.fillText(`FPS: ${this.frameRate} (Target: ${this.targetFPS})`, 10, debugY);
        
        this.ctx.fillStyle = 'lime';
        debugY += 15;
        this.ctx.fillText(`State: ${this.currentState}`, 10, debugY);
        
        debugY += 15;
        this.ctx.fillText(`Frame Δt: ${this.deltaTime.toFixed(3)}s`, 10, debugY);
        
        debugY += 15;
        this.ctx.fillText(`Fixed Δt: ${this.fixedTimeStep.toFixed(3)}s`, 10, debugY);
        
        debugY += 15;
        this.ctx.fillText(`Accumulated: ${this.accumulatedTime.toFixed(3)}s`, 10, debugY);
        
        // Physics debug info
        if (this.physicsEngine) {
            const stats = this.physicsEngine.getStats();
            debugY += 15;
            this.ctx.fillText(`Physics Bodies: ${stats.bodies}`, 10, debugY);
        }
    }
}

// Basic input handling for menu navigation
document.addEventListener('keydown', (event) => {
    if (window.game) {
        switch (event.code) {
            case 'Space':
                if (window.game.currentState === 'menu') {
                    window.game.currentState = 'playing';
                    console.log('🎮 Starting gameplay');
                }
                break;
            case 'Escape':
                if (window.game.currentState === 'playing') {
                    window.game.currentState = 'paused';
                } else if (window.game.currentState === 'paused') {
                    window.game.currentState = 'playing';
                }
                break;
        }
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