/**
 * ModelLoader.js
 * Handles loading and management of 3D clothing models (GLB files)
 */

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

class ModelLoader {
  constructor() {
    this.models = {};
    this.currentModel = null;
    this.isLoading = false;
    this.loadingOverlay = null;
    this.loadingText = null;
    
    // Initialize loaders
    this.gltfLoader = new GLTFLoader();
    
    // Set up Draco loader for compressed models
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.5/');
    // Add decoder configuration to use JS instead of WASM to avoid CSP issues
    dracoLoader.setDecoderConfig({ type: 'js' });
    this.gltfLoader.setDRACOLoader(dracoLoader);
    
    // Model URLs from Cloudinary - updated to match HTML data-model attributes
    this.modelUrls = {
      tshirt: 'https://res.cloudinary.com/customxshop/image/upload/v1744037917/CustomXShop/l4plnsl7o5r6qqxotasx.glb',
      shirt: 'https://res.cloudinary.com/customxshop/image/upload/v1744041431/check_shirt.compressed_u3k3bc.glb',
      jacket: 'https://res.cloudinary.com/customxshop/image/upload/v1744041395/jacket.compressed_xfe0sv.glb',
      hoodie: 'https://res.cloudinary.com/customxshop/image/upload/v1744041395/hoodie.compressed.glb',
      polo: 'https://res.cloudinary.com/customxshop/image/upload/v1744041395/polo_shirt.compressed.glb',
      sweater: 'https://res.cloudinary.com/customxshop/image/upload/v1744041395/sweater.compressed.glb',
      necklace: 'https://res.cloudinary.com/customxshop/image/upload/v1744041395/necklace.compressed.glb',
      scarf: 'https://res.cloudinary.com/customxshop/image/upload/v1744041395/scarf.compressed.glb'
    };
    
    // Base measurements for scaling
    this.baseMeasurements = {
      shoulderWidth: 0.4, // meters
      torsoLength: 0.6,  // meters
      armLength: 0.7,    // meters
      legLength: 0.9     // meters
    };
  }

  /**
   * Initialize the model loader
   * @param {HTMLElement} loadingOverlay - Loading overlay element
   */
  initialize(loadingOverlay) {
    this.loadingOverlay = loadingOverlay;
    this.loadingText = loadingOverlay.querySelector('p') || loadingOverlay;
  }

