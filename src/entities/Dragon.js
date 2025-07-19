/**
 * Dragon - Base class for all dragon entities (player and enemies)
 * Handles position, rotation, health, physics, and basic rendering
 */

class Dragon {
    constructor(options = {}) {
        // Core identity
        this.id = Dragon.generateId();
        this.type = options.type || 'player'; // 'player', 'enemy', 'boss'
        this.isPlayer = this.type === 'player';
        
        // Position and spatial properties
        this.position = {
            x: options.x || 0,
            y: options.y || 0
        };
        this.rotation = options.rotation || 0; // Radians
        this.scale = options.scale || 1.0;
        
        // Physics properties
        this.velocity = { x: 0, y: 0 };
        this.angularVelocity = 0;
        this.physicsBody = null;
        
        // Health and damage system
        this.maxHealth = options.maxHealth || 100;
        this.health = this.maxHealth;
        this.isAlive = true;
        this.isDead = false;
        this.invulnerable = false;
        this.invulnerabilityDuration = 0.5; // 0.5 seconds after taking damage
        this.lastDamageTime = 0;
        
        // Dragon characteristics and stats
        this.size = options.size || 30; // Base radius for collision
        this.maxSpeed = options.maxSpeed || 200; // Pixels per second
        this.acceleration = options.acceleration || 400;
        this.turnSpeed = options.turnSpeed || 3.0; // Radians per second
        this.friction = options.friction || 0.95; // Movement friction multiplier
        
        // Combat properties
        this.damage = options.damage || 25;
        this.fireRate = options.fireRate || 0.3; // Seconds between shots
        this.lastShotTime = 0;
        this.canShoot = true;
        this.projectileSpeed = options.projectileSpeed || 300;
        
        // Visual properties
        this.color = options.color || (this.isPlayer ? '#4a90e2' : '#e74c3c');
        this.outlineColor = options.outlineColor || '#333';
        this.healthBarColor = '#e74c3c';
        this.healthBarBackgroundColor = '#333';
        
        // Sprite and animation (for future implementation)
        this.sprite = null;
        this.animationFrame = 0;
        this.animationTime = 0;
        this.animationSpeed = 0.1; // Seconds per frame
        
        // State tracking
        this.isMoving = false;
        this.isShooting = false;
        this.lastUpdateTime = 0;
        
        // Game references (set externally)
        this.game = null;
        this.physicsEngine = null;
        this.renderer = null;
        
        // Debug and development
        this.showDebugInfo = options.debug || false;
        this.debugColor = options.debugColor || 'yellow';
        
        console.log(`🐉 Dragon created: ${this.type} (ID: ${this.id}) at (${this.position.x}, ${this.position.y})`);
    }
    
    /**
     * Initialize dragon with game systems
     */
    init(game, physicsEngine, renderer) {
        this.game = game;
        this.physicsEngine = physicsEngine;
        this.renderer = renderer;
        
        // Create physics body
        this.createPhysicsBody();
        
        console.log(`✅ Dragon ${this.id} initialized with game systems`);
    }
    
    /**
     * Create physics body for the dragon
     */
    createPhysicsBody() {
        if (!this.physicsEngine) {
            console.warn('⚠️ Cannot create physics body: physicsEngine not available');
            return;
        }
        
        // Create circular body for dragon
        const bodyOptions = {
            density: 0.001, // Light for responsive movement
            friction: 0.1,
            frictionAir: 0.01, // Slight air resistance
            restitution: 0.3, // Some bounce
            isSensor: false, // Solid collision
            
            // Custom properties for identification
            dragonId: this.id,
            dragonType: this.type,
            isPlayer: this.isPlayer
        };
        
        this.physicsBody = this.physicsEngine.createCircle(
            this.position.x,
            this.position.y,
            this.size,
            bodyOptions
        );
        
        if (this.physicsBody) {
            console.log(`🔵 Physics body created for dragon ${this.id}: radius ${this.size}`);
        }
    }
    
