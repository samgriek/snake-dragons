/**
 * Renderer - Canvas Rendering System with Viewport Management
 * Handles all visual rendering for Snake Dragons game with camera controls
 */

class Renderer {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // Rendering configuration
        this.config = {
            // Canvas properties
            width: canvas.width,
            height: canvas.height,
            pixelRatio: window.devicePixelRatio || 1,
            
            // Viewport and camera
            viewport: {
                x: 0,
                y: 0,
                width: canvas.width,
                height: canvas.height,
                zoom: 1.0,
                minZoom: 0.5,
                maxZoom: 3.0
            },
            
            // Camera follow settings
            camera: {
                followTarget: null,
                followSpeed: 0.1,
                deadZone: {
                    width: 100,
                    height: 100
                },
                bounds: {
                    min: { x: -200, y: -200 },
                    max: { x: 1000, y: 800 }
                }
            },
            
            // Rendering options
            background: '#1e3a5f',
            smoothing: true,
            showDebugInfo: false,
            showBounds: false,
            showVelocities: false,
            showCollisions: false,
            
            // Performance settings
            cullingEnabled: true,
            cullingMargin: 50
        };
        
        // Apply user options
        this.applyOptions(options);
        
        // Initialize rendering state
        this.lastRenderTime = 0;
        this.renderStats = {
            objectsRendered: 0,
            objectsCulled: 0,
            renderTime: 0
        };
        
