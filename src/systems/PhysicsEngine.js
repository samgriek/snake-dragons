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
        
        // Physics configuration
        this.config = {
            gravity: { x: 0, y: 0, scale: 0 }, // No gravity for top-down dragon flight
            enableSleeping: false, // Keep all bodies active for fast-paced gameplay
            constraintIterations: 2, // Lower iterations for better performance
            positionIterations: 6,
            velocityIterations: 4,
            timestep: 1000 / 60, // 60 FPS physics simulation
            enableDebug: false // Set to true for physics debug rendering
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
        
        // Create physics engine
        this.engine = Matter.Engine.create();
        this.world = this.engine.world;
        
        // Configure engine settings
        this.engine.world.gravity = this.config.gravity;
        this.engine.enableSleeping = this.config.enableSleeping;
        this.engine.constraintIterations = this.config.constraintIterations;
        this.engine.positionIterations = this.config.positionIterations;
        this.engine.velocityIterations = this.config.velocityIterations;
        this.engine.timing.timeScale = 1;
        
        // Set up collision detection
        this.setupCollisionEvents();
        
        // Create arena boundaries
        this.createArenaBoundaries();
        
        console.log('✅ Physics engine initialized');
        console.log(`📐 Arena size: ${this.canvas.width}x${this.canvas.height}`);
        
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
            density: 0.001,
            frictionAir: 0.01,
            restitution: 0.3,
            friction: 0.1
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
            density: 0.001,
            frictionAir: 0.01,
            restitution: 0.3,
            friction: 0.1
        };
        
        const body = Matter.Bodies.rectangle(x, y, width, height, { ...defaultOptions, ...options });
        
        // Generate unique ID and register body
        const bodyId = `body_${++this.bodyIdCounter}`;
        body.gameId = bodyId;
        this.bodies.set(bodyId, body);
        
        return body;
    }
    
    /**
     * Add a body to the physics world
     */
    addBody(body, entity = null) {
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
     * Update physics simulation
     */
    update(deltaTime) {
        if (!this.engine) return;
        
        // Run physics simulation
        Matter.Engine.update(this.engine, deltaTime * 1000);
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
     * Get physics statistics
     */
    getStats() {
        return {
            bodies: this.world.bodies.length,
            constraints: this.world.constraints.length,
            composites: this.world.composites.length,
            registeredBodies: this.bodies.size
        };
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