  /**
   * Load a specific model by type
   * @param {string} modelType - Type of model to load (e.g., 'tshirt', 'jacket')
   * @returns {Promise<THREE.Group>} - The loaded model
   */
  async loadModel(modelType) {
    if (!this.modelUrls[modelType]) {
      throw new Error(`Model type '${modelType}' not found`);
    }
    
    // Show loading overlay
    this.isLoading = true;
    this.showLoadingOverlay(`Loading ${modelType}...`);
    
    try {
      // Check if model is already loaded
      if (this.models[modelType]) {
        this.currentModel = this.models[modelType];
        this.hideLoadingOverlay();
        return this.currentModel;
      }
      
      // Load the model
      const url = this.modelUrls[modelType];
      const gltf = await this.loadGLTF(url);
      
      // Process the model
      const model = gltf.scene;
      model.traverse((node) => {
        if (node.isMesh) {
          // Enable shadows
          node.castShadow = true;
          node.receiveShadow = true;
          
          // Store original material for reset
          node.userData.originalMaterial = node.material.clone();
        }
      });
      
      // Store the model
      this.models[modelType] = model;
      this.currentModel = model;
      
      console.log(`Model '${modelType}' loaded successfully`);
      this.hideLoadingOverlay();
      return model;
    } catch (error) {
      console.error(`Error loading model '${modelType}':`, error);
      this.showLoadingOverlay(`Error loading model: ${error.message}`);
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Load a GLTF model from URL
   * @param {string} url - URL of the GLB/GLTF model
   * @returns {Promise<GLTF>} - The loaded GLTF object
   */
  loadGLTF(url) {
    return new Promise((resolve, reject) => {
      // Default fallback URL in case the requested model is not found
      const fallbackUrl = 'https://res.cloudinary.com/customxshop/image/upload/v1744037917/CustomXShop/l4plnsl7o5r6qqxotasx.glb';
      
      this.gltfLoader.load(
        url,
        (gltf) => resolve(gltf),
        (progress) => {
          const percentComplete = Math.round((progress.loaded / progress.total) * 100);
          this.showLoadingOverlay(`Loading model... ${percentComplete}%`);
        },
        (error) => {
          console.warn(`Error loading model from ${url}: ${error.message}`);
          
          // If the original URL fails, try the fallback URL
          if (url !== fallbackUrl) {
            console.log(`Attempting to load fallback model from ${fallbackUrl}`);
            this.showLoadingOverlay(`Original model not found. Loading fallback model...`);
            
            this.gltfLoader.load(
              fallbackUrl,
              (gltf) => resolve(gltf),
              (progress) => {
                const percentComplete = Math.round((progress.loaded / progress.total) * 100);
                this.showLoadingOverlay(`Loading fallback model... ${percentComplete}%`);
              },
              (secondError) => {
                console.error(`Fallback model also failed to load: ${secondError.message}`);
                reject(secondError);
              }
            );
          } else {
            // If the fallback URL also fails, reject with the original error
            reject(error);
          }
        }
      );
    });
  }

  /**
   * Preload all models in the background
   */
  async preloadAllModels() {
    const modelTypes = Object.keys(this.modelUrls);
    this.showLoadingOverlay('Preloading models...');
    
    try {
      const promises = modelTypes.map(async (type, index) => {
        try {
          this.showLoadingOverlay(`Preloading models... (${index + 1}/${modelTypes.length})`);
          const url = this.modelUrls[type];
          const gltf = await this.loadGLTF(url);
          
          // Process the model
          const model = gltf.scene;
          model.traverse((node) => {
            if (node.isMesh) {
              node.castShadow = true;
              node.receiveShadow = true;
              node.userData.originalMaterial = node.material.clone();
            }
          });
          
          // Store the model
          this.models[type] = model;
          return model;
        } catch (error) {
          console.error(`Error preloading model '${type}':`, error);
          return null;
        }
      });
      
      await Promise.all(promises);
      console.log('All models preloaded successfully');
    } catch (error) {
      console.error('Error preloading models:', error);
    } finally {
      this.hideLoadingOverlay();
    }
  }

  /**
   * Show the loading overlay with a message
   * @param {string} message - Message to display
   */
  showLoadingOverlay(message) {
    if (this.loadingOverlay) {
      this.loadingOverlay.style.display = 'flex';
      if (this.loadingText) {
        this.loadingText.textContent = message;
      }
    }
  }

  /**
   * Hide the loading overlay
   */
  hideLoadingOverlay() {
    if (this.loadingOverlay) {
      this.loadingOverlay.style.display = 'none';
    }
  }

  /**
   * Get the base measurements for scaling
   * @returns {Object} - Base measurements
   */
  getBaseMeasurements() {
    return { ...this.baseMeasurements };
  }

  /**
   * Update the base measurements
   * @param {Object} measurements - New measurements
   */
  updateBaseMeasurements(measurements) {
    this.baseMeasurements = { ...this.baseMeasurements, ...measurements };
  }

  /**
   * Load a model from URL
   * @param {string} url - URL of the model to load
   * @param {function} onLoad - Callback when model loaded
   * @param {function} onError - Callback when error occurs
   */
  static loadModel(url, onLoad, onError) {
    // Validate and sanitize the URL to prevent CSP issues
    if (!url || url.trim() === '') {
      console.error('Invalid model URL: empty or undefined');
      if (onError) onError(new Error('Invalid model URL'));
      return;
    }
    
    // Prevent loading from data: URLs which cause CSP issues
    if (url.startsWith('data:')) {
      console.error('Cannot load model from data: URL due to CSP restrictions');
      if (onError) onError(new Error('Data URLs not supported for models'));
      return;
    }
    
    // Ensure URL is using HTTPS or relative path
    if (!url.startsWith('https://') && !url.startsWith('/') && !url.startsWith('./') && !url.startsWith('../')) {
      // If it's an absolute path without protocol, add origin
      if (url.startsWith('/')) {
        url = window.location.origin + url;
      } else {
        // Otherwise try to make it a relative path
        url = './' + url;
      }
    }
    
    // Show loading UI
    this.showLoadingOverlay();
    
    // Attempt to load the model
    this.loader.load(
      url,
      (gltf) => {
        this.hideLoadingOverlay();
        if (onLoad) onLoad(gltf);
      },
      (xhr) => {
        const percentComplete = (xhr.loaded / xhr.total) * 100;
        this.updateLoadingProgress(percentComplete);
      },
      (error) => {
        console.error('Error loading model:', error);
        this.hideLoadingOverlay();
        if (onError) onError(error);
      }
    );
  }
}

// Export as a singleton
export default new ModelLoader();