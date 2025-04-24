/**
 * Bundle script for enhanced virtual try-on with MediaPipe integration
 * This file initializes the global namespace and configuration.
 * Actual implementations are imported from the modules folder.
 */

// Create global namespace
window.VirtualTryOn = window.VirtualTryOn || {};

// Configuration settings
window.VirtualTryOn.Config = {
  camera: {
    width: 640,
    height: 480,
    facingMode: "user",
    flipHorizontal: true
  },
  
  poseDetection: {
    modelComplexity: 1, // 0=Lite, 1=Full, 2=Heavy
    enableSmoothing: true,
    minPoseScore: 0.15,
    minKeypointScore: 0.2,
    maxPoses: 1,
    enable3D: true, // Enable 3D landmarks for GHUM model
    autoStart: false // Prevent automatic start of pose detection
  },
  
  scene: {
    backgroundColor: 0x000000,
    ambientLightColor: 0xffffff,
    ambientLightIntensity: 0.5
  }
};

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('Bundle script initialized. Main application will load from main.js');
});