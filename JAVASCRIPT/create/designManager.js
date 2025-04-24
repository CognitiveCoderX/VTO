// Design Manager Module
import { generatePatternTexture, applyTextureToModel } from './textureGenerator.js';

// Initialize design selection functionality
export function initializeDesignSelection() {
    const designOptions = document.getElementById('design-selection');
    const patternOptions = document.querySelectorAll('.pattern-option');
    const stickerOptions = document.querySelectorAll('.sticker-option');
    const patternColor = document.getElementById('pattern-color');
    const patternScale = document.getElementById('pattern-scale');
    const patternScaleValue = document.getElementById('pattern-scale-value');
    const patternRotation = document.getElementById('pattern-rotation');
    const patternRotationValue = document.getElementById('pattern-rotation-value');
    const applyDesignButton = document.getElementById('apply-design');
    const resetDesignButton = document.getElementById('reset-design');

    let selectedPattern = null;
    let selectedSticker = null;
    let selectedDesignType = null; // 'pattern' or 'sticker'

    // Pattern selection event listeners
    patternOptions.forEach(option => {
        option.addEventListener('click', () => {
            // Remove selected class from all options
            patternOptions.forEach(opt => opt.classList.remove('selected'));
            stickerOptions.forEach(opt => opt.classList.remove('selected'));
            
            // Add selected class to clicked option
            option.classList.add('selected');
            selectedPattern = option.dataset.pattern;
            selectedSticker = null;
            selectedDesignType = 'pattern';
            
            // Update preview with current settings
            updatePatternPreview();
        });
    });
    
    // Sticker selection event listeners
    stickerOptions.forEach(option => {
        option.addEventListener('click', () => {
            // Remove selected class from all options
            patternOptions.forEach(opt => opt.classList.remove('selected'));
            stickerOptions.forEach(opt => opt.classList.remove('selected'));
            
            // Add selected class to clicked option
            option.classList.add('selected');
            selectedSticker = option.dataset.sticker;
            selectedPattern = null;
            selectedDesignType = 'sticker';
            
            // Update preview with current settings
            updateStickerPreview();
        });
    });

    // Pattern color change handler
    patternColor.addEventListener('input', (e) => {
        updatePatternPreview();
    });

    // Pattern scale change handler
    patternScale.addEventListener('input', (e) => {
        patternScaleValue.textContent = `${e.target.value}x`;
        updatePatternPreview();
    });
    
    // Pattern rotation change handler
    patternRotation.addEventListener('input', (e) => {
        patternRotationValue.textContent = `${e.target.value}°`;
        updatePatternPreview();
    });

    // Get position selector if it exists, or create one if it doesn't
    let patternPosition = document.getElementById('pattern-position');
    if (!patternPosition) {
        // Create position selector
        const positionContainer = document.createElement('div');
        positionContainer.className = 'pattern-position-control';
        
        const positionLabel = document.createElement('label');
        positionLabel.textContent = 'Position:';
        
        patternPosition = document.createElement('select');
        patternPosition.id = 'pattern-position';
        
        // Add position options
        const positions = [
            { value: 'all', text: 'Entire Shirt' },
            { value: 'front', text: 'Front Only' },
            { value: 'back', text: 'Back Only' },
            { value: 'sleeves', text: 'Sleeves Only' }
        ];
        
        positions.forEach(pos => {
            const option = document.createElement('option');
            option.value = pos.value;
            option.textContent = pos.text;
            patternPosition.appendChild(option);
        });
        
        positionLabel.appendChild(patternPosition);
        positionContainer.appendChild(positionLabel);
        
        // Add to pattern controls
        const patternControls = document.querySelector('.pattern-controls');
        if (patternControls) {
            patternControls.insertBefore(positionContainer, document.querySelector('.apply-controls'));
        }
    }
    
    // Apply design button handler
    applyDesignButton.addEventListener('click', () => {
        // Get the selected position
        const position = patternPosition ? patternPosition.value : 'all';
        
        if (selectedDesignType === 'pattern' && selectedPattern) {
            applyDesignToProduct(selectedPattern, {
                color: patternColor.value,
                scale: patternScale.value,
                rotation: patternRotation.value,
                position: position,
                type: 'pattern'
            });
        } else if (selectedDesignType === 'sticker' && selectedSticker) {
            applyDesignToProduct(selectedSticker, {
                scale: patternScale.value,
                rotation: patternRotation.value,
                position: position,
                type: 'sticker'
            });
        } else {
            alert('Please select a design first');
        }
    });
    
    // Reset design button handler
    resetDesignButton.addEventListener('click', () => {
        resetDesignSelection();
    });
    
    // Function to update pattern preview based on current settings
    function updatePatternPreview() {
        if (selectedPattern) {
            applyPatternColor(selectedPattern, patternColor.value);
            applyPatternScale(selectedPattern, patternScale.value);
            applyPatternRotation(selectedPattern, patternRotation.value);
        }
    }
    
    // Function to update sticker preview based on current settings
    function updateStickerPreview() {
        if (selectedSticker) {
            // Apply scale and rotation to sticker preview
            const stickerPreview = document.querySelector(`.sticker-option[data-sticker="${selectedSticker}"] img`);
            if (stickerPreview) {
                stickerPreview.style.transform = `scale(${patternScale.value}) rotate(${patternRotation.value}deg)`;
            }
        }
    }
    
    // Function to reset design selection
    function resetDesignSelection() {
        patternOptions.forEach(opt => opt.classList.remove('selected'));
        stickerOptions.forEach(opt => opt.classList.remove('selected'));
        selectedPattern = null;
        selectedSticker = null;
        selectedDesignType = null;
        patternColor.value = '#000000';
        patternScale.value = '1';
        patternScaleValue.textContent = '1x';
        patternRotation.value = '0';
        patternRotationValue.textContent = '0°';
        
        // Reset sticker transformations
        document.querySelectorAll('.sticker-option img').forEach(img => {
            img.style.transform = '';
        });
    }
}