    /**
     * Update dragon logic (called every frame)
     */
    update(deltaTime) {
        if (!this.isAlive) return;
        
        this.lastUpdateTime = performance.now();
        
        // Update physics body position
        this.updatePhysics(deltaTime);
        
        // Update invulnerability
        this.updateInvulnerability(deltaTime);
        
        // Update animation
        this.updateAnimation(deltaTime);
        
        // Update movement state
        this.updateMovementState();
        
        // Type-specific updates (override in subclasses)
        this.updateSpecific(deltaTime);
    }
    
    /**
     * Update physics and sync with physics body
     */
    updatePhysics(deltaTime) {
        if (!this.physicsBody) return;
        
        // Get position from physics body
        const bodyPosition = this.physicsBody.position;
        this.position.x = bodyPosition.x;
        this.position.y = bodyPosition.y;
        
        // Get velocity from physics body
        this.velocity.x = this.physicsBody.velocity.x;
        this.velocity.y = this.physicsBody.velocity.y;
        
        // Get rotation from physics body
        this.rotation = this.physicsBody.angle;
        this.angularVelocity = this.physicsBody.angularVelocity;
    }
    
    /**
     * Update invulnerability after taking damage
     */
    updateInvulnerability(deltaTime) {
        if (this.invulnerable) {
            const timeSinceLastDamage = (performance.now() - this.lastDamageTime) / 1000;
            if (timeSinceLastDamage >= this.invulnerabilityDuration) {
                this.invulnerable = false;
            }
        }
    }
    
    /**
     * Update sprite animation
     */
    updateAnimation(deltaTime) {
        this.animationTime += deltaTime;
        
        if (this.animationTime >= this.animationSpeed) {
            this.animationFrame = (this.animationFrame + 1) % 6; // 6 frames for dragon animation
            this.animationTime = 0;
        }
    }
    
    /**
     * Update movement state tracking
     */
    updateMovementState() {
        const speed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
        this.isMoving = speed > 10; // Consider moving if speed > 10 pixels/second
    }
    
    /**
     * Type-specific update logic (override in subclasses)
     */
    updateSpecific(deltaTime) {
        // Override in PlayerDragon, EnemyDragon, BossDragon
    }
    
    /**
     * Render the dragon
     */
    render(renderer) {
        if (!this.isAlive || !renderer) return;
        
        // Render dragon body
        this.renderBody(renderer);
        
        // Render health bar
        this.renderHealthBar(renderer);
        
        // Render debug info if enabled
        if (this.showDebugInfo) {
            this.renderDebugInfo(renderer);
        }
    }
    
    /**
     * Render dragon body (circle for now, sprite later)
     */
    renderBody(renderer) {
        // Get screen position
        const screenPos = renderer.worldToScreen(this.position.x, this.position.y);
        
        // Calculate size in screen space
        const screenSize = this.size * renderer.camera.zoom;
        
        // Don't render if too small or outside viewport
        if (screenSize < 2 || !renderer.isInViewport(this.position.x, this.position.y, this.size)) {
            return;
        }
        
        // Draw dragon body
        renderer.ctx.save();
        
        // Apply invulnerability flashing
        if (this.invulnerable) {
            const flashTime = (performance.now() - this.lastDamageTime) / 100;
            const alpha = 0.3 + 0.7 * Math.abs(Math.sin(flashTime));
            renderer.ctx.globalAlpha = alpha;
        }
        
        // Draw filled circle
        renderer.drawCircle(this.position.x, this.position.y, this.size, this.color, true);
        
        // Draw outline
        renderer.drawCircle(this.position.x, this.position.y, this.size, this.outlineColor, false, 2);
        
        // Draw direction indicator (line showing facing direction)
        const dirLength = this.size * 0.8;
        const endX = this.position.x + Math.cos(this.rotation) * dirLength;
        const endY = this.position.y + Math.sin(this.rotation) * dirLength;
        
        renderer.ctx.strokeStyle = this.outlineColor;
        renderer.ctx.lineWidth = 3;
        renderer.ctx.beginPath();
        const startScreen = renderer.worldToScreen(this.position.x, this.position.y);
        const endScreen = renderer.worldToScreen(endX, endY);
        renderer.ctx.moveTo(startScreen.x, startScreen.y);
        renderer.ctx.lineTo(endScreen.x, endScreen.y);
        renderer.ctx.stroke();
        
        renderer.ctx.restore();
    }
    
