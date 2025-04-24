/**
 * ClothingFit.js
 * Handles the fitting of 3D clothing models to the user's body based on pose landmarks
 */

import * as THREE from 'three';

class ClothingFit {
  constructor() {
    // Smoothing parameters
    this.smoothingFactor = 0.8; // Higher = more smoothing
    this.previousTransforms = new Map();
    
    // Body measurements
    this.userMeasurements = {
      shoulderWidth: 0,
      torsoLength: 0,
      armLength: 0,
      legLength: 0,
      hipWidth: 0
    };
    
    // Calibration status
    this.isCalibrated = false;
    
    // Fit quality indicators
    this.fitQuality = {
      overall: 0, // 0-1 scale
      shoulders: 0,
      torso: 0,
      arms: 0,
      legs: 0
    };
  }

  /**
   * Update clothing model position and orientation based on pose landmarks
   * @param {Object} model - THREE.js model to update
   * @param {Array} keypoints - Array of 3D keypoints from pose detection
   * @param {Object} baseMeasurements - Base measurements for scaling
   * @param {Object} options - Additional options for fitting
   */
  updateModelFit(model, keypoints, baseMeasurements, options = {}) {
    if (!model || !keypoints || keypoints.length < 33) {
      return;
    }
    
    // Extract options
    const {
      sizeAdjustment = 1.0,
      modelType = 'tshirt',
    } = options;
    
    // Get key landmarks
    const leftShoulder = this.keypointToVector3(keypoints[11]);
    const rightShoulder = this.keypointToVector3(keypoints[12]);
    const leftHip = this.keypointToVector3(keypoints[23]);
    const rightHip = this.keypointToVector3(keypoints[24]);
    const leftElbow = this.keypointToVector3(keypoints[13]);
    const rightElbow = this.keypointToVector3(keypoints[14]);
    const leftWrist = this.keypointToVector3(keypoints[15]);
    const rightWrist = this.keypointToVector3(keypoints[16]);
    const leftKnee = this.keypointToVector3(keypoints[25]);
    const rightKnee = this.keypointToVector3(keypoints[26]);
    const leftAnkle = this.keypointToVector3(keypoints[27]);
    const rightAnkle = this.keypointToVector3(keypoints[28]);
    
    // Calculate body measurements
    this.calculateBodyMeasurements(keypoints);
    
    // Calculate midpoints
    const shoulderMidpoint = new THREE.Vector3().addVectors(leftShoulder, rightShoulder).multiplyScalar(0.5);
    const hipMidpoint = new THREE.Vector3().addVectors(leftHip, rightHip).multiplyScalar(0.5);
    
    // Calculate model position based on model type
    let targetPosition;
    let targetRotation;
    let targetScale;
    
    switch (modelType) {
      case 'tshirt':
      case 'shirt':
        // Position at torso midpoint
        targetPosition = new THREE.Vector3().addVectors(shoulderMidpoint, hipMidpoint).multiplyScalar(0.5);
        
        // Calculate shoulder width and torso length for scaling
        const shoulderWidth = leftShoulder.distanceTo(rightShoulder);
        const torsoLength = shoulderMidpoint.distanceTo(hipMidpoint);
        
        // Scale based on shoulder width and torso length
        const shoulderScale = shoulderWidth / baseMeasurements.shoulderWidth;
        const torsoScale = torsoLength / baseMeasurements.torsoLength;
        targetScale = new THREE.Vector3(
          shoulderScale * sizeAdjustment,
          torsoScale * sizeAdjustment,
          (shoulderScale + torsoScale) / 2 * sizeAdjustment
        );
        
        // Calculate rotation to face forward
        const shoulderVector = new THREE.Vector3().subVectors(rightShoulder, leftShoulder).normalize();
        const upVector = new THREE.Vector3().subVectors(shoulderMidpoint, hipMidpoint).normalize();
        const forwardVector = new THREE.Vector3().crossVectors(shoulderVector, upVector).normalize();
        
        // Create rotation matrix
        const rotationMatrix = new THREE.Matrix4().makeBasis(
          shoulderVector,
          upVector,
          forwardVector
        );
        targetRotation = new THREE.Quaternion().setFromRotationMatrix(rotationMatrix);
        break;
        
      case 'jacket':
      case 'hoodie':
        // Similar to shirt but with slightly different positioning
        targetPosition = new THREE.Vector3().addVectors(shoulderMidpoint, hipMidpoint).multiplyScalar(0.5);
        
        // Calculate shoulder width and torso length for scaling
        const jacketShoulderWidth = leftShoulder.distanceTo(rightShoulder);
        const jacketTorsoLength = shoulderMidpoint.distanceTo(hipMidpoint);
        
        // Scale based on shoulder width and torso length with slightly larger fit
        const jacketShoulderScale = (jacketShoulderWidth / baseMeasurements.shoulderWidth) * 1.1;
        const jacketTorsoScale = (jacketTorsoLength / baseMeasurements.torsoLength) * 1.05;
        targetScale = new THREE.Vector3(
          jacketShoulderScale * sizeAdjustment,
          jacketTorsoScale * sizeAdjustment,
          (jacketShoulderScale + jacketTorsoScale) / 2 * sizeAdjustment
        );
        
        // Calculate rotation to face forward
        const jacketShoulderVector = new THREE.Vector3().subVectors(rightShoulder, leftShoulder).normalize();
        const jacketUpVector = new THREE.Vector3().subVectors(shoulderMidpoint, hipMidpoint).normalize();
        const jacketForwardVector = new THREE.Vector3().crossVectors(jacketShoulderVector, jacketUpVector).normalize();
        
        // Create rotation matrix
        const jacketRotationMatrix = new THREE.Matrix4().makeBasis(
          jacketShoulderVector,
          jacketUpVector,
          jacketForwardVector
        );
        targetRotation = new THREE.Quaternion().setFromRotationMatrix(jacketRotationMatrix);
        break;
        
      case 'pants':
        // Position at hip midpoint
        targetPosition = hipMidpoint.clone();
        
        // Calculate hip width and leg length for scaling
        const hipWidth = leftHip.distanceTo(rightHip);
        const legLength = (leftHip.distanceTo(leftAnkle) + rightHip.distanceTo(rightAnkle)) / 2;
        
        // Scale based on hip width and leg length
        const hipScale = hipWidth / baseMeasurements.hipWidth;
        const legScale = legLength / baseMeasurements.legLength;
        targetScale = new THREE.Vector3(
          hipScale * sizeAdjustment,
          legScale * sizeAdjustment,
          hipScale * sizeAdjustment
        );
        
        // Calculate rotation to align with legs
        const hipVector = new THREE.Vector3().subVectors(rightHip, leftHip).normalize();
        const legVector = new THREE.Vector3().subVectors(hipMidpoint, new THREE.Vector3().addVectors(leftAnkle, rightAnkle).multiplyScalar(0.5)).normalize();
        const pantsForwardVector = new THREE.Vector3().crossVectors(hipVector, legVector).normalize();
        
        // Create rotation matrix
        const pantsRotationMatrix = new THREE.Matrix4().makeBasis(
          hipVector,
          legVector.negate(),
          pantsForwardVector
        );
        targetRotation = new THREE.Quaternion().setFromRotationMatrix(pantsRotationMatrix);
        break;
        
      default:
        // Default positioning
        targetPosition = shoulderMidpoint.clone();
        targetScale = new THREE.Vector3(1, 1, 1).multiplyScalar(sizeAdjustment);
        targetRotation = new THREE.Quaternion();
    }
    
    // Apply smoothing
    const modelId = model.uuid;
    if (!this.previousTransforms.has(modelId)) {
      this.previousTransforms.set(modelId, {
        position: targetPosition.clone(),
        rotation: targetRotation.clone(),
        scale: targetScale.clone()
      });
    }
    
    const previousTransform = this.previousTransforms.get(modelId);
    
    // Smooth position
    model.position.lerp(targetPosition, 1 - this.smoothingFactor);
    previousTransform.position.copy(model.position);
    
    // Smooth rotation
    model.quaternion.slerp(targetRotation, 1 - this.smoothingFactor);
    previousTransform.rotation.copy(model.quaternion);
    
    // Smooth scale
    model.scale.lerp(targetScale, 1 - this.smoothingFactor);
    previousTransform.scale.copy(model.scale);
    
    // Calculate fit quality
    this.calculateFitQuality(modelType, keypoints, model);
    
    return {
      position: model.position.clone(),
      rotation: model.quaternion.clone(),
      scale: model.scale.clone(),
      fitQuality: this.fitQuality
    };
  }

