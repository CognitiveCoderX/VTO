const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const path = require('path');
const dotenv = require('dotenv');
const cloudinary = require('cloudinary').v2;
const jwt = require('jsonwebtoken');
const WebSocket = require('ws');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
// Allow alternative port (8081) if specified, otherwise use default (3000)
const PORT = process.env.SERVER_PORT || process.env.PORT || 3000;
const ALTERNATIVE_PORT = 8081; // Alternative port from start-server.js

// Create HTTP server
const server = require('http').createServer(app);

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('New WebSocket connection established');
  
  ws.on('message', (message) => {
    console.log('Received message:', message);
    // Echo the message back to the client
    ws.send(message);
  });

  ws.on('close', () => {
    console.log('WebSocket connection closed');
  });
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: '/tmp/'
}));

// Set proper MIME types for JavaScript modules
app.use((req, res, next) => {
  const ext = path.extname(req.url).toLowerCase();
  if (ext === '.js') {
    if (req.url.includes('type=module') || req.url.endsWith('.module.js')) {
      res.type('application/javascript');
    } else {
      res.type('application/javascript');
    }
  } else if (ext === '.mjs') {
    res.type('application/javascript');
  } else if (ext === '.svg') {
    res.type('image/svg+xml');
  }
  next();
});

// Enable trust proxy if you're behind a reverse proxy
app.enable('trust proxy');

// Handle protocol
app.use((req, res, next) => {
  if (!req.secure && process.env.NODE_ENV === 'production') {
    return res.redirect('https://' + req.headers.host + req.url);
  }
  next();
});

