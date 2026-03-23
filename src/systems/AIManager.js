/**
 * AIManager - Enemy Dragon AI System
 * Handles AI behavior for enemy dragons including movement, targeting, and shooting
 */

class AIManager {
    constructor(game) {
        this.game = game;
        
        // AI configuration
        this.config = {
            // Targeting
            maxTargetDistance: 400, // Maximum distance to target player
            minTargetDistance: 100, // Minimum distance to maintain from player
            targetUpdateRate: 0.5, // How often to recalculate target (seconds)
            
            // Movement
            movementSpeed: 150, // Base movement speed
            strafeSpeed: 100, // Speed when strafing
            evasionSpeed: 200, // Speed when evading
            
            // Combat
            fireRate: 0.8, // Seconds between shots
            accuracy: 0.7, // Accuracy multiplier (0-1)
            burstCount: 3, // Number of shots in a burst
            burstDelay: 0.2, // Delay between burst shots
            
            // Behavior patterns
            patterns: {
                aggressive: {
                    name: 'aggressive',
                    description: 'Chases player and fires frequently',
                    fireRate: 0.6,
                    movementSpeed: 180,
                    minDistance: 80,
                    maxDistance: 300
                },
                defensive: {
                    name: 'defensive',
                    description: 'Maintains distance and fires from range',
                    fireRate: 1.0,
                    movementSpeed: 120,
                    minDistance: 150,
                    maxDistance: 400
                },
                evasive: {
                    name: 'evasive',
                    description: 'Moves erratically and fires when opportunity arises',
                    fireRate: 1.2,
                    movementSpeed: 160,
                    minDistance: 120,
                    maxDistance: 350
                }
            }
        };
        
        // AI state tracking
        this.enemyDragons = new Map(); // Map of dragon ID to AI state
        this.lastTargetUpdate = 0;
        
        console.log('🤖 AI Manager initialized');
    }
    
    /**
     * Register an enemy dragon for AI control
     */
    registerEnemy(enemyDragon, pattern = 'aggressive') {
        if (!enemyDragon || enemyDragon.isPlayer) {
            console.warn('⚠️ Cannot register player dragon or invalid dragon for AI');
            return;
        }
        
        const aiState = {
            dragon: enemyDragon,
            pattern: pattern,
            patternConfig: this.config.patterns[pattern] || this.config.patterns.aggressive,
            
            // Targeting
            target: null,
            lastTargetUpdate: 0,
            targetAngle: 0,
            targetDistance: 0,
            
            // Movement
            currentAction: 'idle',
            actionTimer: 0,
            lastDirectionChange: 0,
            
            // Combat
            lastShotTime: 0,
            burstCount: 0,
            burstTimer: 0,
            
            // Behavior
            state: 'seeking', // 'seeking', 'engaging', 'evading', 'repositioning'
            lastStateChange: 0,
            stateTimer: 0
        };
        
        this.enemyDragons.set(enemyDragon.id, aiState);
        
        console.log(`🤖 Enemy dragon ${enemyDragon.id} registered with ${pattern} AI pattern`);
    }
    
    /**
     * Unregister an enemy dragon
     */
    unregisterEnemy(enemyDragon) {
        if (enemyDragon && enemyDragon.id) {
            this.enemyDragons.delete(enemyDragon.id);
            console.log(`🤖 Enemy dragon ${enemyDragon.id} unregistered from AI`);
        }
    }
    
    /**
     * Update all enemy AI
     */
    update(deltaTime) {
        // Update target information
        this.updateTargets(deltaTime);
        
        // Update each enemy dragon
        for (const [dragonId, aiState] of this.enemyDragons) {
            if (aiState.dragon && aiState.dragon.isAlive) {
                this.updateEnemyAI(aiState, deltaTime);
            } else {
                // Remove dead dragons
                this.enemyDragons.delete(dragonId);
            }
        }
    }
    
