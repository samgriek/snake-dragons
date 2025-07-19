/**
 * GameStateManager - Centralized State Management System
 * Handles all game state transitions, validation, and lifecycle management
 */

class GameStateManager {
    constructor(game) {
        this.game = game;
        
        // Available game states
        this.STATES = {
            LOADING: 'loading',
            MENU: 'menu',
            PLAYING: 'playing',
            BOSS: 'boss',
            PAUSED: 'paused',
            GAMEOVER: 'gameover'
        };
        
        // Current and previous states
        this.currentState = this.STATES.LOADING;
        this.previousState = null;
        this.stateStartTime = 0;
        
        // State transition validation rules
        this.transitions = {
            [this.STATES.LOADING]: [this.STATES.MENU],
            [this.STATES.MENU]: [this.STATES.PLAYING, this.STATES.LOADING],
            [this.STATES.PLAYING]: [this.STATES.BOSS, this.STATES.PAUSED, this.STATES.GAMEOVER, this.STATES.MENU],
            [this.STATES.BOSS]: [this.STATES.PLAYING, this.STATES.PAUSED, this.STATES.GAMEOVER, this.STATES.MENU],
            [this.STATES.PAUSED]: [this.STATES.PLAYING, this.STATES.BOSS, this.STATES.MENU],
            [this.STATES.GAMEOVER]: [this.STATES.MENU, this.STATES.PLAYING]
        };
        
        // State-specific data
        this.stateData = {
            [this.STATES.PLAYING]: {
                startTime: 0,
                score: 0,
                kills: 0,
                playerHealth: 100
            },
            [this.STATES.BOSS]: {
                bossHealth: 100,
                phase: 1
            }
        };
        
        // Event listeners for state changes
        this.stateListeners = new Map();
        
        // State history for debugging
        this.stateHistory = [];
        this.maxHistoryLength = 10;
        
        this.init();
    }
    
    /**
     * Initialize the state manager
     */
    init() {
        console.log('🎮 GameStateManager initialized');
        console.log(`📋 Available states: ${Object.values(this.STATES).join(', ')}`);
        
        // Set initial state timing
        this.stateStartTime = performance.now();
        
        // Add to state history
        this.addToHistory(this.currentState, 'initialization');
    }
    
    /**
     * Get current state
     */
    getCurrentState() {
        return this.currentState;
    }
    
    /**
     * Get previous state
     */
    getPreviousState() {
        return this.previousState;
    }
    
    /**
     * Get time spent in current state (in seconds)
     */
    getTimeInCurrentState() {
        return (performance.now() - this.stateStartTime) / 1000;
    }
    
    /**
     * Get state-specific data
     */
    getStateData(state = null) {
        const targetState = state || this.currentState;
        return this.stateData[targetState] || {};
    }
    
    /**
     * Update state-specific data
     */
    updateStateData(data, state = null) {
        const targetState = state || this.currentState;
        if (this.stateData[targetState]) {
            Object.assign(this.stateData[targetState], data);
        }
    }
    
    /**
     * Check if transition is valid
     */
    isValidTransition(fromState, toState) {
        const allowedTransitions = this.transitions[fromState];
        return allowedTransitions && allowedTransitions.includes(toState);
    }
    
    /**
     * Transition to a new state
     */
    transitionTo(newState, reason = 'manual') {
        // Validate transition
        if (!this.isValidTransition(this.currentState, newState)) {
            console.warn(`⚠️ Invalid state transition: ${this.currentState} → ${newState}`);
            return false;
        }
        
        // Same state check
        if (newState === this.currentState) {
            console.log(`📍 Already in state: ${newState}`);
            return true;
        }
        
        const oldState = this.currentState;
        
        // Call exit handler for current state
        this.onStateExit(oldState);
        
        // Update state
        this.previousState = oldState;
        this.currentState = newState;
        this.stateStartTime = performance.now();
        
        // Add to history
        this.addToHistory(newState, reason, oldState);
        
        // Call enter handler for new state
        this.onStateEnter(newState, oldState);
        
        // Emit state change event
        this.emitStateChange(oldState, newState, reason);
        
        console.log(`🔄 State transition: ${oldState} → ${newState} (${reason})`);
        return true;
    }
    
