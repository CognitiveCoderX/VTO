/**
 * Main application file for Enhanced Virtual Try-On
 * Integrates pose detection, 3D model rendering, and UI interactions
 */

// Use import map to import Three.js
import * as THREE from 'three';
// Fix for stats.min.js not providing a default export
import './stats.min.js';
const Stats = window.Stats;
import ModelLoader from './modules/modelLoader.js';
import PoseDetection from './modules/poseDetection.js';
import ClothingFit from './modules/clothingFit.js';
import Customization from './modules/customization.js';
import SceneManager from './modules/sceneManager.js';

// Make Three.js available globally for debugging
window.THREE = THREE;

// Parse URL parameters for product selection
const urlParams = new URLSearchParams(window.location.search);
const productType = urlParams.get('product');
const productName = urlParams.get('name');

// If product params are provided, store them for later use
if (productType && productName) {
  console.log(`Virtual try-on requested for ${productName} (${productType})`);
  localStorage.setItem('virtualTryOn_productType', productType);
  localStorage.setItem('virtualTryOn_productName', productName);
}

// Export the app creation function for the HTML module loader
export function createApp() {
  console.log('Creating EnhancedVirtualTryOn app instance');
  return new EnhancedVirtualTryOn();
}

// Initialize the app when this module is loaded directly
if (!window.VirtualTryOn || !window.VirtualTryOn.app) {
  console.log('Initializing VirtualTryOn from main.js');
  window.VirtualTryOn = window.VirtualTryOn || {};
  window.VirtualTryOn.createApp = createApp;
  // Don't auto-create the app, wait for explicit initialization
}

class EnhancedVirtualTryOn {
  constructor() {
    // DOM elements
    this.video = document.getElementById('output-video');
    this.outputCanvas = document.getElementById('output-canvas');
    this.poseCanvas = document.getElementById('pose-canvas');
    this.loadingOverlay = document.getElementById('loading-overlay');
    this.statusBadge = document.getElementById('status-badge');
    this.fitIndicator = document.getElementById('fit-indicator');
    this.calibrationGuide = document.getElementById('calibration-guide');
    this.statsContainer = document.getElementById('stats');
    
    // Buttons
    this.startButton = document.getElementById('tryon-start-button');
    this.calibrateButton = document.getElementById('calibrate-button');
    this.changeModelButton = document.getElementById('change-model-button');
    this.customizeButton = document.getElementById('customize-button');
    this.screenshotButton = document.getElementById('screenshot-button');
    
    // Customization panel
    this.customizationPanel = document.getElementById('customization-panel');
    this.closeCustomizationButton = document.getElementById('close-customization');
    this.colorOptions = document.querySelectorAll('.color-option');
    this.textureOptions = document.querySelectorAll('.texture-option');
    this.opacitySlider = document.getElementById('opacity-slider');
    this.sizeSlider = document.getElementById('size-slider');
    
    // Video container
    this.videoContainer = document.querySelector('.video-container');
    
    // Stats for performance monitoring
    this.stats = null;
    
    // Application state
    this.isInitialized = false;
    this.isRunning = false;
    this.isCalibrated = false;
    this.currentModelType = 'tshirt';
    this.selectedProduct = null;
    
    // Try-on container (initially hidden)
    this.tryonContainer = document.querySelector('.tryon-container');
    if (this.tryonContainer) {
      this.tryonContainer.style.display = 'none';
    }
    
    // Bind methods
    this.animate = this.animate.bind(this);
    this.onPoseDetected = this.onPoseDetected.bind(this);
    this.onWindowResize = this.onWindowResize.bind(this);
    this.onRender = this.onRender.bind(this);
    this.startWithProduct = this.startWithProduct.bind(this);
  }

  /**
   * Update status badge with current status
   * @param {string} status - Status code
   * @param {string} message - Status message
   */
  updateStatus(status, message) {
    if (this.statusBadge) {
      this.statusBadge.textContent = message;
      this.statusBadge.className = 'status-badge ' + status;
    }
  }