  /**
   * Convert a keypoint to a THREE.Vector3
   * @param {Object} keypoint - Keypoint from pose detection
   * @returns {THREE.Vector3} - Vector3 representation
   */
  keypointToVector3(keypoint) {
    if (!keypoint || typeof keypoint.x !== 'number') {
      return new THREE.Vector3();
    }
    
    // Convert to THREE.js coordinate system (Y-up)
    return new THREE.Vector3(
      keypoint.x,
      -keypoint.y,
      -keypoint.z
    );
  }

  /**
   * Calculate body measurements from keypoints
   * @param {Array} keypoints - Array of keypoints from pose detection
   */
  calculateBodyMeasurements(keypoints) {
    if (!keypoints || keypoints.length < 33) {
      return;
    }
    
    // Get key landmarks
    const leftShoulder = this.keypointToVector3(keypoints[11]);
    const rightShoulder = this.keypointToVector3(keypoints[12]);
    const leftHip = this.keypointToVector3(keypoints[23]);
    const rightHip = this.keypointToVector3(keypoints[24]);
    const leftElbow = this.keypointToVector3(keypoints[13]);
    const rightElbow = this.keypointToVector3(keypoints[14]);
    const leftWrist = this.keypointToVector3(keypoints[15]);
    const rightWrist = this.keypointToVector3(keypoints[16]);
    const leftKnee = this.keypointToVector3(keypoints[25]);
    const rightKnee = this.keypointToVector3(keypoints[26]);
    const leftAnkle = this.keypointToVector3(keypoints[27]);
    const rightAnkle = this.keypointToVector3(keypoints[28]);
    
    // Calculate midpoints
    const shoulderMidpoint = new THREE.Vector3().addVectors(leftShoulder, rightShoulder).multiplyScalar(0.5);
    const hipMidpoint = new THREE.Vector3().addVectors(leftHip, rightHip).multiplyScalar(0.5);
    
    // Calculate measurements
    this.userMeasurements.shoulderWidth = leftShoulder.distanceTo(rightShoulder);
    this.userMeasurements.hipWidth = leftHip.distanceTo(rightHip);
    this.userMeasurements.torsoLength = shoulderMidpoint.distanceTo(hipMidpoint);
    
    // Average arm length (shoulder to wrist)
    const leftArmLength = leftShoulder.distanceTo(leftElbow) + leftElbow.distanceTo(leftWrist);
    const rightArmLength = rightShoulder.distanceTo(rightElbow) + rightElbow.distanceTo(rightWrist);
    this.userMeasurements.armLength = (leftArmLength + rightArmLength) / 2;
    
    // Average leg length (hip to ankle)
    const leftLegLength = leftHip.distanceTo(leftKnee) + leftKnee.distanceTo(leftAnkle);
    const rightLegLength = rightHip.distanceTo(rightKnee) + rightKnee.distanceTo(rightAnkle);
    this.userMeasurements.legLength = (leftLegLength + rightLegLength) / 2;
  }

