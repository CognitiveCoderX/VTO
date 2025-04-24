// Product Customization Module

// Define shirt parts for customization
export const shirtParts = [
    { id: -1, name: 'Whole Shirt', defaultColor: '#FFFFFF' },
    { id: 0, name: 'Main Body', defaultColor: '#FFFFFF' },
    { id: 1, name: 'Sleeves', defaultColor: '#FFFFFF' },
    { id: 2, name: 'Back', defaultColor: '#FFFFFF' },
    { id: 3, name: 'Cuffs', defaultColor: '#FFFFFF' },
    { id: 5, name: 'Buttons', defaultColor: '#000000' }
];

// Browser support check functionality
export const browserSupport = {
    classList: 'classList' in document.documentElement,
    querySelector: 'querySelector' in document,
    addEventListener: 'addEventListener' in window,
    localStorage: (function() {
        try {
            localStorage.setItem('test', 'test');
            localStorage.removeItem('test');
            return true;
        } catch(e) {
            return false;
        }
    })(),
    modelViewer: 'customElements' in window && typeof customElements.get('model-viewer') !== 'undefined'
};

// Initialize product customization
export function initializeProductCustomization(gltfViewer, productTypeSelect, customizationControls) {
    if (gltfViewer) {
        gltfViewer.style.display = 'none';
        gltfViewer.removeAttribute('src');
    }

    if (customizationControls) {
        customizationControls.style.display = 'none';
    }

    if (productTypeSelect) {
        const addProductButton = document.createElement('button');
        addProductButton.innerHTML = '<i class="material-icons">add</i> Add Product';
        addProductButton.className = 'add-product-button';
        addProductButton.style.marginTop = '10px';
        
        const productSelectionSection = document.getElementById('product-selection');
        if (productSelectionSection) {
            productSelectionSection.appendChild(addProductButton);
            addProductButton.addEventListener('click', () => handleProductSelection(productTypeSelect, gltfViewer, customizationControls));
        }
    }
}

// Handle product selection
function handleProductSelection(productTypeSelect, gltfViewer, customizationControls) {
    const selectedValue = productTypeSelect.value;
    if (!selectedValue) {
        alert('Please select a product first');
        return;
    }
    
    // Hide welcome message
    const previewWelcome = document.querySelector('.preview-welcome');
    if (previewWelcome) {
        previewWelcome.style.display = 'none';
    }

    // Remove existing customization details
    const existingDetails = document.querySelector('.customization-details');
    if (existingDetails) {
        existingDetails.remove();
    }
    
    // Show action buttons container
    const actionButtonsContainer = document.querySelector('.action-buttons');
    if (actionButtonsContainer) {
        actionButtonsContainer.classList.remove('hidden');
    }
    
    // Show the action color container
    const actionColorContainer = document.querySelector('.action_color_container');
    if (actionColorContainer) {
        actionColorContainer.classList.remove('hidden');
    }

    // Show/hide customization controls based on product selection
    if (customizationControls) {
        if (selectedValue === '/glb/shirt.glb') {
            customizationControls.style.display = 'block';
            initializeCustomizationControls();
            
            // Show the control group inside action_color_container
            const controlGroup = document.querySelector('.control-group');
            if (controlGroup) {
                controlGroup.style.display = 'block';
            }
        } else {
            customizationControls.style.display = 'none';
            
            // Hide the control group inside action_color_container
            const controlGroup = document.querySelector('.control-group');
            if (controlGroup) {
                controlGroup.style.display = 'none';
            }
        }
    }

    if (selectedValue.endsWith('.glb')) {
        loadGLTFModel(gltfViewer, selectedValue);
    }
}

