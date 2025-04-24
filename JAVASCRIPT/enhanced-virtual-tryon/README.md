# Enhanced Virtual Try-On

A web application that allows users to virtually try on 3D clothing models with real-time pose tracking using MediaPipe's BlazePose GHUM model and Three.js for 3D rendering.

## Features

- Real-time 3D body tracking with MediaPipe BlazePose GHUM model
- 3D clothing models that accurately follow body movements
- Customization options for colors, textures, and opacity
- Body-based resizing for accurate fit
- Performance monitoring with stats.js
- Screenshot functionality

## Requirements

- Modern web browser with WebGL support (Chrome, Firefox, Safari, Edge)
- Camera access
- HTTPS connection (required for camera access)

## Installation

1. Clone the repository or download the source code
2. Navigate to the project directory
3. Install dependencies:

```bash
npm install
```

## Running the Application

Start the development server with HTTPS:

```bash
npm run dev
```

This will start a local HTTPS server at `https://localhost:8080`.

## Usage

1. Allow camera access when prompted
2. Click the "Start Try-On" button to begin
3. Stand in a visible position facing the camera
4. Use the "Calibrate" button to optimize fit (stand in T-pose)
5. Use "Change Clothes" to cycle through available clothing models
6. Use "Customize" to change colors, textures, opacity, and size
7. Take screenshots with the "Screenshot" button

## Project Structure

- `index.html` - Main HTML file
- `main.js` - Application entry point
- `modules/` - Application modules:
  - `poseDetection.js` - Handles pose detection with MediaPipe
  - `modelLoader.js` - Loads and manages 3D models
  - `clothingFit.js` - Handles fitting clothes to body
  - `customization.js` - Handles model customization

## Technologies Used

- MediaPipe Pose (BlazePose GHUM model)
- Three.js for 3D rendering
- ES6 Modules
- stats.js for performance monitoring

## License

MIT