  /**
   * Initialize the application
   */
  async initialize() {
    try {
      console.log('Initializing Enhanced Virtual Try-On...');
      this.updateStatus('initializing', 'Initializing');
      
      // Set up performance monitoring
      this.setupStats();
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Initialize model loader
      ModelLoader.initialize(this.loadingOverlay);
      
      // Don't preload models yet - wait until user selects a model
      // ModelLoader.preloadAllModels();
      
      // Setup complete
      this.isInitialized = true;
      this.updateStatus('ready', 'Ready');
      
      // Add event listeners to product detail buttons
      this.setupProductDetailListeners();
      
      console.log('Virtual Try-On Ready');
      
      // Make sure pose detection isn't started prematurely
      if (PoseDetection.isRunning) {
        PoseDetection.stop();
      }
      
      return true;
    } catch (error) {
      console.error('Initialization error:', error);
      this.updateStatus('error', 'Error');
      alert(`Initialization failed: ${error.message}. Please reload and try again.`);
      return false;
    }
  }

  /**
   * Set up performance monitoring with stats.js
   */
  setupStats() {
    this.stats = new Stats();
    this.stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
    if (this.statsContainer) {
      this.statsContainer.appendChild(this.stats.dom);
    }
  }

  /**
   * Set up event listeners for UI interactions
   */
  setupEventListeners() {
    // Start button in try-on controls
    if (this.startButton) {
      this.startButton.addEventListener('click', () => this.start());
    }
    
    // Calibrate button
    if (this.calibrateButton) {
      this.calibrateButton.addEventListener('click', () => this.calibrate());
    }
    
    // Change model button
    if (this.changeModelButton) {
      this.changeModelButton.addEventListener('click', () => this.openModelSelection());
    }
    
    // Customize button
    if (this.customizeButton) {
      this.customizeButton.addEventListener('click', () => this.toggleCustomizationPanel());
    }
    
    // Screenshot button
    if (this.screenshotButton) {
      this.screenshotButton.addEventListener('click', () => this.takeScreenshot());
    }
    
    // Close customization button
    if (this.closeCustomizationButton) {
      this.closeCustomizationButton.addEventListener('click', () => this.toggleCustomizationPanel());
    }
    
    // Add back button to return to product page
    const backButton = document.createElement('button');
    backButton.className = 'control-button';
    backButton.textContent = 'Back to Product';
    backButton.addEventListener('click', () => this.closeVirtualTryOn());
    
    // Add back button to controls panel
    const controlsPanel = document.querySelector('.controls-panel');
    if (controlsPanel) {
      controlsPanel.insertBefore(backButton, controlsPanel.firstChild);
    }
    
    // Color options
    if (this.colorOptions) {
      this.colorOptions.forEach(option => {
        option.addEventListener('click', () => {
          // Remove selected class from all options
          this.colorOptions.forEach(opt => opt.classList.remove('selected'));
          // Add selected class to clicked option
          option.classList.add('selected');
          // Apply color to model
          const color = option.getAttribute('data-color');
          if (color && ModelLoader.currentModel) {
            Customization.applyColor(ModelLoader.currentModel, color);
          }
        });
      });
    }
    
    // Texture options
    if (this.textureOptions) {
      this.textureOptions.forEach(option => {
        option.addEventListener('click', () => {
          // Remove selected class from all options
          this.textureOptions.forEach(opt => opt.classList.remove('selected'));
          // Add selected class to clicked option
          option.classList.add('selected');
          // Apply texture to model
          const texture = option.getAttribute('data-texture');
          if (texture && ModelLoader.currentModel) {
            Customization.applyTexture(ModelLoader.currentModel, texture);
          }
        });
      });
    }
    
    // Opacity slider
    if (this.opacitySlider) {
      this.opacitySlider.addEventListener('input', () => {
        const opacity = parseFloat(this.opacitySlider.value);
        if (ModelLoader.currentModel) {
          Customization.applyOpacity(ModelLoader.currentModel, opacity);
        }
      });
    }
    
    // Size slider
    if (this.sizeSlider) {
      this.sizeSlider.addEventListener('input', () => {
        const size = parseFloat(this.sizeSlider.value);
        if (ModelLoader.currentModel) {
          Customization.applySizeAdjustment(ModelLoader.currentModel, size);
        }
      });
    }
    
    // Category selection
    const categoryCards = document.querySelectorAll('.category-card');
    const categorySection = document.getElementById('category-section');
    const welcomeSection = document.getElementById('welcome-section');
    const selectionSection = document.getElementById('selection-section');
    
    // This is the start button in the welcome section (different from this.startButton)
    const welcomeStartButton = document.getElementById('welcome-start-button');
    
    if (welcomeStartButton && welcomeSection && categorySection) {
      welcomeStartButton.addEventListener('click', () => {
        welcomeSection.classList.add('hidden');
        categorySection.classList.remove('hidden');
      });
    }
    
    if (categoryCards && categorySection && selectionSection) {
      categoryCards.forEach(card => {
        card.addEventListener('click', () => {
          const category = card.getAttribute('data-category');
          
          // Show all model cards initially
          const modelCards = document.querySelectorAll('.model-card');
          modelCards.forEach(modelCard => {
            modelCard.style.display = 'flex';
          });
          
          // Filter model cards if a specific category is selected
          if (category !== 'all') {
            modelCards.forEach(modelCard => {
              if (modelCard.getAttribute('data-type') !== category) {
                modelCard.style.display = 'none';
              }
            });
          }
          
          // Switch to selection section
          categorySection.classList.add('hidden');
          selectionSection.classList.remove('hidden');
        });
      });
    }
    
    // Model selection
    const modelCards = document.querySelectorAll('.model-card');
    const tryonSection = document.getElementById('tryon-section');
    
    if (modelCards && selectionSection && tryonSection) {
      modelCards.forEach(card => {
        card.addEventListener('click', () => {
          const modelUrl = card.getAttribute('data-model');
          
          // Start the virtual try-on with the selected model
          selectionSection.classList.add('hidden');
          tryonSection.classList.remove('hidden');
          
          // Load the selected model for try-on
          this.loadModelFromUrl(modelUrl);
        });
      });
    }
    
    // Back buttons
    const categoryBackButton = document.getElementById('category-back-button');
    const selectionBackButton = document.getElementById('selection-back-button');
    
    if (categoryBackButton && welcomeSection && categorySection) {
      categoryBackButton.addEventListener('click', () => {
        categorySection.classList.add('hidden');
        welcomeSection.classList.remove('hidden');
      });
    }
    
    if (selectionBackButton && categorySection && selectionSection) {
      selectionBackButton.addEventListener('click', () => {
        selectionSection.classList.add('hidden');
        categorySection.classList.remove('hidden');
      });
    }
    
    // Window resize event
    window.addEventListener('resize', this.onWindowResize);
  }