// Initialize upload design functionality
export function initializeUploadDesign() {
    const uploadInput = document.getElementById('upload-design-input');
    const uploadPreview = document.getElementById('upload-preview');

    uploadInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    img.alt = 'Uploaded design preview';
                    uploadPreview.innerHTML = '';
                    uploadPreview.appendChild(img);
                    
                    // Enable design customization after upload
                    enableDesignCustomization(img);
                };
                reader.readAsDataURL(file);
            } else {
                alert('Please upload an image file');
                uploadInput.value = '';
            }
        }
    });
}

// Apply pattern color to the design
function applyPatternColor(pattern, color) {
    const previewElement = document.querySelector(`.pattern-preview.${pattern}`);
    if (previewElement) {
        previewElement.style.setProperty('--pattern-color', color);
    }
}

// Apply pattern scale to the design
function applyPatternScale(pattern, scale) {
    const previewElement = document.querySelector(`.pattern-preview.${pattern}`);
    if (previewElement) {
        previewElement.style.setProperty('--pattern-scale', scale);
    }
}

// Apply pattern rotation to the design
function applyPatternRotation(pattern, rotation) {
    const previewElement = document.querySelector(`.pattern-preview.${pattern}`);
    if (previewElement) {
        previewElement.style.transform = `rotate(${rotation}deg)`;
    }
}