    /**
     * Render health bar above dragon
     */
    renderHealthBar(renderer) {
        if (this.health >= this.maxHealth) return; // Don't show if full health
        
        const screenPos = renderer.worldToScreen(this.position.x, this.position.y);
        const screenSize = this.size * renderer.camera.zoom;
        
        // Health bar dimensions
        const barWidth = screenSize * 1.5;
        const barHeight = 4;
        const barOffsetY = screenSize + 10;
        
        const barX = screenPos.x - barWidth / 2;
        const barY = screenPos.y - barOffsetY;
        
        // Health percentage
        const healthPercent = Math.max(0, this.health / this.maxHealth);
        
        // Draw background
        renderer.ctx.fillStyle = this.healthBarBackgroundColor;
        renderer.ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Draw health
        renderer.ctx.fillStyle = this.healthBarColor;
        renderer.ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
        
        // Draw border
        renderer.ctx.strokeStyle = this.outlineColor;
        renderer.ctx.lineWidth = 1;
        renderer.ctx.strokeRect(barX, barY, barWidth, barHeight);
    }
    
    /**
     * Render debug information
     */
    renderDebugInfo(renderer) {
        const screenPos = renderer.worldToScreen(this.position.x, this.position.y);
        
        renderer.ctx.fillStyle = this.debugColor;
        renderer.ctx.font = '10px Arial';
        renderer.ctx.textAlign = 'center';
        
        let debugY = screenPos.y + this.size * renderer.camera.zoom + 25;
        renderer.ctx.fillText(`ID: ${this.id}`, screenPos.x, debugY);
        
        debugY += 12;
        renderer.ctx.fillText(`HP: ${this.health}/${this.maxHealth}`, screenPos.x, debugY);
        
        debugY += 12;
        const speed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
        renderer.ctx.fillText(`Speed: ${speed.toFixed(1)}`, screenPos.x, debugY);
        
        debugY += 12;
        renderer.ctx.fillText(`Angle: ${(this.rotation * 180 / Math.PI).toFixed(1)}°`, screenPos.x, debugY);
    }
    
    /**
     * Move dragon in a direction
     */
    move(direction, deltaTime) {
        if (!this.isAlive || !this.physicsBody) return;
        
        // Calculate movement force
        const force = {
            x: Math.cos(direction) * this.acceleration * deltaTime,
            y: Math.sin(direction) * this.acceleration * deltaTime
        };
        
        // Apply force to physics body
        this.physicsEngine.applyForce(this.physicsBody, force);
        
        // Limit maximum speed
        this.limitSpeed();
    }
    
    /**
     * Rotate dragon
     */
    rotate(angularVelocity) {
        if (!this.isAlive || !this.physicsBody) return;
        
        // Set angular velocity directly
        this.physicsEngine.setAngularVelocity(this.physicsBody, angularVelocity);
    }
    
    /**
     * Limit dragon speed to maximum
     */
    limitSpeed() {
        if (!this.physicsBody) return;
        
        const speed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
        
        if (speed > this.maxSpeed) {
            const ratio = this.maxSpeed / speed;
            this.physicsEngine.setVelocity(this.physicsBody, {
                x: this.velocity.x * ratio,
                y: this.velocity.y * ratio
            });
        }
    }
    
    /**
     * Take damage
     */
    takeDamage(amount, source = null) {
        if (!this.isAlive || this.invulnerable) return false;
        
        this.health = Math.max(0, this.health - amount);
        this.lastDamageTime = performance.now();
        this.invulnerable = true;
        
        console.log(`💥 Dragon ${this.id} took ${amount} damage, health: ${this.health}/${this.maxHealth}`);
        
        // Check if dead
        if (this.health <= 0) {
            this.die();
        }
        
        return true;
    }
    
