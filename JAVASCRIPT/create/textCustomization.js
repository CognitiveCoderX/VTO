// Text Customization Module

// Import texture generator functions
import { createTextTexture, applyTextureToModel } from './textureGenerator.js';

// Initialize text customization functionality
export function initializeTextCustomization() {
    // Get DOM elements
    const textInput = document.getElementById('custom-text');
    const addTextButton = document.getElementById('add-text-button');
    const fontSelect = document.getElementById('font-select');
    const textColor = document.getElementById('text-color');
    const textSize = document.getElementById('text-size');
    const textSizeValue = document.getElementById('text-size-value');
    const textRotation = document.getElementById('text-rotation');
    const textRotationValue = document.getElementById('text-rotation-value');
    const textEffectButtons = document.querySelectorAll('.text-effect-button');
    const textAlignmentButtons = document.querySelectorAll('.text-alignment-button');
    const textLayerButtons = document.querySelectorAll('.text-layer-button');
    const textElementsContainer = document.getElementById('text-elements-container');
    const applyTextToModelButton = document.getElementById('apply-text-to-model');
    const textPositionSelect = document.getElementById('text-position');
    
    // Make sure text elements container exists
    if (!textElementsContainer) {
        console.error('Text elements container not found. Text element management will not work properly.');
    }

    // Track active text element and all text elements
    let activeTextElement = null;
    let textElements = [];
    let textElementCounter = 0;

    // Add event listener for the Apply Text to 3D Model button
    if (applyTextToModelButton) {
        applyTextToModelButton.addEventListener('click', () => {
            if (activeTextElement) {
                applyTextToModel(activeTextElement);
            } else if (textElements.length > 0) {
                // If no active element, use the first one
                applyTextToModel(textElements[0].element);
            } else {
                alert('Please add text before applying to the model');
            }
        });
    }

    // Add text button handler
    addTextButton.addEventListener('click', () => {
        const text = textInput.value.trim();
        if (text) {
            const newElement = addTextToDesign(text, {
                font: fontSelect.value,
                color: textColor.value,
                size: textSize.value,
                rotation: textRotation.value,
                effects: getActiveEffects(),
                alignment: getActiveAlignment()
            });
            
            // Set as active element
            setActiveElement(newElement);
            
            // Add to text elements array
            textElementCounter++;
            textElements.push({
                id: textElementCounter,
                element: newElement,
                text: text
            });
            
            // Update text elements list
            updateTextElementsList();
            
            // Clear input
            textInput.value = '';
        } else {
            alert('Please enter some text');
        }
    });

    // Font selection handler
    fontSelect.addEventListener('change', (e) => {
        if (activeTextElement) {
            activeTextElement.style.fontFamily = e.target.value;
            updateTextElementData();
        }
    });

    // Text color handler
    textColor.addEventListener('input', (e) => {
        if (activeTextElement) {
            activeTextElement.style.color = e.target.value;
            updateTextElementData();
        }
    });

    // Text size handler
    textSize.addEventListener('input', (e) => {
        if (activeTextElement) {
            activeTextElement.style.fontSize = `${e.target.value}px`;
            textSizeValue.textContent = `${e.target.value}px`;
            updateTextElementData();
        }
    });
    
    // Text rotation handler
    textRotation.addEventListener('input', (e) => {
        if (activeTextElement) {
            activeTextElement.style.transform = `rotate(${e.target.value}deg)`;
            textRotationValue.textContent = `${e.target.value}°`;
            updateTextElementData();
        }
    });
    
    // Text effect buttons handler
    textEffectButtons.forEach(button => {
        button.addEventListener('click', () => {
            const effect = button.dataset.effect;
            button.classList.toggle('active');
            
            if (activeTextElement) {
                applyTextEffect(activeTextElement, effect, button.classList.contains('active'));
                updateTextElementData();
            }
        });
    });
    
    // Text alignment buttons handler
    textAlignmentButtons.forEach(button => {
        button.addEventListener('click', () => {
            const alignment = button.dataset.align;
            
            // Remove active class from all alignment buttons
            textAlignmentButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            button.classList.add('active');
            
            if (activeTextElement) {
                activeTextElement.style.textAlign = alignment;
                updateTextElementData();
            }
        });
    });
    
    // Text layer buttons handler
    textLayerButtons.forEach(button => {
        button.addEventListener('click', () => {
            const layerAction = button.dataset.layer;
            
            if (activeTextElement) {
                const currentZIndex = parseInt(activeTextElement.style.zIndex) || 100;
                
                if (layerAction === 'up') {
                    activeTextElement.style.zIndex = currentZIndex + 1;
                } else if (layerAction === 'down') {
                    activeTextElement.style.zIndex = Math.max(currentZIndex - 1, 1);
                }
                
                updateTextElementData();
            }
        });
    });
    
    // Helper function to get active effects
    function getActiveEffects() {
        const activeEffects = [];
        textEffectButtons.forEach(button => {
            if (button.classList.contains('active')) {
                activeEffects.push(button.dataset.effect);
            }
        });
        return activeEffects;
    }
    
    // Helper function to get active alignment
    function getActiveAlignment() {
        let activeAlignment = 'left'; // Default
        textAlignmentButtons.forEach(button => {
            if (button.classList.contains('active')) {
                activeAlignment = button.dataset.align;
            }
        });
        return activeAlignment;
    }
    
    // Helper function to set active element
    function setActiveElement(element) {
        // Clear active state from all elements
        const allTextElements = document.querySelectorAll('.custom-text-element');
        allTextElements.forEach(el => el.classList.remove('active'));
        
        // Set new active element
        activeTextElement = element;
        if (activeTextElement) {
            activeTextElement.classList.add('active');
            
            // Update controls to match active element
            updateControlsFromElement(activeTextElement);
        }
    }
    
    // Helper function to update controls based on active element
    function updateControlsFromElement(element) {
        // Update font
        const fontFamily = element.style.fontFamily;
        if (fontFamily) {
            fontSelect.value = fontFamily.replace(/['",]/g, '');
        }
        
        // Update color
        const color = element.style.color;
        if (color) {
            textColor.value = rgbToHex(color);
        }
        
        // Update size
        const fontSize = element.style.fontSize;
        if (fontSize) {
            const size = parseInt(fontSize);
            textSize.value = size;
            textSizeValue.textContent = `${size}px`;
        }
        
        // Update rotation
        const transform = element.style.transform;
        if (transform && transform.includes('rotate')) {
            const rotation = parseInt(transform.match(/rotate\((\d+)deg\)/)[1]);
            textRotation.value = rotation;
            textRotationValue.textContent = `${rotation}°`;
        } else {
            textRotation.value = 0;
            textRotationValue.textContent = '0°';
        }
        
        // Update effects
        textEffectButtons.forEach(button => {
            const effect = button.dataset.effect;
            button.classList.remove('active');
            
            // Check if effect is applied
            if ((effect === 'bold' && element.style.fontWeight === 'bold') ||
                (effect === 'italic' && element.style.fontStyle === 'italic') ||
                (effect === 'underline' && element.style.textDecoration === 'underline') ||
                (effect === 'shadow' && element.style.textShadow) ||
                (effect === 'outline' && element.style.webkitTextStroke)) {
                button.classList.add('active');
            }
        });
        
        // Update alignment
        textAlignmentButtons.forEach(button => {
            button.classList.remove('active');
            if (button.dataset.align === element.style.textAlign) {
                button.classList.add('active');
            }
        });
        
        // If no alignment is set, default to left
        if (!element.style.textAlign) {
            const leftAlignButton = document.querySelector('.text-alignment-button[data-align="left"]');
            if (leftAlignButton) {
                leftAlignButton.classList.add('active');
            }
        }
    }
    
    // Helper function to update text elements list
    function updateTextElementsList() {
        if (!textElementsContainer) return;
        
        // Clear container
        textElementsContainer.innerHTML = '';
        
        // Add each text element to the list
        textElements.forEach(item => {
            const elementItem = document.createElement('div');
            elementItem.className = 'text-element-item';
            if (activeTextElement === item.element) {
                elementItem.classList.add('active');
            }
            
            elementItem.innerHTML = `
                <span>${item.text.substring(0, 15)}${item.text.length > 15 ? '...' : ''}</span>
                <div class="text-element-actions">
                    <button type="button" class="text-element-action" data-action="edit" title="Edit">
                        <i class="material-icons">edit</i>
                    </button>
                    <button type="button" class="text-element-action" data-action="delete" title="Delete">
                        <i class="material-icons">delete</i>
                    </button>
                </div>
            `;
            
            // Add click handler to select this element
            elementItem.addEventListener('click', (e) => {
                if (!e.target.closest('.text-element-action')) {
                    setActiveElement(item.element);
                    updateTextElementsList();
                }
            });
            
            // Add edit handler
            const editButton = elementItem.querySelector('[data-action="edit"]');
            if (editButton) {
                editButton.addEventListener('click', () => {
                    textInput.value = item.text;
                    setActiveElement(item.element);
                    updateTextElementsList();
                });
            }
            
            // Add delete handler
            const deleteButton = elementItem.querySelector('[data-action="delete"]');
            if (deleteButton) {
                deleteButton.addEventListener('click', () => {
                    // Remove from DOM
                    item.element.remove();
                    
                    // Remove from array
                    textElements = textElements.filter(el => el.id !== item.id);
                    
                    // Clear active element if it was this one
                    if (activeTextElement === item.element) {
                        activeTextElement = null;
                    }
                    
                    // Update list
                    updateTextElementsList();
                });
            }
            
            textElementsContainer.appendChild(elementItem);
        });
    }
    
    // Helper function to update text element data in the array
    function updateTextElementData() {
        if (activeTextElement) {
            const textElement = textElements.find(item => item.element === activeTextElement);
            if (textElement) {
                textElement.text = activeTextElement.textContent;
            }
        }
    }
    
    // Helper function to convert RGB to HEX
    function rgbToHex(rgb) {
        // Default to black if no color
        if (!rgb) return '#000000';
        
        // If already hex, return it
        if (rgb.startsWith('#')) return rgb;
        
        // Extract RGB values
        const rgbMatch = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
        if (!rgbMatch) return '#000000';
        
        const r = parseInt(rgbMatch[1]);
        const g = parseInt(rgbMatch[2]);
        const b = parseInt(rgbMatch[3]);
        
        return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    }
}

// Add text to the design
function addTextToDesign(text, styles) {
    const textElement = document.createElement('div');
    textElement.className = 'custom-text-element';
    textElement.textContent = text;
    textElement.style.fontFamily = styles.font;
    textElement.style.color = styles.color;
    textElement.style.fontSize = `${styles.size}px`;
    textElement.style.position = 'absolute';
    textElement.style.cursor = 'move';
    textElement.style.zIndex = '100';
    textElement.style.minWidth = '50px';
    textElement.style.minHeight = '20px';
    
    // Set initial position (center of preview container)
    const previewContainer = document.querySelector('.preview_container');
    if (previewContainer) {
        const containerRect = previewContainer.getBoundingClientRect();
        textElement.style.top = `${containerRect.height / 2 - 20}px`;
        textElement.style.left = `${containerRect.width / 2 - 50}px`;
    } else {
        textElement.style.top = '50%';
        textElement.style.left = '50%';
    }
    
    // Apply rotation if specified
    if (styles.rotation && styles.rotation !== '0') {
        textElement.style.transform = `rotate(${styles.rotation}deg)`;
    }
    
    // Apply text alignment if specified
    if (styles.alignment) {
        textElement.style.textAlign = styles.alignment;
        // For proper alignment, set width to auto or 100%
        textElement.style.width = 'auto';
        textElement.style.minWidth = '100px';
    }
    
    // Apply text effects if specified
    if (styles.effects && styles.effects.length > 0) {
        styles.effects.forEach(effect => {
            applyTextEffect(textElement, effect, true);
        });
    }

    // Make text element draggable
    makeTextDraggable(textElement);

    // Add to preview container
    if (previewContainer) {
        previewContainer.appendChild(textElement);
        // Make sure the text element is visible above other elements
        textElement.style.zIndex = '1000';
        // Add a background to make text more visible
        textElement.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
        textElement.style.padding = '5px';
        console.log('Text element added to preview container:', textElement);
    }

    return textElement;
}

// Apply text effect to element
function applyTextEffect(element, effect, isActive) {
    switch (effect) {
        case 'bold':
            element.style.fontWeight = isActive ? 'bold' : 'normal';
            break;
        case 'italic':
            element.style.fontStyle = isActive ? 'italic' : 'normal';
            break;
        case 'underline':
            element.style.textDecoration = isActive ? 'underline' : 'none';
            break;
        case 'shadow':
            element.style.textShadow = isActive ? '2px 2px 4px rgba(0,0,0,0.5)' : 'none';
            break;
        case 'outline':
            if (isActive) {
                const color = element.style.color || '#000000';
                element.style.webkitTextStroke = `1px ${color}`;
                element.style.textStroke = `1px ${color}`;
                // Change text color to transparent or white for better outline effect
                element.dataset.originalColor = color;
                element.style.color = 'white';
            } else {
                element.style.webkitTextStroke = 'none';
                element.style.textStroke = 'none';
                // Restore original color
                if (element.dataset.originalColor) {
                    element.style.color = element.dataset.originalColor;
                    delete element.dataset.originalColor;
                }
            }
            break;
    }
}

// Make text element draggable
function makeTextDraggable(element) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    let isDragging = false;

    element.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        e.preventDefault();
        // Get mouse cursor position at startup
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
        isDragging = false;

        // Dispatch custom event to set active element
        const event = new CustomEvent('textElementSelected', { detail: { element } });
        document.dispatchEvent(event);
    }

    function elementDrag(e) {
        e.preventDefault();
        isDragging = true;
        
        // Calculate new cursor position
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        
        // Set element's new position
        const newTop = element.offsetTop - pos2;
        const newLeft = element.offsetLeft - pos1;
        
        // Get container boundaries
        const container = element.parentElement;
        const containerRect = container.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        
        // Ensure element stays within container boundaries
        const maxTop = containerRect.height - elementRect.height;
        const maxLeft = containerRect.width - elementRect.width;
        
        element.style.top = `${Math.max(0, Math.min(newTop, maxTop))}px`;
        element.style.left = `${Math.max(0, Math.min(newLeft, maxLeft))}px`;
    }

    function closeDragElement() {
        // Stop moving when mouse button is released
        document.onmouseup = null;
        document.onmousemove = null;
        
        // If it was just a click (not a drag), handle selection
        if (!isDragging) {
            // Set active element
            const allTextElements = document.querySelectorAll('.custom-text-element');
            allTextElements.forEach(el => el.classList.remove('active'));
            element.classList.add('active');
        }
    }
    
    // Double click to edit text content directly
    element.ondblclick = function(e) {
        e.preventDefault();
        element.contentEditable = true;
        element.focus();
        
        // Select all text
        const range = document.createRange();
        range.selectNodeContents(element);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        
        // Handle blur to exit edit mode
        element.onblur = function() {
            element.contentEditable = false;
            // Dispatch custom event to update text in the list
            const event = new CustomEvent('textElementEdited', { detail: { element } });
            document.dispatchEvent(event);
        };
        
        // Handle enter key to exit edit mode
        element.onkeydown = function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                element.blur();
            }
        };
    };
}

