/**
 * Projectile - Base class for all projectiles (fireballs, exploding projectiles)
 * Handles physics, collision detection, and lifecycle management
 */

class Projectile {
    constructor(options = {}) {
        // Core identity
        this.id = Projectile.generateId();
        this.type = options.type || 'normal'; // 'normal', 'exploding'
        this.owner = options.owner || null; // Dragon that fired this projectile
        
        // Position and spatial properties
        this.position = {
            x: options.x || 0,
            y: options.y || 0
        };
        this.velocity = {
            x: options.velocity?.x || 0,
            y: options.velocity?.y || 0
        };
        this.rotation = options.rotation || 0; // Radians
        
        // Physics properties
        this.physicsBody = null;
        this.size = options.size || 8; // Projectile radius
        this.speed = options.speed || 300; // Pixels per second
        this.lifetime = options.lifetime || 3.0; // Seconds before auto-destruction
        this.age = 0; // Current age in seconds
        
        // Combat properties
        this.damage = options.damage || 25;
        this.penetration = options.penetration || 1; // How many targets it can hit
        this.hitsRemaining = this.penetration;
        
        // Visual properties
        this.color = options.color || '#ff6b35'; // Orange fireball
        this.trailColor = options.trailColor || '#ff8c42';
        this.trailLength = options.trailLength || 5;
        this.trailPositions = []; // For visual trail effect
        
        // State tracking
        this.isActive = true;
        this.isDead = false;
        this.hasHit = false;
        
        // Game references (set externally)
        this.game = null;
        this.physicsEngine = null;
        this.renderer = null;
        
        // Debug and development
        this.showDebugInfo = options.debug || false;
        this.debugColor = options.debugColor || 'yellow';
        
        console.log(`🔥 Projectile created: ${this.type} (ID: ${this.id}) at (${this.position.x}, ${this.position.y})`);
    }
    
    /**
     * Initialize projectile with game systems
     */
    init(game, physicsEngine, renderer) {
        this.game = game;
        this.physicsEngine = physicsEngine;
        this.renderer = renderer;
        
        // Create physics body
        this.createPhysicsBody();
        
        console.log(`✅ Projectile ${this.id} initialized with game systems`);
    }
    
    /**
     * Create physics body for the projectile
     */
    createPhysicsBody() {
        if (!this.physicsEngine) {
            console.warn('⚠️ Cannot create physics body: physicsEngine not available');
            return;
        }
        
        // Create circular body for projectile
        const bodyOptions = {
            density: 0.001, // Very light for fast movement
            friction: 0.0, // No friction for smooth flight
            frictionAir: 0.0, // No air resistance
            restitution: 0.0, // No bounce
            isSensor: true, // Sensor body for collision detection without physical interaction
            
            // Custom properties for identification
            projectileId: this.id,
            projectileType: this.type,
            ownerId: this.owner?.id || null
        };
        
        this.physicsBody = this.physicsEngine.createCircleBody(
            this.position.x,
            this.position.y,
            this.size,
            bodyOptions
        );
        
        if (this.physicsBody) {
            // Add the body to the physics world
            this.physicsEngine.addBody(this.physicsBody, this);
            
            // Set initial velocity
            this.physicsEngine.setVelocity(this.physicsBody, this.velocity);
            
            console.log(`🔵 Physics body created for projectile ${this.id}: radius ${this.size}`);
        }
    }
    
    /**
     * Update projectile logic (called every frame)
     */
    update(deltaTime) {
        if (!this.isActive || this.isDead) return;
        
        this.age += deltaTime;
        
        // Check lifetime
        if (this.age >= this.lifetime) {
            this.destroy();
            return;
        }
        
        // Update physics
        this.updatePhysics(deltaTime);
        
        // Update trail
        this.updateTrail();
        
        // Update visual effects
        this.updateVisualEffects(deltaTime);
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
        
        // Get rotation from velocity direction
        this.rotation = Math.atan2(this.velocity.y, this.velocity.x);
    }
    
    /**
     * Update trail positions for visual effect
     */
    updateTrail() {
        // Add current position to trail
        this.trailPositions.push({
            x: this.position.x,
            y: this.position.y,
            age: 0
        });
        
        // Remove old trail positions
        while (this.trailPositions.length > this.trailLength) {
            this.trailPositions.shift();
        }
        
        // Age trail positions
        for (const trailPos of this.trailPositions) {
            trailPos.age += 0.016; // Approximate frame time
        }
    }
    
