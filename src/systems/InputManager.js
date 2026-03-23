class InputManager {
  constructor() {
    this.keys = {};
    this.keyMap = {
      // Movement
      KeyI: 'move-forward',
      KeyK: 'move-backward',
      KeyJ: 'move-left',
      KeyL: 'move-right',
      // Rotation
      KeyA: 'rotate-left',
      KeyS: 'rotate-right',
      // Firing
      KeyF: 'fire-regular',
      KeyD: 'fire-exploding'
    };
    this._initListeners();
  }

  _initListeners() {
    window.addEventListener('keydown', (e) => this._handleKeyDown(e));
    window.addEventListener('keyup', (e) => this._handleKeyUp(e));
  }

  _handleKeyDown(e) {
    const key = this.keyMap[e.code];
    if (key) {
      this.keys[key] = true;
    }
  }

  _handleKeyUp(e) {
    const key = this.keyMap[e.code];
    if (key) {
      this.keys[key] = false;
    }
  }

  isPressed(action) {
    return this.keys[action] || false;
  }

  destroy() {
    window.removeEventListener('keydown', (e) => this._handleKeyDown(e));
    window.removeEventListener('keyup', (e) => this._handleKeyUp(e));
  }
}

// Export for use in other modules
window.InputManager = InputManager; 