// Function to apply text to the 3D model
function applyTextToModel(textElement) {
    // Get the model viewer element
    const modelViewer = document.getElementById('gltf-viewer');
    
    if (!modelViewer || !modelViewer.model) {
        console.error('Model viewer not found or model not loaded');
        alert('Please wait for the 3D model to load completely');
        return;
    }
    
    // Show loading indicator
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'loading-indicator';
    loadingIndicator.innerHTML = '<span>Applying text to model...</span>';
    document.querySelector('.preview_container').appendChild(loadingIndicator);
    
    try {
        // Get text properties from the element
        const text = textElement.textContent;
        const fontSelect = document.getElementById('font-select');
        const textColor = document.getElementById('text-color');
        const textSize = document.getElementById('text-size');
        const font = textElement.style.fontFamily.replace(/['"]/g, '') || (fontSelect ? fontSelect.value : 'Arial');
        const color = textElement.style.color || (textColor ? textColor.value : '#000000');
        const size = parseInt(textElement.style.fontSize) || (textSize ? parseInt(textSize.value) : 24);
        
        // Get rotation from transform style or default to 0
        let rotation = 0;
        const transform = textElement.style.transform;
        if (transform && transform.includes('rotate')) {
            const match = transform.match(/rotate\((\d+)deg\)/);
            if (match && match[1]) {
                rotation = parseInt(match[1]);
            }
        }
        
        // Get position from select element
        const textPositionSelect = document.getElementById('text-position');
        const position = textPositionSelect ? textPositionSelect.value : 'front';
        
        // Create text texture
        const textTexture = createTextTexture(text, font, size, color);
        
        // Apply texture to model
        applyTextureToModel(modelViewer, textTexture, {
            type: 'text',
            position: position,
            scale: 1,
            rotation: rotation,
            color: color
        });
        
        // Remove loading indicator
        if (loadingIndicator) loadingIndicator.remove();
        
        // Show success message
        const successMessage = document.createElement('div');
        successMessage.className = 'success-message';
        successMessage.innerHTML = '<span>Text applied to model successfully!</span>';
        document.querySelector('.preview_container').appendChild(successMessage);
        
        // Remove success message after 2 seconds
        setTimeout(() => {
            if (successMessage) successMessage.remove();
        }, 2000);
        
        console.log(`Applied text "${text}" to the 3D model`);
    } catch (error) {
        console.error('Error applying text to model:', error);
        alert('Failed to apply text to model. Please try again.');
        if (loadingIndicator) loadingIndicator.remove();
    }
}