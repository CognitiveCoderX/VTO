const express = require('express');
const router = express.Router();

// Import models (uncomment and adjust when you have the models)
// const Product = require('../models/Product');

/**
 * @route   GET /api/products
 * @desc    Get all products
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    // Temporary mock data until database is set up
    const products = [
      {
        id: 1,
        name: 'Premium Long Sleeve Shirt',
        price: 49.99,
        description: 'High-quality long sleeve shirt with customizable design options.',
        category: 'shirts',
        imageUrl: '/images/products/long-sleeve-shirt.jpg',
        modelUrl: 'https://res.cloudinary.com/customxshop/image/upload/v1744037917/CustomXShop/l4plnsl7o5r6qqxotasx.glb'
      },
      {
        id: 2,
        name: 'Designer Jacket',
        price: 79.99,
        description: 'Stylish and comfortable jacket for all seasons with custom options.',
        category: 'jackets',
        imageUrl: '/images/products/jacket.jpg',
        modelUrl: 'https://res.cloudinary.com/customxshop/image/upload/v1744041395/jacket.compressed_xfe0sv.glb'
      },
      {
        id: 3,
        name: 'Casual Check Shirt',
        price: 44.99,
        description: 'Classic check pattern shirt with modern customization options.',
        category: 'shirts',
        imageUrl: '/images/products/check-shirt.jpg',
        modelUrl: 'https://res.cloudinary.com/customxshop/image/upload/v1744041431/check_shirt.compressed_u3k3bc.glb'
      }
    ];

    // When database is ready, use this:
    // const products = await Product.find();
    
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/products/:id
 * @desc    Get product by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Temporary mock data handling
    const products = [
      {
        id: 1,
        name: 'Premium Long Sleeve Shirt',
        price: 49.99,
        description: 'High-quality long sleeve shirt with customizable design options.',
        category: 'shirts',
        imageUrl: '/images/products/long-sleeve-shirt.jpg',
        modelUrl: 'https://res.cloudinary.com/customxshop/image/upload/v1744037917/CustomXShop/l4plnsl7o5r6qqxotasx.glb'
      },
      {
        id: 2,
        name: 'Designer Jacket',
        price: 79.99,
        description: 'Stylish and comfortable jacket for all seasons with custom options.',
        category: 'jackets',
        imageUrl: '/images/products/jacket.jpg',
        modelUrl: 'https://res.cloudinary.com/customxshop/image/upload/v1744041395/jacket.compressed_xfe0sv.glb'
      },
      {
        id: 3,
        name: 'Casual Check Shirt',
        price: 44.99,
        description: 'Classic check pattern shirt with modern customization options.',
        category: 'shirts',
        imageUrl: '/images/products/check-shirt.jpg',
        modelUrl: 'https://res.cloudinary.com/customxshop/image/upload/v1744041431/check_shirt.compressed_u3k3bc.glb'
      }
    ];
    
    const product = products.find(p => p.id === parseInt(id));
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // When database is ready, use this:
    // const product = await Product.findById(id);
    // if (!product) {
    //   return res.status(404).json({ message: 'Product not found' });
    // }
    
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/products
 * @desc    Create a product
 * @access  Private (Admin)
 */
router.post('/', async (req, res) => {
  try {
    // Implement product creation when database is ready
    // const { name, price, description, category, imageUrl, modelUrl } = req.body;
    // const newProduct = new Product({ name, price, description, category, imageUrl, modelUrl });
    // await newProduct.save();
    
    res.status(201).json({ message: 'Product creation endpoint (not implemented yet)' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   PUT /api/products/:id
 * @desc    Update a product
 * @access  Private (Admin)
 */
router.put('/:id', async (req, res) => {
  try {
    // Implement product update when database is ready
    // const { id } = req.params;
    // const { name, price, description, category, imageUrl, modelUrl } = req.body;
    // const product = await Product.findByIdAndUpdate(
    //   id, 
    //   { name, price, description, category, imageUrl, modelUrl }, 
    //   { new: true }
    // );
    // if (!product) {
    //   return res.status(404).json({ message: 'Product not found' });
    // }
    
    res.json({ message: 'Product update endpoint (not implemented yet)' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete a product
 * @access  Private (Admin)
 */
router.delete('/:id', async (req, res) => {
  try {
    // Implement product deletion when database is ready
    // const { id } = req.params;
    // const product = await Product.findByIdAndDelete(id);
    // if (!product) {
    //   return res.status(404).json({ message: 'Product not found' });
    // }
    
    res.json({ message: 'Product deletion endpoint (not implemented yet)' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 