// Apply the selected design to the product
function applyDesignToProduct(designId, options) {
    // Get the model viewer element
    const modelViewer = document.getElementById('gltf-viewer');
    
    if (!modelViewer) {
        console.error('Model viewer not found');
        return;
    }
    
    // Show loading indicator
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'loading-indicator';
    loadingIndicator.innerHTML = '<span>Applying design...</span>';
    document.querySelector('.preview_container').appendChild(loadingIndicator);
    
    // Check if the model is loaded
    if (!modelViewer.model) {
        console.error('3D model not loaded yet');
        alert('Please wait for the 3D model to load completely');
        loadingIndicator.remove();
        return;
    }
    
    // Use the texture generator functions
    try {
        if (options.type === 'pattern') {
            // Determine position to apply the pattern (default to 'all')
            const position = options.position || 'all';
            
            // Generate a texture based on the pattern
            const patternTexture = generatePatternTexture(designId, {
                color: options.color,
                scale: options.scale,
                rotation: options.rotation
            });
            
            // Ensure the model is ready for texture application
            ensureModelReadiness(modelViewer);
            
            // Apply the texture directly to the 3D model
            applyTextureToModel(modelViewer, patternTexture, {
                type: 'pattern',
                position: position,
                scale: options.scale,
                rotation: options.rotation,
                color: options.color
            });
            
            // Apply texture directly to ensure visibility
            const textureUrl = patternTexture.toDataURL('image/png', 1.0);
            const materials = modelViewer.model.materials;
            
            // Define material indices based on shirt parts
            const materialIndices = {
                all: [0, 1, 2, 3], // All except buttons
                front: [0],        // Main body front
                back: [2],         // Back
                sleeves: [1],      // Sleeves
                cuffs: [3]         // Cuffs
            };
            
            // Determine which materials to apply texture to
            const targetIndices = materialIndices[position] || materialIndices.all;
            
            // Apply texture directly to each material with enhanced settings
            targetIndices.forEach(i => {
                if (i < materials.length) {
                    // Set base material to white for better pattern visibility
                    modelViewer.setAttribute(`material-${i}-color`, '#ffffff');
                    
                    // Apply texture with high intensity and normal blend mode
                    modelViewer.setAttribute(`material-${i}-map`, textureUrl);
                    modelViewer.setAttribute(`material-${i}-mapIntensity`, '15.0'); // Increased from 10.0 to 15.0 for better visibility
                    modelViewer.setAttribute(`material-${i}-blend-mode`, 'normal');
                    
                    // Set material properties for maximum visibility
                    modelViewer.setAttribute(`material-${i}-metalness`, '0.0');
                    modelViewer.setAttribute(`material-${i}-roughness`, '0.3'); // Reduced roughness for better visibility
                    modelViewer.setAttribute(`material-${i}-opacity`, '1.0');
                    modelViewer.setAttribute(`material-${i}-emissiveIntensity`, '0.3'); // Added emissive effect
                    modelViewer.setAttribute(`material-${i}-clearcoat`, '0.3'); // Added clearcoat for better reflection
                    
                    // Apply scale and rotation with enhanced values
                    const tileScale = parseFloat(options.scale) * 3; // Triple scale for better visibility
                    modelViewer.setAttribute(`material-${i}-mapTiling`, `${tileScale} ${tileScale}`);
                    
                    if (options.rotation !== 0) {
                        modelViewer.setAttribute(`material-${i}-mapRotation`, options.rotation);
                    }
                    
                    console.log(`Direct texture application to material ${i}`);
                }
            });
            
            // Force model update
            modelViewer.needsUpdate = true;
            
            // Add a listener to check if texture was applied successfully
            modelViewer.addEventListener('texture-applied', function onTextureApplied(event) {
                console.log('Texture applied event received', event.detail);
                modelViewer.removeEventListener('texture-applied', onTextureApplied);
                
                // Remove loading indicator
                if (loadingIndicator) loadingIndicator.remove();
                
                // Verify texture application and retry if needed
                setTimeout(() => {
                    verifyTextureApplication(modelViewer, patternTexture, options, designId);
                }, 500);
                
                // Show success message
                const successMessage = document.createElement('div');
                successMessage.className = 'success-message';
                successMessage.innerHTML = '<span>Design applied successfully!</span>';
                document.querySelector('.preview_container').appendChild(successMessage);
                
                // Remove success message after 2 seconds
                setTimeout(() => {
                    if (successMessage) successMessage.remove();
                }, 2000);
            }, { once: true });
            
            // Show success message
            console.log(`Applied ${designId} pattern directly to the 3D model`);
            
            // Notify the user
            const notification = document.createElement('div');
            notification.className = 'design-notification';
            notification.textContent = `${designId.replace('-', ' ')} pattern applied to product`;
            notification.style.position = 'fixed';
            notification.style.bottom = '20px';
            notification.style.left = '50%';
            notification.style.transform = 'translateX(-50%)';
            notification.style.backgroundColor = '#e94560';
            notification.style.color = 'white';
            notification.style.padding = '10px 20px';
            notification.style.borderRadius = '5px';
            notification.style.zIndex = '1000';
            document.body.appendChild(notification);
            
            // Remove notification after 3 seconds
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 3000);
        }
    } catch (error) {
        console.error('Error applying design to product:', error);
        alert('Failed to apply design. Please try again.');
        if (loadingIndicator) loadingIndicator.remove();
    }
    
    if (options.type === 'sticker') {
        // Show loading indicator
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'loading-indicator';
        loadingIndicator.innerHTML = '<span>Applying sticker...</span>';
        document.querySelector('.preview_container').appendChild(loadingIndicator);
        
        // Determine position to apply the sticker (default to 'front')
        const position = options.position || 'front';
        
        // Create a canvas to draw the sticker
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas size (power of 2 for better texture performance)
        canvas.width = 1024;
        canvas.height = 1024;
        
        // Clear canvas with transparent background
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Load the sticker image
        const stickerImg = new Image();
        stickerImg.crossOrigin = 'Anonymous';
        stickerImg.src = `/images/stickers/${designId}.svg`;
        
        stickerImg.onload = function() {
            // Calculate position to center the sticker
            const scale = options.scale || 1;
            const rotation = options.rotation || 0;
            const stickerWidth = stickerImg.width * scale * 2; // Increase size for better visibility
            const stickerHeight = stickerImg.height * scale * 2;
            const x = (canvas.width - stickerWidth) / 2;
            const y = (canvas.height - stickerHeight) / 2;
            
            // Apply rotation if needed
            if (rotation !== 0) {
                ctx.save();
                ctx.translate(canvas.width / 2, canvas.height / 2);
                ctx.rotate(rotation * Math.PI / 180);
                ctx.translate(-canvas.width / 2, -canvas.height / 2);
            }
            
            // Draw the sticker on the canvas
            ctx.drawImage(stickerImg, x, y, stickerWidth, stickerHeight);
            
            // Restore rotation if applied
            if (rotation !== 0) {
                ctx.restore();
            }
            
            // Apply the texture to the 3D model
            applyTextureToModel(modelViewer, canvas, {
                type: 'sticker',
                position: position,
                scale: scale,
                rotation: rotation
            });
            
            // Add a listener to check if texture was applied successfully
            modelViewer.addEventListener('texture-applied', function onTextureApplied(event) {
                console.log('Sticker applied event received', event.detail);
                modelViewer.removeEventListener('texture-applied', onTextureApplied);
                
                // Remove loading indicator
                if (loadingIndicator) loadingIndicator.remove();
                
                // Show success message
                const successMessage = document.createElement('div');
                successMessage.className = 'success-message';
                successMessage.innerHTML = '<span>Sticker applied successfully!</span>';
                document.querySelector('.preview_container').appendChild(successMessage);
                
                // Remove success message after 2 seconds
                setTimeout(() => {
                    if (successMessage) successMessage.remove();
                }, 2000);
                
                // Notify the user
                const notification = document.createElement('div');
                notification.className = 'design-notification';
                notification.textContent = `${designId} sticker applied to product`;
                notification.style.position = 'fixed';
                notification.style.bottom = '20px';
                notification.style.left = '50%';
                notification.style.transform = 'translateX(-50%)';
                notification.style.backgroundColor = '#e94560';
                notification.style.color = 'white';
                notification.style.padding = '10px 20px';
                notification.style.borderRadius = '5px';
                notification.style.zIndex = '1000';
                document.body.appendChild(notification);
                
                // Remove notification after 3 seconds
                setTimeout(() => {
                    document.body.removeChild(notification);
                }, 3000);
            }, { once: true });
        };
        
        stickerImg.onerror = function() {
            console.error(`Failed to load sticker image: ${designId}`);
            if (loadingIndicator) loadingIndicator.remove();
            alert('Failed to load sticker image. Please try again.');
        };
    }
}

