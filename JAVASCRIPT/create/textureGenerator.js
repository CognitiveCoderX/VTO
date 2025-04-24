// Texture Generator Module - Simplified Version

/**
 * Generates a basic pattern texture
 * @param {string} patternType - The type of pattern to generate
 * @param {Object} options - Options for the pattern
 * @returns {HTMLCanvasElement} - Canvas element with the generated pattern
 */
export function generatePatternTexture(patternType, options = {}) {
    const {
        color = '#000000',
        scale = 1,
        rotation = 0
    } = options;

    // Create a canvas to draw the pattern
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Set canvas size (power of 2 for better texture performance)
    canvas.width = 512;
    canvas.height = 512;

    // Clear canvas with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Apply rotation if needed
    if (rotation !== 0) {
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(rotation * Math.PI / 180);
        ctx.translate(-canvas.width / 2, -canvas.height / 2);
    }

    // Set the pattern color
    ctx.fillStyle = color;
    ctx.strokeStyle = color;

    // Generate different patterns based on patternType
    switch (patternType) {
        case 'vertical-stripes':
            drawVerticalStripes(ctx, canvas.width, canvas.height, scale, color);
            break;
        case 'horizontal-stripes':
            drawHorizontalStripes(ctx, canvas.width, canvas.height, scale, color);
            break;
        case 'diagonal-stripes':
            drawDiagonalStripes(ctx, canvas.width, canvas.height, scale, color);
            break;
        case 'polka-dots':
            drawPolkaDots(ctx, canvas.width, canvas.height, scale, color);
            break;
        case 'checks':
            drawCheckerPattern(ctx, canvas.width, canvas.height, scale, color);
            break;
        default:
            // Default to a solid color
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            break;
    }

    // Restore canvas state if rotation was applied
    if (rotation !== 0) {
        ctx.restore();
    }

    return canvas;
}

/**
 * Applies a texture to the 3D model
 * @param {HTMLElement} modelViewer - The model-viewer element
 * @param {HTMLCanvasElement|string} texture - Canvas element with the texture or URL
 * @param {Object} options - Options for applying the texture
 */
export function applyTextureToModel(modelViewer, texture, options = {}) {
    if (!modelViewer || !modelViewer.model) {
        console.error('Model not loaded or model-viewer not found');
        return;
    }

    const {
        position = 'front',
        scale = 1,
        rotation = 0,
        color = '#000000' // Add color option for customization
    } = options;

    // Convert canvas to data URL if it's a canvas element
    const textureUrl = texture instanceof HTMLCanvasElement 
        ? texture.toDataURL('image/png')
        : texture;

    // Get all materials from the model
    const materials = modelViewer.model.materials;
    if (!materials || materials.length === 0) {
        console.error('No materials found in the model');
        return;
    }

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
    
    // Apply texture to selected materials
    targetIndices.forEach(i => {
        if (i < materials.length) {
            try {
                // Set basic material properties
                modelViewer.setAttribute(`material-${i}-color`, color); // Use customizable color
                modelViewer.setAttribute(`material-${i}-metalness`, '0.0');
                modelViewer.setAttribute(`material-${i}-roughness`, '0.5');
                
                // Set texture tiling based on scale
                modelViewer.setAttribute(`material-${i}-mapTiling`, `${scale} ${scale}`);
                
                // Apply rotation if needed
                if (rotation !== 0) {
                    modelViewer.setAttribute(`material-${i}-mapRotation`, rotation);
                }
                
                // Apply the texture
                modelViewer.setAttribute(`material-${i}-map`, textureUrl);
                
                console.log(`Applied texture to material ${i}`);
            } catch (error) {
                console.error(`Error applying texture to material ${i}:`, error);
            }
        }
    });

    // Force model-viewer to update
    modelViewer.needsUpdate = true;
}

/**
 * Creates a simple text texture
 * @param {string} text - The text to render
 * @param {string} font - Font family
 * @param {number} size - Font size
 * @param {string} color - Text color
 * @returns {HTMLCanvasElement} - Canvas with the text rendered
 */
export function createTextTexture(text, font, size, color) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = 512;
    canvas.height = 512;
    
    // Create a white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Set font properties
    const fontSize = size * 6;
    ctx.font = `${fontSize}px ${font}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Draw text
    ctx.fillStyle = color;
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    ctx.strokeText(text, canvas.width / 2, canvas.height / 2);
    
    return canvas;
}

// Pattern drawing functions - Simplified versions

function drawVerticalStripes(ctx, width, height, scale, color) {
    const stripeWidth = 30 * scale;
    const spacing = 60 * scale;
    
    for (let x = 0; x < width; x += spacing) {
        ctx.fillStyle = color;
        ctx.fillRect(x, 0, stripeWidth, height);
    }
}

function drawHorizontalStripes(ctx, width, height, scale, color) {
    const stripeHeight = 30 * scale;
    const spacing = 60 * scale;
    
    for (let y = 0; y < height; y += spacing) {
        ctx.fillStyle = color;
        ctx.fillRect(0, y, width, stripeHeight);
    }
}

function drawDiagonalStripes(ctx, width, height, scale, color) {
    const stripeWidth = 15 * scale;
    const spacing = 40 * scale;
    
    ctx.lineWidth = stripeWidth;
    ctx.strokeStyle = color;
    
    for (let i = -height; i < width + height; i += spacing) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + height, height);
        ctx.stroke();
    }
}

function drawPolkaDots(ctx, width, height, scale, color) {
    const dotRadius = 15 * scale;
    const spacing = 60 * scale;
    
    for (let y = dotRadius; y < height; y += spacing) {
        for (let x = dotRadius; x < width; x += spacing) {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

function drawCheckerPattern(ctx, width, height, scale, color) {
    const squareSize = 30 * scale;
    
    for (let y = 0; y < height; y += squareSize * 2) {
        for (let x = 0; x < width; x += squareSize * 2) {
            ctx.fillStyle = color;
            ctx.fillRect(x, y, squareSize, squareSize);
            ctx.fillRect(x + squareSize, y + squareSize, squareSize, squareSize);
        }
    }
}

function applyTextTextureToModel(modelViewer, text, font, size, color, options = {}) {
    const textTexture = createTextTexture(text, font, size, color);
    applyTextureToModel(modelViewer, textTexture, options);
}