    /**
     * Handle state entry
     */
    onStateEnter(state, fromState) {
        switch (state) {
            case this.STATES.MENU:
                this.onEnterMenu(fromState);
                break;
                
            case this.STATES.PLAYING:
                this.onEnterPlaying(fromState);
                break;
                
            case this.STATES.BOSS:
                this.onEnterBoss(fromState);
                break;
                
            case this.STATES.PAUSED:
                this.onEnterPaused(fromState);
                break;
                
            case this.STATES.GAMEOVER:
                this.onEnterGameOver(fromState);
                break;
        }
    }
    
    /**
     * Handle state exit
     */
    onStateExit(state) {
        switch (state) {
            case this.STATES.MENU:
                this.onExitMenu();
                break;
                
            case this.STATES.PLAYING:
                this.onExitPlaying();
                break;
                
            case this.STATES.BOSS:
                this.onExitBoss();
                break;
                
            case this.STATES.PAUSED:
                this.onExitPaused();
                break;
                
            case this.STATES.GAMEOVER:
                this.onExitGameOver();
                break;
        }
    }
    
    /**
     * Menu state handlers
     */
    onEnterMenu(fromState) {
        console.log('📋 Entered MENU state');
        // Reset camera if needed
        if (this.game.renderer) {
            this.game.renderer.setCameraTarget(null);
        }
    }
    
    onExitMenu() {
        console.log('📋 Exited MENU state');
    }
    
    /**
     * Playing state handlers
     */
    onEnterPlaying(fromState) {
        console.log('🎮 Entered PLAYING state');
        
        // Initialize or reset playing data
        if (fromState === this.STATES.MENU) {
            // New game
            this.stateData[this.STATES.PLAYING] = {
                startTime: performance.now(),
                score: 0,
                kills: 0,
                playerHealth: 100
            };
        }
        // If coming from pause, don't reset data
        
        // TODO: Initialize player dragon and enemies
        // TODO: Set camera to follow player
    }
    
    onExitPlaying() {
        console.log('🎮 Exited PLAYING state');
    }
    
    /**
     * Boss state handlers
     */
    onEnterBoss(fromState) {
        console.log('👹 Entered BOSS state');
        
        // Initialize boss data
        this.stateData[this.STATES.BOSS] = {
            bossHealth: 100,
            phase: 1
        };
        
        // TODO: Spawn boss dragon
        // TODO: Special boss camera behavior
    }
    
    onExitBoss() {
        console.log('👹 Exited BOSS state');
    }
    
    /**
     * Paused state handlers
     */
    onEnterPaused(fromState) {
        console.log('⏸️ Entered PAUSED state');
        // Store what state we paused from for resume
        this.pausedFromState = fromState;
    }
    
    onExitPaused() {
        console.log('▶️ Exited PAUSED state');
    }
    
    /**
     * Game Over state handlers
     */
    onEnterGameOver(fromState) {
        console.log('💀 Entered GAMEOVER state');
        
        // Calculate final score and stats
        const playingData = this.getStateData(this.STATES.PLAYING);
        const finalScore = playingData.score || 0;
        const finalKills = playingData.kills || 0;
        const timeAlive = this.getTimeInCurrentState();
        
        console.log(`📊 Final Stats - Score: ${finalScore}, Kills: ${finalKills}, Time: ${timeAlive.toFixed(1)}s`);
        
        // TODO: Save high scores
        // TODO: Reset camera
    }
    
    onExitGameOver() {
        console.log('💀 Exited GAMEOVER state');
    }
    
    /**
     * Game-specific transition methods
     */
    startGame() {
        return this.transitionTo(this.STATES.PLAYING, 'start_game');
    }
    
    pauseGame() {
        if (this.currentState === this.STATES.PLAYING || this.currentState === this.STATES.BOSS) {
            return this.transitionTo(this.STATES.PAUSED, 'pause_request');
        }
        return false;
    }
    
    resumeGame() {
        if (this.currentState === this.STATES.PAUSED) {
            const resumeState = this.pausedFromState || this.STATES.PLAYING;
            return this.transitionTo(resumeState, 'resume_request');
        }
        return false;
    }
    