// Load GLTF Model
function loadGLTFModel(gltfViewer, modelPath) {
    if (gltfViewer) {
        // Remove any existing model
        gltfViewer.removeAttribute('src');
        
        // Clear any existing error messages
        const existingErrors = document.querySelectorAll('.model-error-message');
        existingErrors.forEach(errorMsg => errorMsg.remove());

        // Get the actual path from the modelPath parameter
        // We need to use the original path directly rather than trying alternatives
        console.log('Loading 3D model from:', modelPath);
        
        // Set up event listeners for load/error
        function handleModelError() {
            console.error(`Error loading model from: ${modelPath}`);
            // Show a fallback message to the user
            const previewContainer = document.querySelector('.preview_container');
            if (previewContainer) {
                const errorMessage = document.createElement('div');
                errorMessage.className = 'model-error-message';
                errorMessage.innerHTML = `
                    <h3>Unable to load 3D model</h3>
                    <p>Please ensure that the file exists at path: ${modelPath}</p>
                    <p>Try one of these alternatives:</p>
                    <ul>
                        <li>Refresh the page and try again</li>
                        <li>Check if the model file exists in the specified location</li>
                        <li>Contact support if the issue persists</li>
                    </ul>
                `;
                previewContainer.appendChild(errorMessage);
            }
            
            // Clean up the event listeners
            gltfViewer.removeEventListener('error', handleModelError);
            gltfViewer.removeEventListener('load', handleModelLoad);
        }
        
        function handleModelLoad() {
            console.log(`3D model loaded successfully from path: ${modelPath}`);
            // Clean up the event listeners
            gltfViewer.removeEventListener('error', handleModelError);
            gltfViewer.removeEventListener('load', handleModelLoad);
        }
        
        // Add event listeners
        gltfViewer.addEventListener('error', handleModelError);
        gltfViewer.addEventListener('load', handleModelLoad);
        
        // Set the source and display the viewer
        gltfViewer.src = modelPath;
        gltfViewer.style.display = 'block';
    }
}

// Initialize customization controls
function initializeCustomizationControls() {
    const controlsContainer = document.querySelector('.control-group');
    if (!controlsContainer) return;

    controlsContainer.innerHTML = '';
    
    // Create RGB color pickers for each part
    shirtParts.forEach(part => {
        const control = document.createElement('div');
        control.className = 'part-control';
        
        // Create label
        const label = document.createElement('label');
        label.textContent = `${part.name}:`;
        label.setAttribute('for', `color-${part.id}`);
        
        // Create RGB color input
        const colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.id = `color-${part.id}`;
        colorInput.value = part.defaultColor;
        colorInput.className = 'part-color-picker';
        
        // Add elements to control
        control.appendChild(label);
        control.appendChild(colorInput);
        controlsContainer.appendChild(control);
        
        // Add event listener for color input
        colorInput.addEventListener('input', () => {
            const color = colorInput.value;
            console.log(`Changing ${part.name} color to ${color}`);
            applyColorToModelPart(part.id, color);
        });
    });
}

// Apply color to model part
function applyColorToModelPart(partId, color) {
    const gltfViewer = document.getElementById('gltf-viewer');
    if (!gltfViewer) return;
    
    // If it's the whole shirt, apply to all parts
    if (partId === -1) {
        shirtParts.forEach(part => {
            if (part.id !== -1) { // Skip the 'Whole Shirt' option itself
                const colorInput = document.getElementById(`color-${part.id}`);
                if (colorInput) {
                    colorInput.value = color;
                }
                // Apply color to this part
                console.log(`Applying ${color} to part ${part.id}`);
                updatePartColor(part.id, color);
            }
        });
    } else {
        // Apply color to specific part
        console.log(`Applying ${color} to part ${partId}`);
        updatePartColor(partId, color);
    }
}