    /**
     * Update target information for all enemies
     */
    updateTargets(deltaTime) {
        this.lastTargetUpdate += deltaTime;
        
        // Only update targets periodically for performance
        if (this.lastTargetUpdate < this.config.targetUpdateRate) {
            return;
        }
        
        this.lastTargetUpdate = 0;
        
        // Find player dragon
        const playerDragon = this.game.playerDragon;
        if (!playerDragon || !playerDragon.isAlive) {
            return;
        }
        
        // Update target info for all enemies
        for (const [dragonId, aiState] of this.enemyDragons) {
            if (aiState.dragon && aiState.dragon.isAlive) {
                this.updateEnemyTarget(aiState, playerDragon);
            }
        }
    }
    
    /**
     * Update target information for a specific enemy
     */
    updateEnemyTarget(aiState, playerDragon) {
        const enemy = aiState.dragon;
        const player = playerDragon;
        
        // Calculate distance to player
        const dx = player.position.x - enemy.position.x;
        const dy = player.position.y - enemy.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Calculate angle to player
        const angle = Math.atan2(dy, dx);
        
        // Update AI state
        aiState.target = player;
        aiState.targetAngle = angle;
        aiState.targetDistance = distance;
    }
    
    /**
     * Update AI for a specific enemy dragon
     */
    updateEnemyAI(aiState, deltaTime) {
        const enemy = aiState.dragon;
        const pattern = aiState.patternConfig;
        
        // Update state timer
        aiState.stateTimer += deltaTime;
        
        // Determine current state
        this.determineAIState(aiState);
        
        // Execute state behavior
        switch (aiState.state) {
            case 'seeking':
                this.executeSeekingBehavior(aiState, deltaTime);
                break;
            case 'engaging':
                this.executeEngagingBehavior(aiState, deltaTime);
                break;
            case 'evading':
                this.executeEvadingBehavior(aiState, deltaTime);
                break;
            case 'repositioning':
                this.executeRepositioningBehavior(aiState, deltaTime);
                break;
        }
        
        // Update action timer
        aiState.actionTimer += deltaTime;
        
        // Handle shooting
        this.handleEnemyShooting(aiState, deltaTime);
    }
    
    /**
     * Determine the current AI state based on situation
     */
    determineAIState(aiState) {
        const enemy = aiState.dragon;
        const pattern = aiState.patternConfig;
        
        if (!aiState.target) {
            aiState.state = 'seeking';
            return;
        }
        
        const distance = aiState.targetDistance;
        const healthPercent = enemy.health / enemy.maxHealth;
        
        // State transitions
        switch (aiState.state) {
            case 'seeking':
                if (distance <= pattern.maxDistance) {
                    aiState.state = 'engaging';
                    aiState.stateTimer = 0;
                }
                break;
                
            case 'engaging':
                if (distance > pattern.maxDistance) {
                    aiState.state = 'seeking';
                    aiState.stateTimer = 0;
                } else if (healthPercent < 0.3) {
                    aiState.state = 'evading';
                    aiState.stateTimer = 0;
                } else if (distance < pattern.minDistance) {
                    aiState.state = 'repositioning';
                    aiState.stateTimer = 0;
                }
                break;
                
            case 'evading':
                if (healthPercent > 0.5 && aiState.stateTimer > 3.0) {
                    aiState.state = 'engaging';
                    aiState.stateTimer = 0;
                }
                break;
                
            case 'repositioning':
                if (distance >= pattern.minDistance && aiState.stateTimer > 2.0) {
                    aiState.state = 'engaging';
                    aiState.stateTimer = 0;
                }
                break;
        }
    }
    
    /**
     * Execute seeking behavior (looking for player)
     */
    executeSeekingBehavior(aiState, deltaTime) {
        const enemy = aiState.dragon;
        
        // Move in a search pattern
        const searchTime = aiState.stateTimer;
        const searchRadius = 100;
        const searchSpeed = 0.5;
        
        // Create a circular search pattern
        const searchX = Math.cos(searchTime * searchSpeed) * searchRadius;
        const searchY = Math.sin(searchTime * searchSpeed) * searchRadius;
        
        // Move towards search position
        const targetX = enemy.position.x + searchX;
        const targetY = enemy.position.y + searchY;
        
        // Rotate towards search position
        enemy.rotateToPoint(targetX, targetY, deltaTime);
        
        // Move forward
        enemy.moveForward(deltaTime);
    }
    