  /**
   * Calibrate the body measurements in T-pose
   * @param {Array} keypoints - Array of keypoints from pose detection
   * @returns {boolean} - Whether calibration was successful
   */
  calibrate(keypoints) {
    if (!keypoints || keypoints.length < 33) {
      return false;
    }
    
    // Check if user is in T-pose
    const isTpose = this.checkTpose(keypoints);
    if (!isTpose) {
      return false;
    }
    
    // Calculate body measurements
    this.calculateBodyMeasurements(keypoints);
    
    // Set calibration status
    this.isCalibrated = true;
    
    return true;
  }

  /**
   * Check if user is in T-pose
   * @param {Array} keypoints - Array of keypoints from pose detection
   * @returns {boolean} - Whether user is in T-pose
   */
  checkTpose(keypoints) {
    if (!keypoints || keypoints.length < 33) {
      return false;
    }
    
    // Get key landmarks
    const leftShoulder = this.keypointToVector3(keypoints[11]);
    const rightShoulder = this.keypointToVector3(keypoints[12]);
    const leftElbow = this.keypointToVector3(keypoints[13]);
    const rightElbow = this.keypointToVector3(keypoints[14]);
    const leftWrist = this.keypointToVector3(keypoints[15]);
    const rightWrist = this.keypointToVector3(keypoints[16]);
    const leftHip = this.keypointToVector3(keypoints[23]);
    const rightHip = this.keypointToVector3(keypoints[24]);
    
    // Calculate vectors
    const leftArmVector = new THREE.Vector3().subVectors(leftWrist, leftShoulder).normalize();
    const rightArmVector = new THREE.Vector3().subVectors(rightWrist, rightShoulder).normalize();
    const torsoVector = new THREE.Vector3().subVectors(
      new THREE.Vector3().addVectors(leftShoulder, rightShoulder).multiplyScalar(0.5),
      new THREE.Vector3().addVectors(leftHip, rightHip).multiplyScalar(0.5)
    ).normalize();
    
    // Check if arms are horizontal (perpendicular to torso)
    const leftDot = Math.abs(leftArmVector.dot(torsoVector));
    const rightDot = Math.abs(rightArmVector.dot(torsoVector));
    
    // Arms should be close to perpendicular to torso (dot product close to 0)
    const armThreshold = 0.3; // Allow some deviation from perfect perpendicular
    
    return leftDot < armThreshold && rightDot < armThreshold;
  }