    triggerBoss() {
        if (this.currentState === this.STATES.PLAYING) {
            return this.transitionTo(this.STATES.BOSS, 'boss_trigger');
        }
        return false;
    }
    
    gameOver() {
        if (this.currentState === this.STATES.PLAYING || this.currentState === this.STATES.BOSS) {
            return this.transitionTo(this.STATES.GAMEOVER, 'player_died');
        }
        return false;
    }
    
    returnToMenu() {
        return this.transitionTo(this.STATES.MENU, 'return_to_menu');
    }
    
    /**
     * Event system for state changes
     */
    addEventListener(event, callback) {
        if (!this.stateListeners.has(event)) {
            this.stateListeners.set(event, []);
        }
        this.stateListeners.get(event).push(callback);
    }
    
    removeEventListener(event, callback) {
        if (this.stateListeners.has(event)) {
            const listeners = this.stateListeners.get(event);
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }
    
    emitStateChange(fromState, toState, reason) {
        const listeners = this.stateListeners.get('statechange') || [];
        listeners.forEach(callback => {
            try {
                callback({ fromState, toState, reason, timestamp: performance.now() });
            } catch (error) {
                console.error('Error in state change listener:', error);
            }
        });
    }
    
    /**
     * Update method (called from main game loop)
     */
    update(deltaTime) {
        // State-specific update logic
        switch (this.currentState) {
            case this.STATES.PLAYING:
                this.updatePlaying(deltaTime);
                break;
                
            case this.STATES.BOSS:
                this.updateBoss(deltaTime);
                break;
        }
    }
    
    /**
     * Update playing state
     */
    updatePlaying(deltaTime) {
        const playingData = this.getStateData();
        
        // Check for boss trigger (after 2 minutes)
        const timeInGame = this.getTimeInCurrentState();
        if (timeInGame >= 120 && playingData.kills >= 5) { // 2 minutes + 5 kills
            this.triggerBoss();
            return;
        }
        
        // TODO: Update game entities
        // TODO: Check win/lose conditions
    }
    
    /**
     * Update boss state
     */
    updateBoss(deltaTime) {
        const bossData = this.getStateData();
        
        // TODO: Update boss behavior
        // TODO: Check boss defeat condition
        
        if (bossData.bossHealth <= 0) {
            // Boss defeated - could go back to playing or end game
            this.transitionTo(this.STATES.GAMEOVER, 'boss_defeated');
        }
    }
    
    /**
     * Add state to history
     */
    addToHistory(state, reason, fromState = null) {
        this.stateHistory.push({
            state,
            reason,
            fromState,
            timestamp: performance.now()
        });
        
        // Limit history size
        while (this.stateHistory.length > this.maxHistoryLength) {
            this.stateHistory.shift();
        }
    }
    
    /**
     * Get state history
     */
    getStateHistory() {
        return [...this.stateHistory];
    }
    
    /**
     * Get comprehensive state information for debugging
     */
    getDebugInfo() {
        return {
            currentState: this.currentState,
            previousState: this.previousState,
            timeInState: this.getTimeInCurrentState(),
            stateData: this.getStateData(),
            history: this.getStateHistory(),
            validTransitions: this.transitions[this.currentState] || []
        };
    }
    
    /**
     * Handle input events
     */
    handleInput(inputEvent) {
        const { key, type } = inputEvent;
        
        if (type !== 'keydown') return;
        
        switch (key) {
            case 'Space':
                if (this.currentState === this.STATES.MENU) {
                    this.startGame();
                } else if (this.currentState === this.STATES.GAMEOVER) {
                    this.returnToMenu();
                }
                break;
                
            case 'Escape':
                if (this.currentState === this.STATES.PLAYING || this.currentState === this.STATES.BOSS) {
                    this.pauseGame();
                } else if (this.currentState === this.STATES.PAUSED) {
                    this.resumeGame();
                }
                break;
        }
    }
    
    /**
     * Clean up state manager
     */
    destroy() {
        this.stateListeners.clear();
        this.stateHistory = [];
        console.log('🎮 GameStateManager destroyed');
    }
}

// Export for use in other modules
window.GameStateManager = GameStateManager; 