    /**
     * Heal dragon
     */
    heal(amount) {
        if (!this.isAlive) return false;
        
        const oldHealth = this.health;
        this.health = Math.min(this.maxHealth, this.health + amount);
        
        const healedAmount = this.health - oldHealth;
        if (healedAmount > 0) {
            console.log(`💚 Dragon ${this.id} healed ${healedAmount}, health: ${this.health}/${this.maxHealth}`);
            return true;
        }
        
        return false;
    }
    
    /**
     * Kill the dragon
     */
    die() {
        if (this.isDead) return;
        
        this.isAlive = false;
        this.isDead = true;
        this.health = 0;
        
        console.log(`💀 Dragon ${this.id} died`);
        
        // TODO: Add death animation
        // TODO: Add particle effects
        // TODO: Add sound effects
        
        // Notify game of death
        if (this.game && this.game.onDragonDeath) {
            this.game.onDragonDeath(this);
        }
    }
    
    /**
     * Check if dragon can shoot
     */
    canShootNow() {
        if (!this.isAlive || !this.canShoot) return false;
        
        const timeSinceLastShot = (performance.now() - this.lastShotTime) / 1000;
        return timeSinceLastShot >= this.fireRate;
    }
    
    /**
     * Shoot projectile
     */
    shoot(projectileType = 'normal') {
        if (!this.canShootNow()) return null;
        
        this.lastShotTime = performance.now();
        this.isShooting = true;
        
        // Calculate projectile spawn position (front of dragon)
        const spawnDistance = this.size + 5;
        const spawnX = this.position.x + Math.cos(this.rotation) * spawnDistance;
        const spawnY = this.position.y + Math.sin(this.rotation) * spawnDistance;
        
        // Calculate projectile velocity
        const projectileVelocity = {
            x: Math.cos(this.rotation) * this.projectileSpeed,
            y: Math.sin(this.rotation) * this.projectileSpeed
        };
        
        console.log(`🔥 Dragon ${this.id} shooting ${projectileType} projectile`);
        
        // TODO: Create actual projectile object
        const projectileData = {
            x: spawnX,
            y: spawnY,
            velocity: projectileVelocity,
            type: projectileType,
            damage: this.damage,
            owner: this
        };
        
        // Reset shooting state after short delay
        setTimeout(() => {
            this.isShooting = false;
        }, 100);
        
        return projectileData;
    }
    
    /**
     * Get dragon bounds for collision detection
     */
    getBounds() {
        return {
            left: this.position.x - this.size,
            right: this.position.x + this.size,
            top: this.position.y - this.size,
            bottom: this.position.y + this.size,
            centerX: this.position.x,
            centerY: this.position.y,
            radius: this.size
        };
    }
    
    /**
     * Check distance to another dragon
     */
    distanceTo(otherDragon) {
        const dx = this.position.x - otherDragon.position.x;
        const dy = this.position.y - otherDragon.position.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    /**
     * Check if dragon is within a certain range of a position
     */
    isInRange(x, y, range) {
        const dx = this.position.x - x;
        const dy = this.position.y - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance <= range;
    }
    
    /**
     * Get angle to a target position
     */
    getAngleTo(targetX, targetY) {
        return Math.atan2(targetY - this.position.y, targetX - this.position.x);
    }
    
    /**
     * Cleanup dragon resources
     */
    destroy() {
        // Remove physics body
        if (this.physicsBody && this.physicsEngine) {
            this.physicsEngine.removeBody(this.physicsBody);
            this.physicsBody = null;
        }
        
        // Clear references
        this.game = null;
        this.physicsEngine = null;
        this.renderer = null;
        
        console.log(`🗑️ Dragon ${this.id} destroyed`);
    }
    
    /**
     * Get dragon state for debugging
     */
    getDebugState() {
        return {
            id: this.id,
            type: this.type,
            position: { ...this.position },
            rotation: this.rotation,
            velocity: { ...this.velocity },
            health: this.health,
            maxHealth: this.maxHealth,
            isAlive: this.isAlive,
            isMoving: this.isMoving,
            isShooting: this.isShooting,
            invulnerable: this.invulnerable
        };
    }
    
    /**
     * Generate unique dragon ID
     */
    static generateId() {
        return 'dragon_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    }
}

// Export for use in other modules
window.Dragon = Dragon; 