    /**
     * Update visual effects (override in subclasses)
     */
    updateVisualEffects(deltaTime) {
        // Base class has no special effects
    }
    
    /**
     * Render the projectile
     */
    render(renderer) {
        if (!this.isActive || this.isDead) return;
        
        // Render trail
        this.renderTrail(renderer);
        
        // Render projectile body
        this.renderBody(renderer);
        
        // Render debug info if enabled
        if (this.showDebugInfo) {
            this.renderDebugInfo(renderer);
        }
    }
    
    /**
     * Render projectile trail
     */
    renderTrail(renderer) {
        if (this.trailPositions.length < 2) return;
        
        const ctx = renderer.ctx;
        ctx.save();
        
        // Create gradient trail effect
        for (let i = 0; i < this.trailPositions.length - 1; i++) {
            const current = this.trailPositions[i];
            const next = this.trailPositions[i + 1];
            
            // Calculate alpha based on age
            const alpha = Math.max(0, 1 - current.age / 0.5);
            const size = this.size * (0.5 + 0.5 * alpha);
            
            ctx.globalAlpha = alpha * 0.6;
            ctx.fillStyle = this.trailColor;
            ctx.beginPath();
            ctx.arc(current.x, current.y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
    
    /**
     * Render projectile body
     */
    renderBody(renderer) {
        const ctx = renderer.ctx;
        ctx.save();
        
        // Transform to projectile position and rotation
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(this.rotation);
        
        // Draw projectile body
        ctx.fillStyle = this.color;
        ctx.strokeStyle = '#ff4500';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Draw projectile tip (direction indicator)
        ctx.fillStyle = '#ff4500';
        ctx.beginPath();
        ctx.arc(this.size * 0.7, 0, this.size * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    /**
     * Render debug information
     */
    renderDebugInfo(renderer) {
        const ctx = renderer.ctx;
        ctx.save();
        
        ctx.fillStyle = this.debugColor;
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        
        const debugText = [
            `ID: ${this.id}`,
            `Type: ${this.type}`,
            `Age: ${this.age.toFixed(2)}s`,
            `Speed: ${Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y).toFixed(0)}px/s`,
            `Hits: ${this.hitsRemaining}`
        ];
        
        let yOffset = -30;
        for (const text of debugText) {
            ctx.fillText(text, this.position.x, this.position.y + yOffset);
            yOffset += 12;
        }
        
        ctx.restore();
    }
    
    /**
     * Handle collision with another entity
     */
    onCollision(otherEntity) {
        if (this.hasHit || this.isDead) return;
        
        // Don't hit the owner
        if (otherEntity && otherEntity.id === this.owner?.id) return;
        
        // Don't hit other projectiles
        if (otherEntity && otherEntity.constructor === Projectile) return;
        
        console.log(`💥 Projectile ${this.id} hit ${otherEntity?.constructor?.name || 'unknown'} ${otherEntity?.id || 'unknown'}`);
        
        // Apply damage if it's a dragon
        if (otherEntity && otherEntity.takeDamage) {
            otherEntity.takeDamage(this.damage, this);
        }
        
        // Reduce hits remaining
        this.hitsRemaining--;
        
        if (this.hitsRemaining <= 0) {
            this.hasHit = true;
            this.destroy();
        }
    }
    
    /**
     * Destroy the projectile
     */
    destroy() {
        if (this.isDead) return;
        
        this.isDead = true;
        this.isActive = false;
        
        // Remove physics body
        if (this.physicsBody && this.physicsEngine) {
            this.physicsEngine.removeBody(this.physicsBody);
            this.physicsBody = null;
        }
        
        // Clear references
        this.game = null;
        this.physicsEngine = null;
        this.renderer = null;
        this.owner = null;
        
        console.log(`💀 Projectile ${this.id} destroyed`);
    }
    
    /**
     * Get projectile bounds for collision detection
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
     * Check if projectile is out of bounds
     */
    isOutOfBounds(arenaWidth, arenaHeight) {
        return this.position.x < -50 || 
               this.position.x > arenaWidth + 50 || 
               this.position.y < -50 || 
               this.position.y > arenaHeight + 50;
    }
    
    /**
     * Get debug state for development
     */
    getDebugState() {
        return {
            id: this.id,
            type: this.type,
            position: { ...this.position },
            velocity: { ...this.velocity },
            age: this.age,
            lifetime: this.lifetime,
            hitsRemaining: this.hitsRemaining,
            isActive: this.isActive,
            isDead: this.isDead,
            hasHit: this.hasHit
        };
    }
    
    /**
     * Generate unique projectile ID
     */
    static generateId() {
        return `projectile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

/**
 * ExplodingProjectile - Special projectile that explodes on impact
 */
class ExplodingProjectile extends Projectile {
    constructor(options = {}) {
        super({
            ...options,
            type: 'exploding',
            color: '#ff0000', // Red for exploding projectiles
            trailColor: '#ff6666',
            damage: (options.damage || 25) * 2, // Double damage
            size: (options.size || 8) * 1.2, // Slightly larger
            lifetime: (options.lifetime || 3.0) * 0.8, // Shorter lifetime
            explosionRadius: options.explosionRadius || 60,
            explosionDamage: options.explosionDamage || 15
        });
        
        this.explosionRadius = options.explosionRadius || 60;
        this.explosionDamage = options.explosionDamage || 15;
        this.explosionForce = options.explosionForce || 500;
        this.hasExploded = false;
    }
    
    /**
     * Handle collision with explosion effect
     */
    onCollision(otherEntity) {
        if (this.hasExploded || this.isDead) return;
        
        // Don't hit the owner
        if (otherEntity && otherEntity.id === this.owner?.id) return;
        
        // Don't hit other projectiles
        if (otherEntity && otherEntity.constructor === Projectile) return;
        
        console.log(`💥💥 Exploding projectile ${this.id} hit ${otherEntity?.constructor?.name || 'unknown'} ${otherEntity?.id || 'unknown'}`);
        
        // Apply direct damage
        if (otherEntity && otherEntity.takeDamage) {
            otherEntity.takeDamage(this.damage, this);
        }
        
        // Trigger explosion
        this.explode();
    }
    
    /**
     * Create explosion effect
     */
    explode() {
        if (this.hasExploded) return;
        
        this.hasExploded = true;
        
        console.log(`💥💥💥 Explosion at (${this.position.x}, ${this.position.y}) with radius ${this.explosionRadius}`);
        
        // Apply explosion damage to nearby entities
        if (this.game && this.game.dragons) {
            for (const dragon of this.game.dragons) {
                if (dragon.isAlive && dragon.id !== this.owner?.id) {
                    const distance = this.distanceTo(dragon);
                    if (distance <= this.explosionRadius) {
                        // Calculate damage based on distance (more damage closer to center)
                        const damageMultiplier = 1 - (distance / this.explosionRadius);
                        const explosionDamage = this.explosionDamage * damageMultiplier;
                        
                        dragon.takeDamage(explosionDamage, this);
                        
                        // Apply explosion force
                        if (dragon.physicsBody && this.physicsEngine) {
                            const forceDirection = {
                                x: dragon.position.x - this.position.x,
                                y: dragon.position.y - this.position.y
                            };
                            
                            // Normalize and apply force
                            const distance = Math.sqrt(forceDirection.x * forceDirection.x + forceDirection.y * forceDirection.y);
                            if (distance > 0) {
                                const force = this.explosionForce * (1 - distance / this.explosionRadius);
                                forceDirection.x = (forceDirection.x / distance) * force;
                                forceDirection.y = (forceDirection.y / distance) * force;
                                
                                this.physicsEngine.applyForce(dragon.physicsBody, forceDirection);
                            }
                        }
                    }
                }
            }
        }
        
        // TODO: Add explosion visual effects (particles, screen shake, etc.)
        
        this.destroy();
    }
    
    /**
     * Calculate distance to another entity
     */
    distanceTo(entity) {
        const dx = this.position.x - entity.position.x;
        const dy = this.position.y - entity.position.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    /**
     * Override render to show explosion charge effect
     */
    renderBody(renderer) {
        const ctx = renderer.ctx;
        ctx.save();
        
        // Transform to projectile position and rotation
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(this.rotation);
        
        // Draw explosion charge effect (pulsing)
        const pulseScale = 1 + 0.2 * Math.sin(this.age * 10);
        
        ctx.fillStyle = this.color;
        ctx.strokeStyle = '#ff4500';
        ctx.lineWidth = 3;
        
        ctx.beginPath();
        ctx.arc(0, 0, this.size * pulseScale, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Draw inner core
        ctx.fillStyle = '#ff4500';
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 0.6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}

// Export for use in other modules
window.ExplodingProjectile = ExplodingProjectile;