/**
 * Customization.js
 * Handles customization of 3D clothing models (colors, textures, opacity, etc.)
 */

import * as THREE from 'three';

class Customization {
  constructor() {
    // Available colors
    this.colors = {
      black: new THREE.Color('#000000'),
      white: new THREE.Color('#ffffff'),
      red: new THREE.Color('#e74c3c'),
      blue: new THREE.Color('#3498db'),
      green: new THREE.Color('#2ecc71'),
      yellow: new THREE.Color('#f1c40f'),
      purple: new THREE.Color('#9b59b6'),
      orange: new THREE.Color('#e67e22')
    };
    
    // Available textures
    this.textures = {
      solid: null,
      denim: null,
      leather: null,
      cotton: null
    };
    
    // Texture loader
    this.textureLoader = new THREE.TextureLoader();
    
    // Current settings
    this.currentSettings = {
      color: 'black',
      texture: 'solid',
      opacity: 1.0,
      size: 1.0
    };
    
    // Initialize textures
    this.initTextures();
  }

  /**
   * Initialize textures
   */
  initTextures() {
    // Load textures
    this.textures.solid = this.textureLoader.load('/images/textures/solid.jpg');
    this.textures.denim = this.textureLoader.load('/images/textures/denim.jpg');
    this.textures.leather = this.textureLoader.load('/images/textures/leather.jpg');
    this.textures.cotton = this.textureLoader.load('/images/textures/cotton.jpg');
    
    // Configure texture properties
    Object.values(this.textures).forEach(texture => {
      if (texture) {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(2, 2);
        texture.colorSpace = THREE.SRGBColorSpace;
      }
    });
  }

  /**
   * Apply color to a model
   * @param {THREE.Object3D} model - The model to apply color to
   * @param {string} colorName - Name of the color to apply
   * @returns {boolean} - Whether the color was applied successfully
   */
  applyColor(model, colorName) {
    if (!model || !this.colors[colorName]) {
      return false;
    }
    
    const color = this.colors[colorName];
    this.currentSettings.color = colorName;
    
    // Apply color to all meshes in the model
    model.traverse(node => {
      if (node.isMesh && node.material) {
        // Handle array of materials
        if (Array.isArray(node.material)) {
          node.material.forEach(material => {
            material.color.copy(color);
          });
        } else {
          // Single material
          node.material.color.copy(color);
        }
      }
    });
    
    return true;
  }

  /**
   * Apply texture to a model
   * @param {THREE.Object3D} model - The model to apply texture to
   * @param {string} textureName - Name of the texture to apply
   * @returns {boolean} - Whether the texture was applied successfully
   */
  applyTexture(model, textureName) {
    if (!model || !this.textures[textureName]) {
      return false;
    }
    
    const texture = this.textures[textureName];
    this.currentSettings.texture = textureName;
    
    // Apply texture to all meshes in the model
    model.traverse(node => {
      if (node.isMesh && node.material) {
        // Handle array of materials
        if (Array.isArray(node.material)) {
          node.material.forEach(material => {
            material.map = texture;
            material.needsUpdate = true;
          });
        } else {
          // Single material
          node.material.map = texture;
          node.material.needsUpdate = true;
        }
      }
    });
    
    return true;
  }

  /**
   * Apply opacity to a model
   * @param {THREE.Object3D} model - The model to apply opacity to
   * @param {number} opacity - Opacity value (0-1)
   * @returns {boolean} - Whether the opacity was applied successfully
   */
  applyOpacity(model, opacity) {
    if (!model || opacity < 0 || opacity > 1) {
      return false;
    }
    
    opacity = Math.max(0, Math.min(1, opacity));
    this.currentSettings.opacity = opacity;
    
    // Apply opacity to all meshes in the model
    model.traverse(node => {
      if (node.isMesh && node.material) {
        // Handle array of materials
        if (Array.isArray(node.material)) {
          node.material.forEach(material => {
            material.transparent = opacity < 1;
            material.opacity = opacity;
          });
        } else {
          // Single material
          node.material.transparent = opacity < 1;
          node.material.opacity = opacity;
        }
      }
    });
    
    return true;
  }

  /**
   * Apply size adjustment to a model
   * @param {THREE.Object3D} model - The model to adjust size for
   * @param {number} sizeAdjustment - Size adjustment factor
   * @returns {boolean} - Whether the size was adjusted successfully
   */
  applySizeAdjustment(model, sizeAdjustment) {
    if (!model || sizeAdjustment <= 0) {
      return false;
    }
    
    // Limit size adjustment to reasonable range
    sizeAdjustment = Math.max(0.5, Math.min(2.0, sizeAdjustment));
    this.currentSettings.size = sizeAdjustment;
    
    // Store the size adjustment for use by the clothing fit module
    model.userData.sizeAdjustment = sizeAdjustment;
    
    return true;
  }

  /**
   * Reset model to original appearance
   * @param {THREE.Object3D} model - The model to reset
   * @returns {boolean} - Whether the model was reset successfully
   */
  resetModel(model) {
    if (!model) {
      return false;
    }
    
    // Reset to original materials
    model.traverse(node => {
      if (node.isMesh && node.userData.originalMaterial) {
        if (Array.isArray(node.material)) {
          // Handle array of materials
          node.material = node.userData.originalMaterial.map(mat => mat.clone());
        } else {
          // Single material
          node.material = node.userData.originalMaterial.clone();
        }
      }
    });
    
    // Reset current settings
    this.currentSettings = {
      color: 'black',
      texture: 'solid',
      opacity: 1.0,
      size: 1.0
    };
    
    // Reset size adjustment
    model.userData.sizeAdjustment = 1.0;
    
    return true;
  }

  /**
   * Apply all current settings to a model
   * @param {THREE.Object3D} model - The model to apply settings to
   * @returns {boolean} - Whether the settings were applied successfully
   */
  applyAllSettings(model) {
    if (!model) {
      return false;
    }
    
    // Apply all current settings
    this.applyColor(model, this.currentSettings.color);
    this.applyTexture(model, this.currentSettings.texture);
    this.applyOpacity(model, this.currentSettings.opacity);
    this.applySizeAdjustment(model, this.currentSettings.size);
    
    return true;
  }

  /**
   * Get current customization settings
   * @returns {Object} - Current settings
   */
  getCurrentSettings() {
    return { ...this.currentSettings };
  }

  /**
   * Update current settings
   * @param {Object} settings - New settings
   */
  updateSettings(settings) {
    this.currentSettings = { ...this.currentSettings, ...settings };
  }

  /**
   * Get available colors
   * @returns {Object} - Available colors
   */
  getAvailableColors() {
    return Object.keys(this.colors);
  }

  /**
   * Get available textures
   * @returns {Object} - Available textures
   */
  getAvailableTextures() {
    return Object.keys(this.textures);
  }
}

// Export as a singleton
export default new Customization();