// Ensure the model is ready for texture application
function ensureModelReadiness(modelViewer) {
    // Check if model is loaded and has materials
    if (!modelViewer.model || !modelViewer.model.materials || modelViewer.model.materials.length === 0) {
        console.warn('Model not fully loaded, waiting...');
        
        // Set a flag to indicate we're waiting for the model
        modelViewer.dataset.waitingForModel = 'true';
        
        // Add a load event listener if not already loaded
        if (!modelViewer.model) {
            modelViewer.addEventListener('load', () => {
                console.log('Model loaded, now applying texture');
                modelViewer.dataset.waitingForModel = 'false';
            }, { once: true });
        }
    }
}

// Verify texture application and retry if needed
function verifyTextureApplication(modelViewer, patternTexture, options, designId) {
    console.log('Verifying texture application for', designId);
    
    // Always retry with a direct approach regardless of previous application
    // Generate high-quality texture data URL
    const textureUrl = patternTexture.toDataURL('image/png', 1.0);
    
    // Apply texture directly to all materials
    if (modelViewer.model && modelViewer.model.materials) {
        const materials = modelViewer.model.materials;
        
        // Define material indices based on shirt parts
        // 0: Main Body, 1: Sleeves, 2: Back, 3: Cuffs, 5: Buttons
        const materialIndices = {
            all: [0, 1, 2, 3], // All except buttons
            front: [0],        // Main body front
            back: [2],         // Back
            sleeves: [1],      // Sleeves
            cuffs: [3]         // Cuffs
        };
        
        // Determine which materials to apply texture to
        const position = options.position || 'all';
        const targetIndices = materialIndices[position] || materialIndices.all;
        
        // Apply texture directly to each material
        targetIndices.forEach(i => {
            if (i < materials.length) {
                try {
                    // Reset material to ensure clean application
                    modelViewer.setAttribute(`material-${i}-color`, '#ffffff');
                    
                    // Apply texture with high intensity
                    modelViewer.setAttribute(`material-${i}-map`, textureUrl);
                    modelViewer.setAttribute(`material-${i}-mapIntensity`, '5.0');
                    
                    // Set material properties for better visibility
                    modelViewer.setAttribute(`material-${i}-metalness`, '0.0');
                    modelViewer.setAttribute(`material-${i}-roughness`, '0.3'); // Reduced roughness for better visibility
                    modelViewer.setAttribute(`material-${i}-opacity`, '1.0');
                    modelViewer.setAttribute(`material-${i}-emissiveIntensity`, '0.3'); // Added emissive effect
                    modelViewer.setAttribute(`material-${i}-clearcoat`, '0.3'); // Added clearcoat for better reflection
                    
                    // Apply scale and rotation
                    const tileScale = options.scale * 2;
                    modelViewer.setAttribute(`material-${i}-mapTiling`, `${tileScale} ${tileScale}`);
                    
                    if (options.rotation !== 0) {
                        modelViewer.setAttribute(`material-${i}-mapRotation`, options.rotation);
                    }
                    
                    // Use normal blend mode for better visibility
                    modelViewer.setAttribute(`material-${i}-blend-mode`, 'normal');
                    
                    console.log(`Direct texture application to material ${i} successful`);
                } catch (error) {
                    console.error(`Error applying texture to material ${i}:`, error);
                }
            }
        });
        
        // Force model update
        modelViewer.needsUpdate = true;
        
        // Try to access and modify the material directly as a fallback
        try {
            // Access materials directly through Three.js API if available
            const threeMaterials = modelViewer.model.materials;
            targetIndices.forEach(i => {
                if (threeMaterials[i]) {
                    console.log(`Applying texture directly to Three.js material ${i}`);
                    // This is a more direct approach that might work better
                    modelViewer.dispatchEvent(new CustomEvent('apply-material-texture', { 
                        detail: { 
                            materialIndex: i, 
                            textureUrl: textureUrl,
                            options: options
                        } 
                    }));
                }
            });
        } catch (e) {
            console.warn('Could not access Three.js materials directly:', e);
        }
    }
    
    // Mark as applied
    modelViewer.dataset.textureApplied = 'true';
    console.log('Texture verification and reapplication complete');
}

// Make an element draggable
function makeElementDraggable(element) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    
    element.onmousedown = dragMouseDown;
    
    function dragMouseDown(e) {
        e.preventDefault();
        // Get the mouse cursor position at startup
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        // Call a function whenever the cursor moves
        document.onmousemove = elementDrag;
        
        // Add active class
        document.querySelectorAll('.applied-design').forEach(el => {
            el.classList.remove('active');
        });
        element.classList.add('active');
    }
    
    function elementDrag(e) {
        e.preventDefault();
        // Calculate the new cursor position
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        // Set the element's new position
        element.style.top = (element.offsetTop - pos2) + "px";
        element.style.left = (element.offsetLeft - pos1) + "px";
    }
    
    function closeDragElement() {
        // Stop moving when mouse button is released
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

// Enable design customization controls
function enableDesignCustomization(designElement) {
    // Implementation for enabling design customization
    // This will include rotation, scaling, and positioning controls
    console.log('Enabling design customization for:', designElement);
    
    // Make the uploaded design draggable
    makeElementDraggable(designElement);
}

// Export additional functions if needed
export { enableDesignCustomization };