  /**
   * Calculate fit quality metrics
   * @param {string} modelType - Type of model
   * @param {Array} keypoints - Array of keypoints from pose detection
   * @param {Object} model - THREE.js model
   */
  calculateFitQuality(modelType, keypoints, model) {
    if (!keypoints || keypoints.length < 33 || !model) {
      return;
    }
    
    // Reset fit quality
    this.fitQuality = {
      overall: 0,
      shoulders: 0,
      torso: 0,
      arms: 0,
      legs: 0
    };
    
    // Calculate fit quality based on model type
    switch (modelType) {
      case 'tshirt':
      case 'shirt':
        // Shoulder fit
        const shoulderRatio = this.userMeasurements.shoulderWidth / (model.scale.x * 0.4);
        this.fitQuality.shoulders = this.calculateQualityScore(shoulderRatio, 0.9, 1.1);
        
        // Torso fit
        const torsoRatio = this.userMeasurements.torsoLength / (model.scale.y * 0.6);
        this.fitQuality.torso = this.calculateQualityScore(torsoRatio, 0.9, 1.1);
        
        // Overall fit (weighted average)
        this.fitQuality.overall = (this.fitQuality.shoulders * 0.6 + this.fitQuality.torso * 0.4);
        break;
        
      case 'jacket':
      case 'hoodie':
        // Shoulder fit (jackets should be slightly larger)
        const jacketShoulderRatio = this.userMeasurements.shoulderWidth / (model.scale.x * 0.44);
        this.fitQuality.shoulders = this.calculateQualityScore(jacketShoulderRatio, 0.85, 1.05);
        
        // Torso fit
        const jacketTorsoRatio = this.userMeasurements.torsoLength / (model.scale.y * 0.63);
        this.fitQuality.torso = this.calculateQualityScore(jacketTorsoRatio, 0.85, 1.05);
        
        // Arm fit
        const armRatio = this.userMeasurements.armLength / (model.scale.x * 0.7);
        this.fitQuality.arms = this.calculateQualityScore(armRatio, 0.9, 1.1);
        
        // Overall fit (weighted average)
        this.fitQuality.overall = (this.fitQuality.shoulders * 0.4 + this.fitQuality.torso * 0.3 + this.fitQuality.arms * 0.3);
        break;
        
      case 'pants':
        // Hip fit
        const hipRatio = this.userMeasurements.hipWidth / (model.scale.x * 0.4);
        this.fitQuality.torso = this.calculateQualityScore(hipRatio, 0.9, 1.1);
        
        // Leg fit
        const legRatio = this.userMeasurements.legLength / (model.scale.y * 0.9);
        this.fitQuality.legs = this.calculateQualityScore(legRatio, 0.9, 1.1);
        
        // Overall fit (weighted average)
        this.fitQuality.overall = (this.fitQuality.torso * 0.4 + this.fitQuality.legs * 0.6);
        break;
    }
  }

  /**
   * Calculate a quality score based on a ratio
   * @param {number} ratio - Measurement ratio
   * @param {number} minIdeal - Minimum ideal ratio
   * @param {number} maxIdeal - Maximum ideal ratio
   * @returns {number} - Quality score (0-1)
   */
  calculateQualityScore(ratio, minIdeal, maxIdeal) {
    if (ratio >= minIdeal && ratio <= maxIdeal) {
      // Perfect fit
      return 1.0;
    } else if (ratio < minIdeal) {
      // Too small
      const deviation = minIdeal - ratio;
      return Math.max(0, 1 - deviation * 2);
    } else {
      // Too large
      const deviation = ratio - maxIdeal;
      return Math.max(0, 1 - deviation * 2);
    }
  }

  /**
   * Get the current body measurements
   * @returns {Object} - User measurements
   */
  getMeasurements() {
    return { ...this.userMeasurements };
  }

  /**
   * Get the current fit quality
   * @returns {Object} - Fit quality metrics
   */
  getFitQuality() {
    return { ...this.fitQuality };
  }

  /**
   * Check if the body is calibrated
   * @returns {boolean} - Whether body is calibrated
   */
  isBodyCalibrated() {
    return this.isCalibrated;
  }

  /**
   * Set the smoothing factor for model movement
   * @param {number} factor - Smoothing factor (0-1)
   */
  setSmoothingFactor(factor) {
    this.smoothingFactor = Math.max(0, Math.min(1, factor));
  }
}

// Export as a singleton
export default new ClothingFit();