    /**
     * Execute engaging behavior (fighting the player)
     */
    executeEngagingBehavior(aiState, deltaTime) {
        const enemy = aiState.dragon;
        const pattern = aiState.patternConfig;
        
        if (!aiState.target) return;
        
        const targetAngle = aiState.targetAngle;
        const distance = aiState.targetDistance;
        
        // Rotate to face player
        enemy.rotateTo(targetAngle, deltaTime);
        
        // Movement based on pattern
        if (distance > pattern.maxDistance) {
            // Move towards player
            enemy.moveForward(deltaTime);
        } else if (distance < pattern.minDistance) {
            // Move away from player
            enemy.moveBackward(deltaTime);
        } else {
            // Strafe around player
            const strafeDirection = Math.sin(aiState.stateTimer * 2) > 0 ? 1 : -1;
            const strafeAngle = targetAngle + (Math.PI / 2) * strafeDirection;
            
            // Move perpendicular to target direction
            const strafeForce = {
                x: Math.cos(strafeAngle) * pattern.movementSpeed * deltaTime,
                y: Math.sin(strafeAngle) * pattern.movementSpeed * deltaTime
            };
            
            if (enemy.physicsEngine && enemy.physicsBody) {
                enemy.physicsEngine.applyForce(enemy.physicsBody, strafeForce);
            }
        }
    }
    
    /**
     * Execute evading behavior (avoiding damage)
     */
    executeEvadingBehavior(aiState, deltaTime) {
        const enemy = aiState.dragon;
        
        if (!aiState.target) return;
        
        // Move away from player
        const evadeAngle = aiState.targetAngle + Math.PI; // Opposite direction
        enemy.rotateTo(evadeAngle, deltaTime);
        enemy.moveForward(deltaTime);
        
        // Add some randomness to evasion
        if (Math.random() < 0.1) {
            const randomAngle = Math.random() * Math.PI * 2;
            enemy.rotateTo(randomAngle, deltaTime);
        }
    }
    
    /**
     * Execute repositioning behavior (finding better position)
     */
    executeRepositioningBehavior(aiState, deltaTime) {
        const enemy = aiState.dragon;
        const pattern = aiState.patternConfig;
        
        if (!aiState.target) return;
        
        // Move to optimal distance
        const targetDistance = (pattern.minDistance + pattern.maxDistance) / 2;
        const currentDistance = aiState.targetDistance;
        
        if (currentDistance < targetDistance) {
            // Move away
            const moveAngle = aiState.targetAngle + Math.PI;
            enemy.rotateTo(moveAngle, deltaTime);
            enemy.moveForward(deltaTime);
        } else {
            // Move closer
            enemy.rotateTo(aiState.targetAngle, deltaTime);
            enemy.moveForward(deltaTime);
        }
    }
    
    /**
     * Handle enemy shooting logic
     */
    handleEnemyShooting(aiState, deltaTime) {
        const enemy = aiState.dragon;
        const pattern = aiState.patternConfig;
        
        if (!aiState.target || !enemy.canShootNow()) return;
        
        // Check if we should shoot based on pattern
        const timeSinceLastShot = (performance.now() - aiState.lastShotTime) / 1000;
        if (timeSinceLastShot < pattern.fireRate) return;
        
        // Check if target is in range and visible
        const distance = aiState.targetDistance;
        if (distance > pattern.maxDistance || distance < pattern.minDistance) return;
        
        // Check accuracy (miss sometimes)
        if (Math.random() > pattern.accuracy) {
            // Miss - shoot slightly off target
            const missAngle = aiState.targetAngle + (Math.random() - 0.5) * 0.3;
            enemy.rotation = missAngle;
        } else {
            // Hit - aim directly at target
            enemy.rotation = aiState.targetAngle;
        }
        
        // Shoot
        const projectileType = Math.random() < 0.2 ? 'exploding' : 'normal';
        enemy.shoot(projectileType);
        
        aiState.lastShotTime = performance.now();
        
        console.log(`🎯 Enemy ${enemy.id} fired ${projectileType} projectile at distance ${distance.toFixed(1)}`);
    }
    
