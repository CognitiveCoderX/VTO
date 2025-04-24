/**
 * SceneManager.js
 * Handles the 3D scene setup, rendering, and management
 */

import * as THREE from 'three';

class SceneManager {
  constructor() {
    // Three.js components
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    
    // Lighting
    this.ambientLight = null;
    this.directionalLight = null;
    this.fillLight = null;
    
    // Canvas and container references
    this.canvas = null;
    this.container = null;
    
    // Animation
    this.animationFrameId = null;
    this.clock = new THREE.Clock();
    this.isAnimating = false;
    
    // Render callback
    this.onRenderCallback = null;
    
    // Track initialization state
    this.isInitialized = false;
    
    // Bind methods
    this.animate = this.animate.bind(this);
    this.onWindowResize = this.onWindowResize.bind(this);
  }

  /**
   * Initialize the 3D scene
   * @param {HTMLCanvasElement} canvas - Canvas element for rendering
   * @param {HTMLElement} container - Container element for sizing
   * @param {Function} onRender - Callback function called on each render
   */
  initialize(canvas, container, onRender = null) {
    this.canvas = canvas;
    this.container = container;
    this.onRenderCallback = onRender;
    
    // Create scene
    this.scene = new THREE.Scene();
    
    // Create camera
    const width = container.clientWidth;
    const height = container.clientHeight;
    const aspect = width / height;
    
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    this.camera.position.set(0, 0, 2);
    this.camera.lookAt(0, 0, 0);
    
    // Create renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: true
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Add lights
    this.setupLights();
    
    // Add window resize listener
    window.addEventListener('resize', this.onWindowResize);
    
    console.log('3D scene initialized');
    this.isInitialized = true;
    return true;
  }

  /**
   * Set up scene lighting
   */
  setupLights() {
    // Ambient light for overall illumination
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(this.ambientLight);
    
    // Main directional light (simulates sun)
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    this.directionalLight.position.set(1, 1, 1);
    this.directionalLight.castShadow = true;
    
    // Configure shadow properties
    this.directionalLight.shadow.mapSize.width = 1024;
    this.directionalLight.shadow.mapSize.height = 1024;
    this.directionalLight.shadow.camera.near = 0.5;
    this.directionalLight.shadow.camera.far = 50;
    this.directionalLight.shadow.bias = -0.0001;
    
    this.scene.add(this.directionalLight);
    
    // Fill light from the front (reduces harsh shadows)
    this.fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
    this.fillLight.position.set(0, 0, 1);
    this.scene.add(this.fillLight);
  }

  /**
   * Start the animation loop
   */
  startAnimation() {
    if (this.isAnimating) return;
    
    this.isAnimating = true;
    this.clock.start();
    this.animate();
    console.log('Animation started');
  }

  /**
   * Stop the animation loop
   */
  stopAnimation() {
    if (!this.isAnimating) return;
    
    this.isAnimating = false;
    this.clock.stop();
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    console.log('Animation stopped');
  }

  /**
   * Animation loop
   */
  animate() {
    if (!this.isAnimating) return;
    
    this.animationFrameId = requestAnimationFrame(this.animate);
    
    // Get delta time
    const delta = this.clock.getDelta();
    
    // Call render callback if provided
    if (this.onRenderCallback) {
      this.onRenderCallback(delta);
    }
    
    // Render scene
    this.render();
  }

  /**
   * Render the scene
   */
  render() {
    if (!this.renderer || !this.scene || !this.camera) return;
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Handle window resize
   */
  onWindowResize() {
    if (!this.camera || !this.renderer || !this.container) return;
    
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    
    // Update camera
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    
    // Update renderer
    this.renderer.setSize(width, height);
  }
  
  /**
   * Resize the scene to specified dimensions
   * @param {number} width - New width
   * @param {number} height - New height
   */
  resize(width, height) {
    if (!this.camera || !this.renderer) return;
    
    // Update camera aspect ratio
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    
    // Update renderer size
    this.renderer.setSize(width, height);
  }

  /**
   * Add an object to the scene
   * @param {THREE.Object3D} object - Object to add
   */
  addObject(object) {
    if (!this.scene || !object) return;
    this.scene.add(object);
  }

  /**
   * Remove an object from the scene
   * @param {THREE.Object3D} object - Object to remove
   */
  removeObject(object) {
    if (!this.scene || !object) return;
    this.scene.remove(object);
  }

  /**
   * Clear all objects from the scene
   */
  clearScene() {
    if (!this.scene) return;
    
    // Remove all objects except lights
    while (this.scene.children.length > 0) {
      const object = this.scene.children[0];
      if (object.isLight) {
        // Skip lights
        this.scene.remove(object);
        this.scene.add(object);
      } else {
        this.scene.remove(object);
      }
    }
  }

  /**
   * Set the background color of the scene
   * @param {string|number} color - Color in hex format
   */
  setBackgroundColor(color) {
    if (!this.scene) return;
    this.scene.background = new THREE.Color(color);
  }

  /**
   * Set the scene to transparent background
   */
  setTransparentBackground() {
    if (!this.scene) return;
    this.scene.background = null;
  }

  /**
   * Get the camera position
   * @returns {THREE.Vector3} - Camera position
   */
  getCameraPosition() {
    if (!this.camera) return new THREE.Vector3();
    return this.camera.position.clone();
  }

  /**
   * Set the camera position
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} z - Z position
   */
  setCameraPosition(x, y, z) {
    if (!this.camera) return;
    this.camera.position.set(x, y, z);
    this.camera.lookAt(0, 0, 0);
  }

  /**
   * Take a screenshot of the current scene
   * @returns {string} - Data URL of the screenshot
   */
  takeScreenshot() {
    if (!this.renderer) return null;
    
    // Render the scene
    this.render();
    
    // Get the data URL
    return this.renderer.domElement.toDataURL('image/png');
  }

  /**
   * Dispose of all resources
   */
  dispose() {
    // Stop animation
    this.stopAnimation();
    
    // Remove event listeners
    window.removeEventListener('resize', this.onWindowResize);
    
    // Dispose of renderer
    if (this.renderer) {
      this.renderer.dispose();
    }
    
    // Clear scene
    this.clearScene();
    
    console.log('Scene manager disposed');
  }
}

// Export as a singleton
export default new SceneManager();