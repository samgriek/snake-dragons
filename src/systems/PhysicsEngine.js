/**
 * PhysicsEngine - Matter.js Physics Engine Wrapper
 * Handles all physics simulation for Snake Dragons game
 */

class PhysicsEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.engine = null;
        this.world = null;
        this.render = null;
        this.runner = null;
        
        // Physics configuration optimized for 2D dragon combat
        this.config = {
            // World settings
            gravity: { x: 0, y: 0, scale: 0 }, // Zero gravity for space-like dragon flight
            enableSleeping: false, // Keep all bodies active for fast-paced gameplay
            
            // Solver iterations (balance performance vs accuracy)
            constraintIterations: 2, // Lower for performance in fast-paced game
            positionIterations: 6, // Good balance for collision accuracy
            velocityIterations: 4, // Sufficient for projectile physics
            
            // Timing and performance
            timestep: 1000 / 60, // 60 FPS physics simulation
            timeScale: 1.0, // Normal time speed
            
            // Collision detection
            broadPhase: 'grid', // Grid broadphase for better performance with many objects
            
            // Rendering and debug
            enableDebug: false, // Set to true for physics debug rendering
            
            // Game-specific physics properties
            defaultDensity: 0.001, // Light objects for responsive movement
            defaultFriction: 0.1, // Low friction for smooth gliding
            defaultFrictionAir: 0.01, // Slight air resistance
            defaultRestitution: 0.3, // Some bounce for projectile impacts
            
            // Performance optimization
            maxBodies: 200, // Limit for performance monitoring
            maxConstraints: 50
        };
        
        // Physics bodies registry
        this.bodies = new Map();
        this.bodyIdCounter = 0;
        
        this.init();
    }
    
    /**
     * Initialize the physics engine
     */
    init() {
        console.log('🔧 Initializing Matter.js Physics Engine...');
        
        // Check if Matter.js is available
        if (typeof Matter === 'undefined') {
            console.error('❌ Matter.js is not loaded');
            return false;
        }
        
        // Create physics engine with optimized settings
        this.engine = Matter.Engine.create();
        this.world = this.engine.world;
        
        // Configure world settings
        this.engine.world.gravity = this.config.gravity;
        this.engine.enableSleeping = this.config.enableSleeping;
        
        // Configure solver iterations for performance/accuracy balance
        this.engine.constraintIterations = this.config.constraintIterations;
        this.engine.positionIterations = this.config.positionIterations;
        this.engine.velocityIterations = this.config.velocityIterations;
        
        // Configure timing
        this.engine.timing.timeScale = this.config.timeScale;
        
        // Configure broadphase collision detection
        if (this.config.broadPhase === 'grid') {
            this.engine.broadphase = Matter.Grid.create();
        }
        
        // Set world bounds for better collision optimization
        this.engine.world.bounds = {
            min: { x: -100, y: -100 },
            max: { x: this.canvas.width + 100, y: this.canvas.height + 100 }
        };
        
        // Set up collision detection
        this.setupCollisionEvents();
        
        // Create arena boundaries
        this.createArenaBoundaries();
        
        console.log('✅ Physics engine initialized');
        console.log(`📐 Arena: ${this.canvas.width}x${this.canvas.height}, Bounds: ${JSON.stringify(this.engine.world.bounds)}`);
        console.log(`⚙️ Config: Gravity(${this.config.gravity.x},${this.config.gravity.y}), Iterations(${this.config.positionIterations}/${this.config.velocityIterations})`);
        console.log(`🎯 Performance: Max bodies(${this.config.maxBodies}), Broadphase(${this.config.broadPhase || 'default'})`);
        
        // Validate world configuration
        this.validateWorldConfig();
        
        return true;
    }
    
    /**
     * Create invisible arena boundaries to contain all game objects
     */
    createArenaBoundaries() {
        const thickness = 50;
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // Create boundary walls
        const boundaries = [
            // Top wall
            Matter.Bodies.rectangle(width / 2, -thickness / 2, width, thickness, { 
                isStatic: true, 
                label: 'boundary-top' 
            }),
            // Bottom wall
            Matter.Bodies.rectangle(width / 2, height + thickness / 2, width, thickness, { 
                isStatic: true, 
                label: 'boundary-bottom' 
            }),
            // Left wall
            Matter.Bodies.rectangle(-thickness / 2, height / 2, thickness, height, { 
                isStatic: true, 
                label: 'boundary-left' 
            }),
            // Right wall
            Matter.Bodies.rectangle(width + thickness / 2, height / 2, thickness, height, { 
                isStatic: true, 
                label: 'boundary-right' 
            })
        ];
        
        // Add boundaries to world
        Matter.World.add(this.world, boundaries);
        
        console.log('🏟️ Arena boundaries created');
    }
    
    /**
     * Set up collision event handling
     */
    setupCollisionEvents() {
        // Collision start events
        Matter.Events.on(this.engine, 'collisionStart', (event) => {
            event.pairs.forEach(pair => {
                this.handleCollisionStart(pair.bodyA, pair.bodyB);
            });
        });
        
        // Collision end events
        Matter.Events.on(this.engine, 'collisionEnd', (event) => {
            event.pairs.forEach(pair => {
                this.handleCollisionEnd(pair.bodyA, pair.bodyB);
            });
        });
        
        console.log('💥 Collision detection configured');
    }
    
    /**
     * Handle collision start
     */
    handleCollisionStart(bodyA, bodyB) {
        // Emit custom collision events that game entities can listen to
        const eventData = {
            bodyA: bodyA,
            bodyB: bodyB,
            entityA: this.getEntityFromBody(bodyA),
            entityB: this.getEntityFromBody(bodyB)
        };
        
        // Dispatch collision event
        window.dispatchEvent(new CustomEvent('physicsCollisionStart', { detail: eventData }));
    }
    
    /**
     * Handle collision end
     */
    handleCollisionEnd(bodyA, bodyB) {
        const eventData = {
            bodyA: bodyA,
            bodyB: bodyB,
            entityA: this.getEntityFromBody(bodyA),
            entityB: this.getEntityFromBody(bodyB)
        };
        
        window.dispatchEvent(new CustomEvent('physicsCollisionEnd', { detail: eventData }));
    }
    
    /**
     * Create a circular physics body (for dragons and projectiles)
     */
    createCircleBody(x, y, radius, options = {}) {
        const defaultOptions = {
            density: this.config.defaultDensity,
            frictionAir: this.config.defaultFrictionAir,
            restitution: this.config.defaultRestitution,
            friction: this.config.defaultFriction
        };
        
        const body = Matter.Bodies.circle(x, y, radius, { ...defaultOptions, ...options });
        
        // Generate unique ID and register body
        const bodyId = `body_${++this.bodyIdCounter}`;
        body.gameId = bodyId;
        this.bodies.set(bodyId, body);
        
        return body;
    }
    
    /**
     * Create a rectangular physics body (for obstacles)
     */
    createRectangleBody(x, y, width, height, options = {}) {
        const defaultOptions = {
            density: this.config.defaultDensity,
            frictionAir: this.config.defaultFrictionAir,
            restitution: this.config.defaultRestitution,
            friction: this.config.defaultFriction
        };
        
        const body = Matter.Bodies.rectangle(x, y, width, height, { ...defaultOptions, ...options });
        
        // Generate unique ID and register body
        const bodyId = `body_${++this.bodyIdCounter}`;
        body.gameId = bodyId;
        this.bodies.set(bodyId, body);
        
        return body;
    }
    
    /**
     * Add a body to the physics world with performance monitoring
     */
    addBody(body, entity = null) {
        // Check performance limits
        if (this.world.bodies.length >= this.config.maxBodies) {
            console.warn(`⚠️ Physics world has ${this.world.bodies.length} bodies (max: ${this.config.maxBodies})`);
        }
        
        Matter.World.add(this.world, body);
        
        // Link entity to body for collision handling
        if (entity) {
            body.gameEntity = entity;
        }
        
        return body;
    }
    
    /**
     * Remove a body from the physics world
     */
    removeBody(body) {
        if (body.gameId) {
            this.bodies.delete(body.gameId);
        }
        Matter.World.remove(this.world, body);
    }
    
    /**
     * Get game entity associated with a physics body
     */
    getEntityFromBody(body) {
        return body.gameEntity || null;
    }
    
    /**
     * Apply force to a body
     */
    applyForce(body, force) {
        Matter.Body.applyForce(body, body.position, force);
    }
    
    /**
     * Set body velocity
     */
    setVelocity(body, velocity) {
        Matter.Body.setVelocity(body, velocity);
    }
    
    /**
     * Set body position
     */
    setPosition(body, position) {
        Matter.Body.setPosition(body, position);
    }
    
    /**
     * Set body rotation
     */
    setAngle(body, angle) {
        Matter.Body.setAngle(body, angle);
    }

    /**
     * Set body angular velocity
     */
    setAngularVelocity(body, angularVelocity) {
        Matter.Body.setAngularVelocity(body, angularVelocity);
    }

    /**
     * Update physics simulation with performance monitoring
     */
    update(deltaTime) {
        if (!this.engine) return;
        
        // Run physics simulation
        Matter.Engine.update(this.engine, deltaTime * 1000);
        
        // Periodic performance monitoring (every 5 seconds)
        if (!this.lastPerfCheck) this.lastPerfCheck = 0;
        this.lastPerfCheck += deltaTime;
        
        if (this.lastPerfCheck >= 5.0) {
            this.performanceCheck();
            this.lastPerfCheck = 0;
        }
    }
    
    /**
     * Perform periodic performance check
     */
    performanceCheck() {
        const bodyCount = this.world.bodies.length;
        const utilizationPercent = (bodyCount / this.config.maxBodies) * 100;
        
        if (utilizationPercent > 80) {
            console.warn(`⚠️ High physics load: ${bodyCount}/${this.config.maxBodies} bodies (${utilizationPercent.toFixed(1)}%)`);
        }
        
        // Check for sleeping bodies if enabled
        if (this.config.enableSleeping) {
            const sleepingBodies = this.world.bodies.filter(body => body.isSleeping).length;
            if (sleepingBodies > 0) {
                console.log(`💤 Sleeping bodies: ${sleepingBodies}/${bodyCount}`);
            }
        }
    }
    
    /**
     * Adjust physics settings at runtime
     */
    adjustPhysicsSettings(newSettings) {
        if (newSettings.timeScale !== undefined) {
            this.engine.timing.timeScale = newSettings.timeScale;
            this.config.timeScale = newSettings.timeScale;
        }
        
        if (newSettings.positionIterations !== undefined) {
            this.engine.positionIterations = newSettings.positionIterations;
            this.config.positionIterations = newSettings.positionIterations;
        }
        
        if (newSettings.velocityIterations !== undefined) {
            this.engine.velocityIterations = newSettings.velocityIterations;
            this.config.velocityIterations = newSettings.velocityIterations;
        }
        
        console.log('🔧 Physics settings adjusted:', newSettings);
        this.validateWorldConfig();
    }
    
    /**
     * Enable debug rendering (for development)
     */
    enableDebugRender(canvas) {
        if (this.render) return;
        
        this.render = Matter.Render.create({
            canvas: canvas,
            engine: this.engine,
            options: {
                width: canvas.width,
                height: canvas.height,
                wireframes: false,
                background: 'transparent',
                showAngleIndicator: true,
                showVelocity: true,
                showCollisions: true,
                showSeparations: false,
                showAxes: false,
                showPositions: false,
                showConvexHulls: false,
                showIds: true,
                showShadows: false,
                showVertexNumbers: false,
                showBroadphase: false
            }
        });
        
        Matter.Render.run(this.render);
        console.log('🐛 Physics debug rendering enabled');
    }
    
    /**
     * Disable debug rendering
     */
    disableDebugRender() {
        if (this.render) {
            Matter.Render.stop(this.render);
            this.render = null;
            console.log('🐛 Physics debug rendering disabled');
        }
    }
    
    /**
     * Get comprehensive physics statistics
     */
    getStats() {
        const stats = {
            // World composition
            bodies: this.world.bodies.length,
            constraints: this.world.constraints.length,
            composites: this.world.composites.length,
            registeredBodies: this.bodies.size,
            
            // Performance metrics
            maxBodies: this.config.maxBodies,
            bodyUtilization: ((this.world.bodies.length / this.config.maxBodies) * 100).toFixed(1) + '%',
            
            // Engine configuration
            gravity: this.engine.world.gravity,
            timeScale: this.engine.timing.timeScale,
            iterations: {
                constraint: this.engine.constraintIterations,
                position: this.engine.positionIterations,
                velocity: this.engine.velocityIterations
            },
            
            // World bounds
            bounds: this.engine.world.bounds
        };
        
        return stats;
    }
    
    /**
     * Validate physics world configuration
     */
    validateWorldConfig() {
        const issues = [];
        
        // Check gravity configuration
        const gravity = this.engine.world.gravity;
        if (gravity.x !== 0 || gravity.y !== 0 || gravity.scale !== 0) {
            issues.push('Warning: Gravity is not zero - may affect top-down dragon flight');
        }
        
        // Check body count
        if (this.world.bodies.length > this.config.maxBodies * 0.8) {
            issues.push(`Warning: High body count (${this.world.bodies.length}/${this.config.maxBodies})`);
        }
        
        // Check solver iterations
        if (this.engine.positionIterations < 4) {
            issues.push('Warning: Low position iterations may cause collision instability');
        }
        
        // Check time scale
        if (this.engine.timing.timeScale !== 1.0) {
            issues.push(`Info: Time scale is ${this.engine.timing.timeScale} (not normal speed)`);
        }
        
        if (issues.length > 0) {
            console.group('🔧 Physics World Validation');
            issues.forEach(issue => console.log(issue));
            console.groupEnd();
        }
        
        return issues.length === 0;
    }
    
    /**
     * Clean up physics engine
     */
    destroy() {
        if (this.render) {
            this.disableDebugRender();
        }
        
        if (this.engine) {
            Matter.World.clear(this.world);
            Matter.Engine.clear(this.engine);
            this.engine = null;
            this.world = null;
        }
        
        this.bodies.clear();
        console.log('🔧 Physics engine destroyed');
    }
}

// Export for use in other modules
window.PhysicsEngine = PhysicsEngine; 