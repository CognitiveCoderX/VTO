/**
 * PoseDetection.js
 * Handles real-time pose detection using MediaPipe's BlazePose GHUM model
 */

class PoseDetection {
  constructor() {
    this.detector = null;
    this.video = null;
    this.canvas = null;
    this.ctx = null;
    this.isRunning = false;
    this.lastPoseTime = 0;
    this.poses = [];
    this.onPoseDetectedCallback = null;
    this.worker = null;
    this.camera = null;
    
    // Track initialization state
    this.isInitialized = false;
    
    // Performance monitoring
    this.fps = 0;
    this.frameCount = 0;
    this.lastFpsUpdateTime = 0;
    
    // Detection settings
    this.detectionConfidence = 0.7;
    this.trackingConfidence = 0.7;
    this.enableSmoothing = true;
    this.modelType = 'full';
    
    // Bind methods
    this.onResults = this.onResults.bind(this);
  }

  /**
   * Initialize the pose detection
   * @param {HTMLVideoElement} videoElement - Video element for input
   * @param {HTMLCanvasElement} canvasElement - Canvas for drawing poses
   * @param {Function} callback - Callback function for pose results
   * @returns {boolean} - Success
   */
  async initialize(videoElement, canvasElement, callback) {
    if (this.isInitialized) {
      return true;
    }
    
    try {
      this.videoElement = videoElement;
      this.canvasElement = canvasElement;
      this.onPoseCallback = callback;
      
      // Set up canvas 2D context
      if (canvasElement) {
        this.canvasCtx = canvasElement.getContext('2d');
      }
      
      // Create pose instance
      this.poses = new Pose({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
        }
      });
      
      // Set up pose options
      this.poses.setOptions({
        modelComplexity: VirtualTryOn.Config.poseDetection.modelComplexity,
        smoothLandmarks: VirtualTryOn.Config.poseDetection.enableSmoothing,
        enableSegmentation: false,
        minDetectionConfidence: VirtualTryOn.Config.poseDetection.minPoseScore,
        minTrackingConfidence: VirtualTryOn.Config.poseDetection.minKeypointScore
      });
      
      // Set up result handling
      this.poses.onResults((results) => {
        this.onResults(results);
      });
      
      // Don't auto-start pose detection unless specifically configured to do so
      this.isInitialized = true;
      
      // Only auto-start if specifically configured to do so (default to false)
      const autoStart = VirtualTryOn.Config.poseDetection.autoStart === true;
      if (autoStart) {
        console.log('Auto-starting pose detection as configured');
        await this.start();
      } else {
        console.log('Pose detection initialized but waiting for explicit start');
      }
      
      return true;
    } catch (error) {
      console.error('Error initializing pose detection:', error);
      return false;
    }
  }

  /**
   * Start the pose detection loop
   */
  async start() {
    if (this.isRunning) return;
    
    // Request camera permission explicitly here
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        // This will trigger the permission dialog
        await navigator.mediaDevices.getUserMedia({ video: true });
        console.log("Camera permission granted");
      }
    } catch (error) {
      console.error("Camera permission denied:", error);
      alert("Camera access is required for virtual try-on. Please allow camera access and try again.");
      return;
    }
    
    this.isRunning = true;
    console.log("Starting pose detection");
    
    try {
      // Start the camera
      await this.camera.start();
      console.log("Camera started for pose detection");
    } catch (error) {
      console.error("Error starting camera:", error);
      this.isRunning = false;
    }
  }

  /**
   * Stop the pose detection loop
   */
  stop() {
    this.isRunning = false;
    if (this.camera) {
      this.camera.stop();
    }
    console.log("Pose detection stopped");
  }

  /**
   * Process the results from MediaPipe Pose
   * @param {Object} results - The results from MediaPipe Pose
   */
  onResults(results) {
    if (!results || !results.poseLandmarks) return;
    
    // Calculate FPS
    this.frameCount++;
    const now = performance.now();
    if (now - this.lastFpsUpdateTime > 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdateTime));
      this.frameCount = 0;
      this.lastFpsUpdateTime = now;
    }
    
    // Draw landmarks on canvas if available
    if (this.ctx && this.canvas) {
      this.ctx.save();
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      
      // Draw the pose landmarks
      if (results.poseLandmarks) {
        drawConnectors(this.ctx, results.poseLandmarks, POSE_CONNECTIONS,
                     {color: '#00FF00', lineWidth: 2});
        drawLandmarks(this.ctx, results.poseLandmarks,
                     {color: '#FF0000', lineWidth: 1, radius: 3});
      }
      
      this.ctx.restore();
    }
    
    // Convert landmarks to 3D keypoints
    const keypoints3D = this.extractKeypoints3D(results);
    
    // Call the callback with the detected pose
    if (this.onPoseDetectedCallback) {
      this.onPoseDetectedCallback(keypoints3D);
    }
    
    // Store the last pose time
    this.lastPoseTime = performance.now();
  }

  /**
   * Extract 3D keypoints from pose results
   * @param {Object} results - The results from MediaPipe Pose
   * @returns {Array} - Array of 3D keypoints
   */
  extractKeypoints3D(results) {
    if (!results.poseLandmarks || !results.poseWorldLandmarks) {
      return [];
    }
    
    // Combine visibility from poseLandmarks with 3D coordinates from poseWorldLandmarks
    return results.poseWorldLandmarks.map((landmark, i) => {
      const visibility = results.poseLandmarks[i].visibility || 0;
      return {
        x: landmark.x,
        y: landmark.y,
        z: landmark.z,
        visibility: visibility
      };
    });
  }

  /**
   * Get the current FPS
   * @returns {number} - Current FPS
   */
  getFPS() {
    return this.fps;
  }

  /**
   * Check if pose detection is running
   * @returns {boolean} - Whether pose detection is running
   */
  isDetecting() {
    return this.isRunning;
  }

  /**
   * Set detection confidence threshold
   * @param {number} confidence - Confidence threshold (0-1)
   */
  setDetectionConfidence(confidence) {
    this.detectionConfidence = Math.max(0, Math.min(1, confidence));
    if (this.detector) {
      this.detector.setOptions({
        minDetectionConfidence: this.detectionConfidence
      });
    }
  }

  /**
   * Set tracking confidence threshold
   * @param {number} confidence - Confidence threshold (0-1)
   */
  setTrackingConfidence(confidence) {
    this.trackingConfidence = Math.max(0, Math.min(1, confidence));
    if (this.detector) {
      this.detector.setOptions({
        minTrackingConfidence: this.trackingConfidence
      });
    }
  }

  /**
   * Enable or disable landmark smoothing
   * @param {boolean} enable - Whether to enable smoothing
   */
  setSmoothing(enable) {
    this.enableSmoothing = enable;
    if (this.detector) {
      this.detector.setOptions({
        smoothLandmarks: this.enableSmoothing
      });
    }
  }

  /**
   * Set model complexity
   * @param {string} type - Model type ('lite', 'full', or 'heavy')
   */
  setModelComplexity(type) {
    let complexity = 1; // Default to 'full'
    
    switch (type) {
      case 'lite':
        complexity = 0;
        break;
      case 'full':
        complexity = 1;
        break;
      case 'heavy':
        complexity = 2;
        break;
    }
    
    this.modelType = type;
    
    if (this.detector) {
      this.detector.setOptions({
        modelComplexity: complexity
      });
    }
  }
}

// Export as a singleton
export default new PoseDetection();