# CustomXShop Virtual Try-On

An interactive clothing customization platform using webcam-based virtual try-on technology.

## Features

- **Webcam-Based Virtual Try-On**: Use your webcam to see how clothing items look on you in real-time
- **Pose Detection**: Automatically detects body poses to position clothing items accurately
- **Customization Options**: Change colors, materials, textures, size, and opacity
- **Accessories Support**: Try on hats, glasses, and other accessories
- **Screenshot & Video Capture**: Save images and record videos of your virtual outfits
- **Mobile Responsive**: Works on mobile devices and desktops
- **Fallback System**: Uses simplified models if 3D assets are unavailable

## Getting Started

1. Open `HTML/virtual.html` in a web browser that supports WebGL and camera access
2. Allow camera access when prompted
3. Follow the on-screen steps to select and customize clothing items

## Technical Details

This application uses:
- **Three.js** for 3D rendering
- **TensorFlow.js** for pose detection
- **Ammo.js** for basic physics simulation (optional)
- Modern JavaScript (ES6+) with modular architecture

## Directory Structure

- `/HTML` - Contains the main HTML files
- `/CSS` - Stylesheet files
- `/js/virtual-tryon` - JavaScript modules for the virtual try-on application
- `/models` - 3D model files (GLB format)
- `/images` - Image assets

## Requirements

- Modern web browser with WebGL support (Chrome, Firefox, Edge recommended)
- Camera access
- JavaScript enabled

## Customizing Models

The application supports GLB format 3D models. Place custom models in the `/models` directory and update the model cards in the HTML file to reference them.

## License

Copyright © 2023 CustomXShop. All rights reserved. 