        this.init();
    }
    
    /**
     * Initialize the renderer
     */
    init() {
        console.log('🎨 Initializing Canvas Renderer...');
        
        // Set up high DPI support
        this.setupHighDPI();
        
        // Configure canvas context
        this.setupCanvasContext();
        
        // Initialize viewport
        this.setupViewport();
        
        console.log('✅ Renderer initialized');
        console.log(`📐 Canvas: ${this.config.width}x${this.config.height}, Pixel Ratio: ${this.config.pixelRatio}`);
        console.log(`📹 Viewport: ${this.config.viewport.width}x${this.config.viewport.height}, Zoom: ${this.config.viewport.zoom}`);
    }
    
    /**
     * Set up high DPI display support
     */
    setupHighDPI() {
        const ratio = this.config.pixelRatio;
        
        if (ratio > 1) {
            // Scale canvas for high DPI
            this.canvas.width = this.config.width * ratio;
            this.canvas.height = this.config.height * ratio;
            this.canvas.style.width = this.config.width + 'px';
            this.canvas.style.height = this.config.height + 'px';
            
            // Scale context to match
            this.ctx.scale(ratio, ratio);
            
            console.log(`🖥️ High DPI scaling: ${ratio}x`);
        }
    }
    
    /**
     * Configure canvas context settings
     */
    setupCanvasContext() {
        // Image smoothing
        this.ctx.imageSmoothingEnabled = this.config.smoothing;
        this.ctx.imageSmoothingQuality = 'high';
        
        // Text rendering
        this.ctx.textBaseline = 'top';
        this.ctx.font = '12px Arial';
        
        // Line rendering
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
    }
    
    /**
     * Set up viewport system
     */
    setupViewport() {
        // Center viewport on arena
        this.config.viewport.x = this.config.width / 2;
        this.config.viewport.y = this.config.height / 2;
    }
    
    /**
     * Apply configuration options
     */
    applyOptions(options) {
        if (options.viewport) {
            Object.assign(this.config.viewport, options.viewport);
        }
        if (options.camera) {
            Object.assign(this.config.camera, options.camera);
        }
        Object.assign(this.config, options);
    }
    
    /**
     * Clear the canvas with background
     */
    clear() {
        // Clear entire canvas
        this.ctx.clearRect(0, 0, this.config.width, this.config.height);
        
        // Fill with background color
        this.ctx.fillStyle = this.config.background;
        this.ctx.fillRect(0, 0, this.config.width, this.config.height);
    }
    
    /**
     * Begin rendering frame
     */
    beginFrame() {
        this.renderStats.objectsRendered = 0;
        this.renderStats.objectsCulled = 0;
        this.lastRenderTime = performance.now();
        
        // Clear canvas
        this.clear();
        
        // Apply viewport transformation
        this.applyViewportTransform();
    }
    
    /**
     * End rendering frame
     */
    endFrame() {
        // Restore transformation
        this.restoreViewportTransform();
        
        // Calculate render stats
        this.renderStats.renderTime = performance.now() - this.lastRenderTime;
        
        // Render debug information
        if (this.config.showDebugInfo) {
            this.renderDebugOverlay();
        }
    }
    
    /**
     * Apply viewport transformation matrix
     */
    applyViewportTransform() {
        this.ctx.save();
        
        // Translate to viewport center
        this.ctx.translate(this.config.width / 2, this.config.height / 2);
        
        // Apply zoom
        this.ctx.scale(this.config.viewport.zoom, this.config.viewport.zoom);
        
        // Translate by camera position (negative to move world)
        this.ctx.translate(-this.config.viewport.x, -this.config.viewport.y);
    }
    
    /**
     * Restore viewport transformation
     */
    restoreViewportTransform() {
        this.ctx.restore();
    }
    
    /**
     * Update camera system
     */
    updateCamera(deltaTime) {
        if (!this.config.camera.followTarget) return;
        
        const target = this.config.camera.followTarget;
        const camera = this.config.camera;
        const viewport = this.config.viewport;
        
        // Calculate target position
        const targetX = target.x || target.position?.x || 0;
        const targetY = target.y || target.position?.y || 0;
        
        // Check if target is outside dead zone
        const deadZoneLeft = viewport.x - camera.deadZone.width / 2;
        const deadZoneRight = viewport.x + camera.deadZone.width / 2;
        const deadZoneTop = viewport.y - camera.deadZone.height / 2;
        const deadZoneBottom = viewport.y + camera.deadZone.height / 2;
        
        let newX = viewport.x;
        let newY = viewport.y;
        
        // Move camera if target is outside dead zone
        if (targetX < deadZoneLeft) {
            newX = targetX + camera.deadZone.width / 2;
        } else if (targetX > deadZoneRight) {
            newX = targetX - camera.deadZone.width / 2;
        }
        
        if (targetY < deadZoneTop) {
            newY = targetY + camera.deadZone.height / 2;
        } else if (targetY > deadZoneBottom) {
            newY = targetY - camera.deadZone.height / 2;
        }
        
        // Smooth camera movement
        const followSpeed = camera.followSpeed;
        viewport.x += (newX - viewport.x) * followSpeed;
        viewport.y += (newY - viewport.y) * followSpeed;
        
        // Apply camera bounds
        viewport.x = Math.max(camera.bounds.min.x, Math.min(camera.bounds.max.x, viewport.x));
        viewport.y = Math.max(camera.bounds.min.y, Math.min(camera.bounds.max.y, viewport.y));
    }
    
    /**
     * Set camera follow target
     */
    setCameraTarget(target) {
        this.config.camera.followTarget = target;
    }
    
    /**
     * Set viewport zoom
     */
    setZoom(zoom) {
        this.config.viewport.zoom = Math.max(
            this.config.viewport.minZoom,
            Math.min(this.config.viewport.maxZoom, zoom)
        );
    }
    
    /**
     * Convert screen coordinates to world coordinates
     */
    screenToWorld(screenX, screenY) {
        const viewport = this.config.viewport;
        
        // Account for canvas center offset
        const canvasCenterX = this.config.width / 2;
        const canvasCenterY = this.config.height / 2;
        
        // Convert to world coordinates
        const worldX = (screenX - canvasCenterX) / viewport.zoom + viewport.x;
        const worldY = (screenY - canvasCenterY) / viewport.zoom + viewport.y;
        
        return { x: worldX, y: worldY };
    }
    
    /**
     * Convert world coordinates to screen coordinates
     */
    worldToScreen(worldX, worldY) {
        const viewport = this.config.viewport;
        
        // Convert to screen coordinates
        const screenX = (worldX - viewport.x) * viewport.zoom + this.config.width / 2;
        const screenY = (worldY - viewport.y) * viewport.zoom + this.config.height / 2;
        
        return { x: screenX, y: screenY };
    }
    
    /**
     * Check if object is visible in viewport (culling)
     */
    isVisible(x, y, width = 0, height = 0) {
        if (!this.config.cullingEnabled) return true;
        
        const viewport = this.config.viewport;
        const margin = this.config.cullingMargin;
        
        // Calculate viewport bounds in world coordinates
        const viewLeft = viewport.x - (this.config.width / 2) / viewport.zoom - margin;
        const viewRight = viewport.x + (this.config.width / 2) / viewport.zoom + margin;
        const viewTop = viewport.y - (this.config.height / 2) / viewport.zoom - margin;
        const viewBottom = viewport.y + (this.config.height / 2) / viewport.zoom + margin;
        
        // Check if object overlaps viewport
        return !(x + width < viewLeft || x - width > viewRight || 
                y + height < viewTop || y - height > viewBottom);
    }
    
    /**
     * Render a circle (for dragons and projectiles)
     */
    renderCircle(x, y, radius, color = 'white', filled = true) {
        if (!this.isVisible(x, y, radius * 2, radius * 2)) {
            this.renderStats.objectsCulled++;
            return;
        }
        
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        
        if (filled) {
            this.ctx.fillStyle = color;
            this.ctx.fill();
        } else {
            this.ctx.strokeStyle = color;
            this.ctx.stroke();
        }
        
        this.renderStats.objectsRendered++;
    }
    
    /**
     * Render a rectangle (for obstacles)
     */
    renderRectangle(x, y, width, height, color = 'white', filled = true) {
        if (!this.isVisible(x, y, width, height)) {
            this.renderStats.objectsCulled++;
            return;
        }
        
        if (filled) {
            this.ctx.fillStyle = color;
            this.ctx.fillRect(x - width/2, y - height/2, width, height);
        } else {
            this.ctx.strokeStyle = color;
            this.ctx.strokeRect(x - width/2, y - height/2, width, height);
        }
        
        this.renderStats.objectsRendered++;
    }
    
    /**
     * Render text
     */
    renderText(text, x, y, color = 'white', font = '12px Arial') {
        if (!this.isVisible(x, y, 100, 20)) {
            this.renderStats.objectsCulled++;
            return;
        }
        
        this.ctx.fillStyle = color;
        this.ctx.font = font;
        this.ctx.fillText(text, x, y);
        
        this.renderStats.objectsRendered++;
    }
    
    /**
     * Render debug overlay (in screen space)
     */
    renderDebugOverlay() {
        // This renders in screen space (after restoreViewportTransform)
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(10, 10, 250, 120);
        
        this.ctx.fillStyle = 'lime';
        this.ctx.font = '12px Arial';
        
        let y = 25;
        this.ctx.fillText(`Viewport: ${this.config.viewport.x.toFixed(1)}, ${this.config.viewport.y.toFixed(1)}`, 15, y);
        y += 15;
        this.ctx.fillText(`Zoom: ${this.config.viewport.zoom.toFixed(2)}x`, 15, y);
        y += 15;
        this.ctx.fillText(`Objects Rendered: ${this.renderStats.objectsRendered}`, 15, y);
        y += 15;
        this.ctx.fillText(`Objects Culled: ${this.renderStats.objectsCulled}`, 15, y);
        y += 15;
        this.ctx.fillText(`Render Time: ${this.renderStats.renderTime.toFixed(2)}ms`, 15, y);
        y += 15;
        
        if (this.config.camera.followTarget) {
            const target = this.config.camera.followTarget;
            const targetX = target.x || target.position?.x || 0;
            const targetY = target.y || target.position?.y || 0;
            this.ctx.fillText(`Camera Target: ${targetX.toFixed(1)}, ${targetY.toFixed(1)}`, 15, y);
        }
    }
    
    /**
     * Get rendering statistics
     */
    getStats() {
        return {
            ...this.renderStats,
            viewport: { ...this.config.viewport },
            camera: { ...this.config.camera },
            canvas: {
                width: this.config.width,
                height: this.config.height,
                pixelRatio: this.config.pixelRatio
            }
        };
    }
    
    /**
     * Resize canvas and update viewport
     */
    resize(width, height) {
        this.config.width = width;
        this.config.height = height;
        this.config.viewport.width = width;
        this.config.viewport.height = height;
        
        // Update canvas size
        this.canvas.width = width * this.config.pixelRatio;
        this.canvas.height = height * this.config.pixelRatio;
        this.canvas.style.width = width + 'px';
        this.canvas.style.height = height + 'px';
        
        // Reapply scaling
        this.ctx.scale(this.config.pixelRatio, this.config.pixelRatio);
        
        // Reconfigure context
        this.setupCanvasContext();
        
        console.log(`📐 Canvas resized to: ${width}x${height}`);
    }
    
    /**
     * Clean up renderer
     */
    destroy() {
        // Clear any references
        this.config.camera.followTarget = null;
        console.log('🎨 Renderer destroyed');
    }
}

// Export for use in other modules
window.Renderer = Renderer; 