// Updated Content Security Policy with WebSocket support
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', `
    default-src 'self';
    font-src 'self' data: https://fonts.googleapis.com https://fonts.gstatic.com https://cdnjs.cloudflare.com http://localhost:* blob:;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com;
    img-src 'self' data: https: http: blob:;
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com https://cdnjs.cloudflare.com https://uam.getmerlin.in https://cdn.jsdelivr.net;
    connect-src 'self' ws: wss: https: http: blob:;
    worker-src 'self' blob:;
    frame-src 'self';
    media-src 'self' blob:;
    object-src 'none';
    base-uri 'self';
  `.replace(/\s+/g, ' ').trim());
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Serve static files with proper caching
app.use('/', express.static(path.join(__dirname), {
  maxAge: '1h',
  etag: true,
  lastModified: true
}));

// Serve favicon explicitly
app.get('/favicon.ico', (req, res) => {
  res.sendFile(path.join(__dirname, 'favicon.ico'));
});

// Route for the root path
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'HTML', 'homepage.html'));
});

// Routes for HTML pages
app.get('/Homepage', (req, res) => {
    res.sendFile(path.join(__dirname, 'HTML', 'homepage.html'));
});

app.get('/homepage', (req, res) => {
    res.sendFile(path.join(__dirname, 'HTML', 'homepage.html'));
});

app.get('/index.html', (req, res) => {
    res.redirect('/');
});

app.get('/create', (req, res) => {
    res.sendFile(path.join(__dirname, 'HTML', 'create.html'));
});

// Route for enhanced virtual try-on
app.get('/virtual-tryon', (req, res) => {
  res.sendFile(path.join(__dirname, 'HTML', 'enhanced_virtual_tryon.html'));
});

// Serve static directories
app.use('/HTML', express.static(path.join(__dirname, 'HTML')));
app.use('/CSS', express.static(path.join(__dirname, 'CSS')));
app.use('/JAVASCRIPT', express.static(path.join(__dirname, 'JAVASCRIPT')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/images', express.static(path.join(__dirname, 'images')));

// Special handling for problematic model file
app.get('/models/l4plnsl7o5r6qqxotasx.glb', (req, res) => {
  console.log("Intercepting request for l4plnsl7o5r6qqxotasx.glb and redirecting to Cloudinary");
  res.redirect('https://res.cloudinary.com/customxshop/image/upload/v1744037917/CustomXShop/l4plnsl7o5r6qqxotasx.glb');
});

// Regular static serving for models after the special case
app.use('/models', express.static(path.join(__dirname, 'models')));

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || ''
});

// Import routes
const productRoutes = require('./routes/products');
const designRoutes = require('./routes/designs');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');

// Import middleware
const { protect } = require('./middleware/auth');

// Use routes - public routes don't need authentication
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/products', protect, productRoutes);
app.use('/api/designs', protect, designRoutes);
app.use('/api/user', protect, userRoutes);

// Public routes that don't require authentication
const publicRoutes = [
  '/',
  '/Homepage',
  '/homepage',
  '/homepage.html',
  '/index.html',
  '/HTML/index.html',
  '/login.html',
  '/signup.html',
  '/Product.html',
  '/Services.html',
  '/Help.html',
  '/Designs.html',
  '/Cart.html',
  '/Profile.html',  // Added Profile.html to public routes
  '/HTML',
  '/CSS',
  '/JAVASCRIPT',
  '/assets',
  '/images',
  '/models',
  '/glb'
];

// Middleware to check authentication for protected routes
app.use((req, res, next) => {
  // Check if the route is public
  const isPublicRoute = publicRoutes.some(route => req.path.startsWith(route));
  
  if (isPublicRoute) {
    return next();
  }

  // For protected routes, check authentication
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
});

// Serve HTML files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'HTML', 'index.html'));
});

app.get('/HTML/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'HTML', 'index.html'));
});

app.get('/signup.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'HTML', 'signup.html'));
});

app.get('/homepage', (req, res) => {
  res.sendFile(path.join(__dirname, 'HTML', 'homepage.html'));
});

app.get('/homepage.html', (req, res) => {
  res.redirect('/homepage');
});

app.get('/create', (req, res) => {
  res.sendFile(path.join(__dirname, 'HTML', 'create.html'));
});

app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'HTML', 'signup.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'HTML', 'admin.html'));
});

// Enhanced virtual try-on routes
app.get('/enhanced-virtual-tryon.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'HTML', 'enhanced_virtual_tryon.html'));
});

app.get('/enhanced-virtual-tryon', (req, res) => {
  res.redirect('/enhanced-virtual-tryon.html');
});

// Additional HTML file routes
app.get('/Product.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'HTML', 'Product.html'));
});

app.get('/Designs.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'HTML', 'Designs.html'));
});

app.get('/Services.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'HTML', 'Services.html'));
});

app.get('/Help.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'HTML', 'Help.html'));
});

app.get('/Cart.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'HTML', 'Cart.html'));
});

// Add Profile page route
app.get('/Profile.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'HTML', 'Profile.html'));
});

app.get('/login.html', (req, res) => {
  // Preserve any query parameters in the redirect
  const queryString = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
  res.redirect('/HTML/index.html' + queryString);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!', 
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
  });
});

// Function to start the server with MongoDB
function startWithMongoDB() {
  // Use the provided MongoDB URI with proper credentials
  const mongoURI = 'mongodb+srv://Meet:Meet@customxshop.czlew.mongodb.net/';
  
  mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    retryWrites: true
  })
  .then(() => {
    console.log('MongoDB Atlas connected successfully');
    startServer(PORT);
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    console.log('Attempting to start server without database connection...');
    startServer(PORT);
  });
}

// Function to start the server without MongoDB
function startWithoutMongoDB() {
  console.log('Starting server without MongoDB connection (simplified mode)');
  startServer(ALTERNATIVE_PORT);
}

// Common server start function
function startServer(port) {
  server.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`Enhanced Virtual Try-On available at http://localhost:${port}/HTML/enhanced_virtual_tryon.html`);
    console.log('Press Ctrl+C to stop the server');
  });
}

// Check command line arguments to determine startup mode
if (process.argv.includes('--no-db') || process.argv.includes('--simple')) {
  startWithoutMongoDB();
} else {
  startWithMongoDB();
}