// Function to update specific part color by directly manipulating the 3D model's materials
function updatePartColor(partId, color) {
    const gltfViewer = document.getElementById('gltf-viewer');
    if (!gltfViewer || !gltfViewer.model) return;
    
    try {
        // Convert hex color to RGB
        const r = parseInt(color.substr(1,2), 16) / 255;
        const g = parseInt(color.substr(3,2), 16) / 255;
        const b = parseInt(color.substr(5,2), 16) / 255;

        const materials = gltfViewer.model.materials;
        
        // Map part IDs to material indices based on the 3D model structure
        const materialMapping = {
            0: [0],  // Main Body/Front (material index 0)
            1: [1, 2],  // Sleeves (material indices 1 and 2 for right and left)
            2: [3],  // Back (material index 3)
            3: [4],  // Cuffs (material index 4)
            5: [5]   // Buttons (material index 5)
        };

        // Special case for whole shirt (id: -1)
        if (partId === -1) {
            // Apply color to all parts except buttons
            for (let i = 0; i < 5; i++) {
                if (materials[i] && materials[i].pbrMetallicRoughness) {
                    // Try both methods of setting color - some models respond to one but not the other
                    materials[i].pbrMetallicRoughness.baseColorFactor = [r, g, b, 1.0];
                    
                    // Also use the setter method if available
                    if (typeof materials[i].pbrMetallicRoughness.setBaseColorFactor === 'function') {
                        materials[i].pbrMetallicRoughness.setBaseColorFactor([r, g, b, 1.0]);
                    }
                    
                    // Also set via attribute for maximum compatibility
                    gltfViewer.setAttribute(`material-${i}-color`, color);
                }
            }
            
            // Force a comprehensive update
            forceModelUpdate(gltfViewer);
            return;
        }

        // Get the material indices for this part
        const materialIndices = materialMapping[partId];
        if (materialIndices) {
            materialIndices.forEach(function(index) {
                if (materials[index] && materials[index].pbrMetallicRoughness) {
                    // Try both methods of setting color
                    materials[index].pbrMetallicRoughness.baseColorFactor = [r, g, b, 1.0];
                    
                    if (typeof materials[index].pbrMetallicRoughness.setBaseColorFactor === 'function') {
                        materials[index].pbrMetallicRoughness.setBaseColorFactor([r, g, b, 1.0]);
                    }
                    
                    // Also set via attribute for maximum compatibility
                    gltfViewer.setAttribute(`material-${index}-color`, color);
                    
                    console.log(`Applied color ${color} to material index ${index} using pbrMetallicRoughness`);
                }
            });
        }
        
        // Force a comprehensive update to ensure color changes are visible
        forceModelUpdate(gltfViewer);
    } catch (error) {
        console.error('Error updating part color:', error);
        
        // Fallback to the attribute-based method if direct material manipulation fails
        fallbackColorUpdate(partId, color, gltfViewer);
    }
}

// New function to force a comprehensive model update
function forceModelUpdate(modelViewer) {
    // 1. Force update through model-viewer's updateComplete promise if available
    if (modelViewer.updateComplete) {
        modelViewer.updateComplete.then(() => {
            console.log('Model viewer updateComplete promise resolved');
        });
    }
    
    // 2. Dispatch a custom event to ensure the model updates
    modelViewer.dispatchEvent(new CustomEvent('materials-change'));
    
    // 3. Force a redraw by causing a small camera orbit change
    const currentOrbit = modelViewer.getAttribute('camera-orbit') || '0deg 75deg 105%';
    const orbitParts = currentOrbit.split(' ');
    if (orbitParts.length >= 2) {
        const angle1 = parseFloat(orbitParts[0]) || 0;
        const angle2 = parseFloat(orbitParts[1]) || 75;
        
        // Apply a significant camera move for more reliable updates
        const newOrbit = `${(angle1 + 20) % 360}deg ${(angle2 + 10) % 360}deg ${orbitParts[2] || '105%'}`;
        modelViewer.setAttribute('camera-orbit', newOrbit);
        
        // Return to original position after update
        setTimeout(() => {
            modelViewer.setAttribute('camera-orbit', currentOrbit);
        }, 50);
    }
    
    // 4. Toggle visual properties to force redraw cycles
    const props = [
        { name: 'exposure', original: modelViewer.getAttribute('exposure') || '1', temp: '1.2' },
        { name: 'shadow-intensity', original: modelViewer.getAttribute('shadow-intensity') || '1', temp: '0.8' }
    ];
    
    // Apply temporary changes to force redraws
    props.forEach(prop => {
        modelViewer.setAttribute(prop.name, prop.temp);
        setTimeout(() => {
            if (prop.original) {
                modelViewer.setAttribute(prop.name, prop.original);
            } else {
                modelViewer.removeAttribute(prop.name);
            }
        }, 75);
    });
    
    // 5. Use DOM re-connection as a last resort for stubborn models
    setTimeout(() => {
        const parent = modelViewer.parentNode;
        if (parent) {
            const nextSibling = modelViewer.nextSibling;
            // Remove and reattach to force refresh
            parent.removeChild(modelViewer);
            void parent.offsetHeight; // Force layout recalculation
            if (nextSibling) {
                parent.insertBefore(modelViewer, nextSibling);
            } else {
                parent.appendChild(modelViewer);
            }
            console.log('DOM reconnection completed to force update');
            
            // Final materials change event after reconnection
            modelViewer.dispatchEvent(new CustomEvent('materials-change'));
        }
    }, 150);
}