  /**
   * Callback for scene rendering
   * @param {number} delta - Time delta
   */
  onRender(delta) {
    // Update stats
    if (this.stats) {
      this.stats.update();
    }
  }
  
  /**
   * Animation loop
   */
  animate() {
    if (!this.isRunning) return;
    
    // Update pose detection
    if (PoseDetection && PoseDetection.update) {
      PoseDetection.update();
    }
    
    // Request next frame
    requestAnimationFrame(this.animate);
  }
  
  /**
   * Handle window resize events
   */
  onWindowResize() {
    if (this.videoContainer && this.outputCanvas) {
      // Update canvas size
      const width = this.videoContainer.clientWidth;
      const height = this.videoContainer.clientHeight;
      
      // Update scene manager
      SceneManager.resize(width, height);
    }
  }

  /**
   * Set up camera access
   */
  async setupCamera() {
    try {
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      });
      
      // Set video source
      this.video.srcObject = stream;
      
      // Wait for video to be ready
      await new Promise(resolve => {
        this.video.onloadedmetadata = () => {
          this.video.play();
          resolve();
        };
      });
      
      console.log('Camera access granted');
      return true;
    } catch (error) {
      console.error('Camera access error:', error);
      throw new Error('Camera access denied. Please allow camera access and reload.');
    }
  }

  /**
   * Set up pose detection
   */
  async setupPoseDetection() {
    try {
      // Initialize pose detection
      const success = await PoseDetection.initialize(
        this.video,
        this.poseCanvas,
        this.onPoseDetected
      );
      
      if (!success) {
        throw new Error('Failed to initialize pose detection');
      }
      
      console.log('Pose detection initialized');
      return true;
    } catch (error) {
      console.error('Pose detection setup error:', error);
      throw error;
    }
  }

  /**
   * Set up event listeners for product detail buttons
   */
  setupProductDetailListeners() {
    // Find all product detail buttons
    const productDetailButtons = document.querySelectorAll('.view-details-button');
    
    // Add click event listeners to each button
    productDetailButtons.forEach(button => {
      button.addEventListener('click', (event) => {
        // Get product type from data attribute
        const productType = button.getAttribute('data-product');
        
        // Find the corresponding modal
        const modalId = `${productType}-modal`;
        const modal = document.getElementById(modalId);
        
        if (modal) {
          // Add try-on button to modal if it doesn't exist
          if (!modal.querySelector('.try-on-button')) {
            const modalActions = modal.querySelector('.modal-actions');
            if (modalActions) {
              const tryOnButton = document.createElement('button');
              tryOnButton.className = 'add-to-cart-btn try-on-button';
              tryOnButton.style.backgroundColor = '#e94560';
              tryOnButton.style.marginTop = '10px';
              tryOnButton.innerHTML = '<span class="material-icons">accessibility_new</span> Virtual Try-On';
              
              // Add click event to try-on button
              tryOnButton.addEventListener('click', () => {
                // Close the modal
                modal.classList.remove('active');
                
                // Start virtual try-on with selected product
                this.startWithProduct(productType);
              });
              
              modalActions.appendChild(tryOnButton);
            }
          }
        }
      });
    });
  }
  
  /**
   * Start the application with a selected product
   * @param {string} productType - Type of product to try on
   */
  async startWithProduct(productType) {
    if (!this.isInitialized) {
      console.warn('Cannot start: not initialized');
      return;
    }
    
    try {
      // Map product types from product page to model types
      const modelTypeMap = {
        'shirt': 'shirt',
        'tshirt': 'tshirt',
        'hoodie': 'hoodie',
        'business-shirt': 'shirt',
        'polo': 'tshirt',
        'jacket': 'jacket',
        'cap': 'hat'
      };
      
      // Get corresponding model type
      this.currentModelType = modelTypeMap[productType] || 'tshirt';
      this.selectedProduct = productType;
      
      // Show try-on container
      if (this.tryonContainer) {
        this.tryonContainer.style.display = 'block';
      }
      
      // Initialize camera and scene if not already done
      if (!this.video.srcObject) {
        await this.setupCamera();
      }
      
      if (!SceneManager.isInitialized) {
        SceneManager.initialize(this.outputCanvas, this.videoContainer, this.onRender);
      }
      
      if (!PoseDetection.isInitialized) {
        await this.setupPoseDetection();
      }
      
      // Start pose detection
      await PoseDetection.start();
      
      // Load selected model
      await this.loadModel(this.currentModelType);
      
      // Start animation loop
      this.isRunning = true;
      SceneManager.startAnimation();
      
      // Update UI
      if (this.startButton) {
        this.startButton.textContent = 'Running';
        this.startButton.disabled = true;
      }
      
      if (this.calibrateButton) this.calibrateButton.disabled = false;
      if (this.changeModelButton) this.changeModelButton.disabled = false;
      if (this.customizeButton) this.customizeButton.disabled = false;
      if (this.screenshotButton) this.screenshotButton.disabled = false;
      
      // Scroll to try-on container
      this.tryonContainer.scrollIntoView({ behavior: 'smooth' });
      
      console.log('Virtual Try-On started with product:', productType);
    } catch (error) {
      console.error('Start error:', error);
      this.updateStatus('error', 'Error');
      alert(`Failed to start: ${error.message}`);
    }
  }
  
  /**
   * Start the application
   */
  async start() {
    if (!this.isInitialized) {
      console.warn('Cannot start: not initialized');
      return;
    }
    
    if (this.isRunning) {
      console.warn('Already running');
      return;
    }
    
    try {
      // Initialize camera and scene if not already done
      if (!this.video.srcObject) {
        await this.setupCamera();
      }
      
      if (!SceneManager.isInitialized) {
        SceneManager.initialize(this.outputCanvas, this.videoContainer, this.onRender);
      }
      
      if (!PoseDetection.isInitialized) {
        await this.setupPoseDetection();
      }
      
      // Start pose detection
      await PoseDetection.start();
      
      // Load initial model
      await this.loadModel(this.currentModelType);
      
      // Start animation loop
      this.isRunning = true;
      SceneManager.startAnimation();
      
      // Update UI
      this.startButton.textContent = 'Running';
      this.startButton.disabled = true;
      this.calibrateButton.disabled = false;
      this.changeModelButton.disabled = false;
      this.customizeButton.disabled = false;
      this.screenshotButton.disabled = false;
      
      console.log('Virtual Try-On started');
    } catch (error) {
      console.error('Start error:', error);
      this.updateStatus('error', 'Error');
      alert(`Failed to start: ${error.message}`);
    }
  }

  /**
   * Stop the application
   */
  stop() {
    if (!this.isRunning) {
      return;
    }
    
    // Stop pose detection
    PoseDetection.stop();
    
    // Stop animation
    SceneManager.stopAnimation();
    
    // Update state
    this.isRunning = false;
    
    // Update UI
    this.startButton.textContent = 'Start Try-On';
    this.startButton.disabled = false;
    this.calibrateButton.disabled = true;
    this.changeModelButton.disabled = true;
    this.customizeButton.disabled = true;
    this.screenshotButton.disabled = true;
    
    console.log('Virtual Try-On stopped');
  }

  /**
   * Handle pose detection results
   * @param {Array} keypoints - Array of 3D keypoints from pose detection
   */
  onPoseDetected(keypoints) {
    if (!this.isRunning || !ModelLoader.currentModel) {
      return;
    }
    
    // Update model fit based on pose
    const fitResult = ClothingFit.updateModelFit(
      ModelLoader.currentModel,
      keypoints,
      ModelLoader.getBaseMeasurements(),
      {
        modelType: this.currentModelType,
        sizeAdjustment: parseFloat(this.sizeSlider?.value || 1.0)
      }
    );
    
    // Update fit indicator
    if (fitResult && fitResult.fitQuality) {
      const quality = fitResult.fitQuality.overall;
      if (quality > 0.8) {
        this.fitIndicator.textContent = 'Perfect Fit!';
        this.fitIndicator.classList.add('visible');
      } else if (quality > 0.6) {
        this.fitIndicator.textContent = 'Good Fit';
        this.fitIndicator.classList.add('visible');
      } else {
        this.fitIndicator.classList.remove('visible');
      }
    }
  }

  /**
   * Load a 3D model
   * @param {string} modelType - Type of model to load
   */
  async loadModel(modelType) {
    try {
      // Remove current model from scene
      if (ModelLoader.currentModel) {
        SceneManager.removeObject(ModelLoader.currentModel);
      }
      
      // Load new model
      const model = await ModelLoader.loadModel(modelType);
      
      // Add model to scene
      SceneManager.addObject(model);
      
      // Apply current customization settings
      Customization.applyAllSettings(model);
      
      // Update current model type
      this.currentModelType = modelType;
      
      console.log(`Model '${modelType}' loaded`);
      return true;
    } catch (error) {
      console.error(`Error loading model '${modelType}':`, error);
      return false;
    }
  }

  /**
   * Calibrate the body measurements
   */
  calibrate() {
    if (!this.isRunning) {
      return;
    }
    
    // Show calibration guide
    this.calibrationGuide.classList.remove('hidden');
    
    // Update status
    this.updateStatus('initializing', 'Calibrating...');
    
    // Wait for T-pose
    const checkInterval = setInterval(() => {
      // Get latest pose
      const keypoints = PoseDetection.extractKeypoints3D({ poseLandmarks: [], poseWorldLandmarks: [] });
      
      // Attempt calibration
      const success = ClothingFit.calibrate(keypoints);
      
      if (success) {
        // Calibration successful
        clearInterval(checkInterval);
        this.isCalibrated = true;
        this.calibrationGuide.classList.add('hidden');
        this.updateStatus('ready', 'Calibrated');
        
        // Update model fit with calibrated measurements
        if (ModelLoader.currentModel) {
          const measurements = ClothingFit.getMeasurements();
          ModelLoader.updateBaseMeasurements(measurements);
        }
        
        console.log('Calibration successful');
      }
    }, 500);
    
    // Timeout after 10 seconds
    setTimeout(() => {
      clearInterval(checkInterval);
      if (!this.isCalibrated) {
        this.calibrationGuide.classList.add('hidden');
        this.updateStatus('ready', 'Ready');
        console.log('Calibration timed out');
      }
    }, 10000);
  }

  /**
   * Open model selection modal
   */
  openModelSelection() {
    // This would typically show a modal with model options
    // For simplicity, we'll just cycle through available models
    const modelTypes = ['tshirt', 'jacket', 'hoodie', 'shirt', 'pants'];
    const currentIndex = modelTypes.indexOf(this.currentModelType);
    const nextIndex = (currentIndex + 1) % modelTypes.length;
    const nextModelType = modelTypes[nextIndex];
    
    this.loadModel(nextModelType);
  }

  /**
   * Toggle customization panel
   */
  toggleCustomizationPanel() {
    if (this.customizationPanel) {
      this.customizationPanel.classList.toggle('hidden');
    }
  }

  /**
   * Take a screenshot
   */
  takeScreenshot() {
    if (!this.isRunning) {
      return;
    }
    
    // Get screenshot from scene manager
    const screenshotDataUrl = SceneManager.takeScreenshot();
    if (!screenshotDataUrl) return;
    
    // Create a canvas that combines video and 3D rendering
    const screenshotCanvas = document.createElement('canvas');
    screenshotCanvas.width = this.video.clientWidth;
    screenshotCanvas.height = this.video.clientHeight;
    const ctx = screenshotCanvas.getContext('2d');
    
    // Draw video
    ctx.drawImage(this.video, 0, 0, screenshotCanvas.width, screenshotCanvas.height);
    
    // Draw 3D rendering
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, screenshotCanvas.width, screenshotCanvas.height);
      
      // Create download link
      const link = document.createElement('a');
      link.download = `virtual-tryon-${Date.now()}.png`;
      link.href = screenshotCanvas.toDataURL('image/png');
      link.click();
    };
    img.src = screenshotDataUrl;
  }

  /**
   * Update status badge
   * @param {string} status - Status class ('initializing', 'ready', 'error')
   * @param {string} text - Status text
   */
  updateStatus(status, text) {
    if (this.statusBadge) {
      // Remove all status classes
      this.statusBadge.classList.remove('initializing', 'ready', 'error');
      // Add new status class
      this.statusBadge.classList.add(status);
      // Update text
      this.statusBadge.textContent = text;
    }
  }

  /**
   * Enable buttons after initialization
   */
  enableButtons() {
    if (this.startButton) {
      this.startButton.disabled = false;
    }
  }
  
  /**
   * Close the virtual try-on and return to product page
   */
  closeVirtualTryOn() {
    // Stop the application
    this.stop();
    
    // Hide try-on container
    if (this.tryonContainer) {
      this.tryonContainer.style.display = 'none';
    }
    
    // Scroll back to product section
    const productSection = document.querySelector('.product-grid');
    if (productSection) {
      productSection.scrollIntoView({ behavior: 'smooth' });
    }
    
    console.log('Virtual Try-On closed');
  }

  /**
   * Load a model from a direct URL
   * @param {string} modelUrl - URL of the model to load
   */
  async loadModelFromUrl(modelUrl) {
    if (!this.isInitialized) {
      console.warn('Cannot load model: not initialized');
      return;
    }
    
    try {
      this.updateStatus('loading', 'Loading model...');
      
      // Show try-on container
      if (this.tryonContainer) {
        this.tryonContainer.style.display = 'block';
      }
      
      // Initialize camera and scene if not already done
      if (!this.video.srcObject) {
        await this.setupCamera();
      }
      
      if (!SceneManager.isInitialized) {
        SceneManager.initialize(this.outputCanvas, this.videoContainer, this.onRender);
      }
      
      // Initialize pose detection if needed
      if (!PoseDetection.isInitialized) {
        await this.setupPoseDetection();
      }
      
      // Start pose detection only now
      if (!PoseDetection.isRunning) {
        await PoseDetection.start();
        console.log('Pose detection started after model selection');
      }
      
      // Load the model directly using its URL
      const model = await this.loadCustomModel(modelUrl);
      
      // Start animation loop
      this.isRunning = true;
      SceneManager.startAnimation();
      
      // Enable and update UI controls
      this.calibrateButton.disabled = false;
      this.changeModelButton.disabled = false;
      this.customizeButton.disabled = false;
      this.screenshotButton.disabled = false;
      
      if (this.startButton) {
        this.startButton.textContent = 'Running';
        this.startButton.disabled = true;
      }
      
      console.log('Model loaded from URL:', modelUrl);
      this.updateStatus('ready', 'Ready');
    } catch (error) {
      console.error('Error loading model from URL:', error);
      this.updateStatus('error', 'Error loading model');
      alert(`Failed to load model: ${error.message}`);
    }
  }

  /**
   * Load a custom model from URL
   * @param {string} url - URL of the model
   * @returns {Promise<THREE.Group>} - The loaded model
   */
  async loadCustomModel(url) {
    try {
      // Show loading overlay
      this.updateStatus('loading', 'Loading model...');
      
      // Use the GLTFLoader to load the model
      const gltf = await ModelLoader.loadGLTF(url);
      const model = gltf.scene;
      
      // Process the model
      model.traverse((node) => {
        if (node.isMesh) {
          // Enable shadows
          node.castShadow = true;
          node.receiveShadow = true;
        }
      });
      
      // Remove any existing model
      if (ModelLoader.currentModel) {
        SceneManager.removeObject(ModelLoader.currentModel);
      }
      
      // Add the new model to the scene
      SceneManager.addObject(model);
      ModelLoader.currentModel = model;
      
      return model;
    } catch (error) {
      console.error('Error loading custom model:', error);
      throw error;
    }
  }
}