    /**
     * Create a new enemy dragon
     */
    createEnemy(options = {}) {
        const defaultOptions = {
            type: 'enemy',
            maxHealth: 80,
            damage: 20,
            fireRate: 0.8,
            maxSpeed: 150,
            color: '#e74c3c',
            pattern: 'aggressive'
        };
        
        const enemyOptions = { ...defaultOptions, ...options };
        
        // Create enemy dragon
        const enemy = new Dragon(enemyOptions);
        
        // Initialize with game systems
        if (this.game && this.game.physicsEngine && this.game.renderer) {
            enemy.init(this.game, this.game.physicsEngine, this.game.renderer);
            
            // Add to game's dragon list
            if (this.game.dragons) {
                this.game.dragons.push(enemy);
            }
        }
        
        // Register for AI control
        this.registerEnemy(enemy, enemyOptions.pattern);
        
        console.log(`🐉 Enemy dragon created: ${enemy.id} with ${enemyOptions.pattern} pattern`);
        
        return enemy;
    }
    
    /**
     * Spawn enemies in waves
     */
    spawnEnemyWave(waveNumber, spawnCount = 1) {
        const enemies = [];
        
        for (let i = 0; i < spawnCount; i++) {
            // Determine spawn position (away from player)
            const spawnPosition = this.getSpawnPosition();
            
            // Determine enemy type based on wave
            const pattern = this.getPatternForWave(waveNumber);
            const health = this.getHealthForWave(waveNumber);
            const damage = this.getDamageForWave(waveNumber);
            
            const enemy = this.createEnemy({
                x: spawnPosition.x,
                y: spawnPosition.y,
                maxHealth: health,
                damage: damage,
                pattern: pattern
            });
            
            enemies.push(enemy);
        }
        
        console.log(`🌊 Spawned wave ${waveNumber} with ${spawnCount} enemies`);
        return enemies;
    }
    
    /**
     * Get spawn position away from player
     */
    getSpawnPosition() {
        const player = this.game.playerDragon;
        if (!player) {
            return { x: 100, y: 100 };
        }
        
        // Spawn at edge of screen, away from player
        const screenWidth = this.game.canvas.width;
        const screenHeight = this.game.canvas.height;
        
        let spawnX, spawnY;
        
        // Choose random edge
        const edge = Math.floor(Math.random() * 4);
        
        switch (edge) {
            case 0: // Top
                spawnX = Math.random() * screenWidth;
                spawnY = -50;
                break;
            case 1: // Right
                spawnX = screenWidth + 50;
                spawnY = Math.random() * screenHeight;
                break;
            case 2: // Bottom
                spawnX = Math.random() * screenWidth;
                spawnY = screenHeight + 50;
                break;
            case 3: // Left
                spawnX = -50;
                spawnY = Math.random() * screenHeight;
                break;
        }
        
        return { x: spawnX, y: spawnY };
    }
    
    /**
     * Get AI pattern for wave number
     */
    getPatternForWave(waveNumber) {
        const patterns = ['aggressive', 'defensive', 'evasive'];
        return patterns[waveNumber % patterns.length];
    }
    
    /**
     * Get health for wave number (scales with wave)
     */
    getHealthForWave(waveNumber) {
        return 60 + (waveNumber * 10); // Base 60 + 10 per wave
    }
    
    /**
     * Get damage for wave number (scales with wave)
     */
    getDamageForWave(waveNumber) {
        return 15 + (waveNumber * 2); // Base 15 + 2 per wave
    }
    
    /**
     * Get AI statistics
     */
    getStats() {
        return {
            activeEnemies: this.enemyDragons.size,
            patterns: Object.keys(this.config.patterns),
            config: this.config
        };
    }
    
    /**
     * Clean up AI manager
     */
    destroy() {
        this.enemyDragons.clear();
        console.log('🤖 AI Manager destroyed');
    }
}

// Export for use in other modules
window.AIManager = AIManager; 