// Fallback method using attributes if direct material manipulation fails
function fallbackColorUpdate(partId, color, gltfViewer) {
    // Map part IDs to material indices based on the GLB file structure
    const materialMapping = {
        0: 0,  // Main Body/Front (material index 0)
        1: [1, 2],  // Sleeves (material indices 1 and 2 for right and left)
        2: 3,  // Back (material index 3)
        3: 4,  // Cuffs (material index 4)
        5: 5   // Buttons (material index 5)
    };
    
    try {
        const materialIndices = materialMapping[partId];
        
        if (Array.isArray(materialIndices)) {
            // If multiple materials need to be updated (like both sleeves)
            materialIndices.forEach(index => {
                // Set the material color using the proper model-viewer attribute format
                const materialName = `material-${index}-color`;
                gltfViewer.setAttribute(materialName, color);
                console.log(`Fallback: Applied color ${color} to material index ${index} using attribute ${materialName}`);
            });
        } else if (materialIndices !== undefined) {
            // Set the material color for a single part
            const materialName = `material-${materialIndices}-color`;
            gltfViewer.setAttribute(materialName, color);
            console.log(`Fallback: Applied color ${color} to material index ${materialIndices} using attribute ${materialName}`);
        }
        
        // Force a comprehensive update including the new DOM reconnection technique
        forceModelUpdate(gltfViewer);
    } catch (error) {
        console.error(`Error in fallback color update for part ${partId}:`, error);
        
        // Last resort - try the CSS filter method
        applyCSSFilterFallback(gltfViewer, color);
    }
}

// Last resort CSS filter fallback
function applyCSSFilterFallback(modelViewer, hexColor) {
    console.log('Using CSS filter fallback for color', hexColor);
    
    // Parse the target color
    const r = parseInt(hexColor.substring(1, 3), 16);
    const g = parseInt(hexColor.substring(3, 5), 16);
    const b = parseInt(hexColor.substring(5, 7), 16);
    
    // Convert RGB to HSL for better filter generation
    const max = Math.max(r, g, b) / 255;
    const min = Math.min(r, g, b) / 255;
    const luminance = (max + min) / 2;
    
    let saturation = 0;
    let hue = 0;
    
    if (max !== min) {
        saturation = luminance > 0.5 ? 
            (max - min) / (2 - max - min) : 
            (max - min) / (max + min);
            
        if (max === r/255) {
            hue = ((g/255 - b/255) / (max - min)) * 60;
        } else if (max === g/255) {
            hue = (2 + (b/255 - r/255) / (max - min)) * 60;
        } else {
            hue = (4 + (r/255 - g/255) / (max - min)) * 60;
        }
        
        if (hue < 0) hue += 360;
    }
    
    // Adjust hue rotation based on calculated hue
    const hueRotate = Math.round(hue);
    const saturateFactor = Math.max(1, saturation * 2);
    const brightnessFactor = Math.max(0.6, Math.min(1.3, luminance * 1.5));
    const contrastFactor = r + g + b > 382 ? 0.9 : 1.2; // Lighter colors get less contrast
    
    const customFilter = `hue-rotate(${hueRotate}deg) saturate(${saturateFactor.toFixed(1)}) brightness(${brightnessFactor.toFixed(1)}) contrast(${contrastFactor.toFixed(1)})`;
    
    modelViewer.style.filter = customFilter;
    console.log(`Applied CSS filter fallback: ${customFilter}`);
}