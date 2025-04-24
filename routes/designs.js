const express = require('express');
const router = express.Router();

// Import models (uncomment and adjust when you have the models)
// const Design = require('../models/Design');

/**
 * @route   GET /api/designs
 * @desc    Get all designs for a user
 * @access  Private
 */
router.get('/', async (req, res) => {
  try {
    // When you have authentication set up, get the user ID from the token
    // const userId = req.user.id;
    
    // Temporary mock data until database is set up
    const designs = [
      {
        id: 1,
        name: 'My Custom T-Shirt',
        productType: 'tshirt',
        colors: ['#ff0000', '#000000'],
        patterns: ['stripes'],
        images: ['logo.png'],
        modelUrl: '/models/tshirt.glb',
        createdAt: new Date(),
        // userId: req.user.id
      },
      {
        id: 2,
        name: 'Party Hoodie',
        productType: 'hoodie',
        colors: ['#0000ff', '#ffffff'],
        patterns: [],
        images: ['party-graphics.png'],
        modelUrl: '/models/hoodie.glb',
        createdAt: new Date(),
        // userId: req.user.id
      }
    ];

    // When database is ready, use this:
    // const designs = await Design.find({ userId: userId });
    
    res.json(designs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/designs/:id
 * @desc    Get a specific design
 * @access  Private
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Temporary mock data handling
    const designs = [
      {
        id: 1,
        name: 'My Custom T-Shirt',
        productType: 'tshirt',
        colors: ['#ff0000', '#000000'],
        patterns: ['stripes'],
        images: ['logo.png'],
        modelUrl: '/models/tshirt.glb',
        createdAt: new Date(),
        // userId: req.user.id
      },
      {
        id: 2,
        name: 'Party Hoodie',
        productType: 'hoodie',
        colors: ['#0000ff', '#ffffff'],
        patterns: [],
        images: ['party-graphics.png'],
        modelUrl: '/models/hoodie.glb',
        createdAt: new Date(),
        // userId: req.user.id
      }
    ];
    
    const design = designs.find(d => d.id === parseInt(id));
    
    if (!design) {
      return res.status(404).json({ message: 'Design not found' });
    }

    // When database is ready, use this:
    // const design = await Design.findById(id);
    // if (!design) {
    //   return res.status(404).json({ message: 'Design not found' });
    // }
    // 
    // // Check if the design belongs to the user
    // if (design.userId.toString() !== req.user.id) {
    //   return res.status(401).json({ message: 'Not authorized' });
    // }
    
    res.json(design);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/designs
 * @desc    Create a new design
 * @access  Private
 */
router.post('/', async (req, res) => {
  try {
    // Implement design creation when database is ready
    // const { name, productType, colors, patterns, images, modelUrl } = req.body;
    // const newDesign = new Design({
    //   name,
    //   productType,
    //   colors,
    //   patterns,
    //   images,
    //   modelUrl,
    //   userId: req.user.id
    // });
    // await newDesign.save();
    
    res.status(201).json({ message: 'Design creation endpoint (not implemented yet)' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   PUT /api/designs/:id
 * @desc    Update a design
 * @access  Private
 */
router.put('/:id', async (req, res) => {
  try {
    // Implement design update when database is ready
    // const { id } = req.params;
    // const { name, productType, colors, patterns, images, modelUrl } = req.body;
    //
    // // First find the design to check ownership
    // const design = await Design.findById(id);
    // if (!design) {
    //   return res.status(404).json({ message: 'Design not found' });
    // }
    //
    // // Check if the design belongs to the user
    // if (design.userId.toString() !== req.user.id) {
    //   return res.status(401).json({ message: 'Not authorized' });
    // }
    //
    // // Update the design
    // const updatedDesign = await Design.findByIdAndUpdate(
    //   id,
    //   { name, productType, colors, patterns, images, modelUrl },
    //   { new: true }
    // );
    
    res.json({ message: 'Design update endpoint (not implemented yet)' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   DELETE /api/designs/:id
 * @desc    Delete a design
 * @access  Private
 */
router.delete('/:id', async (req, res) => {
  try {
    // Implement design deletion when database is ready
    // const { id } = req.params;
    //
    // // First find the design to check ownership
    // const design = await Design.findById(id);
    // if (!design) {
    //   return res.status(404).json({ message: 'Design not found' });
    // }
    //
    // // Check if the design belongs to the user
    // if (design.userId.toString() !== req.user.id) {
    //   return res.status(401).json({ message: 'Not authorized' });
    // }
    //
    // // Delete the design
    // await Design.findByIdAndDelete(id);
    
    res.json({ message: 'Design deletion endpoint (not implemented yet)' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 